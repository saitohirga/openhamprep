import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISCOURSE_URL = 'https://forum.openhamprep.com';
const DISCOURSE_USERNAME = 'sonyccd';

const CATEGORY_MAP: Record<string, string> = {
  'T': 'Technician Questions',
  'G': 'General Questions',
  'E': 'Extra Questions',
};

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

interface DiscourseCategory {
  id: number;
  name: string;
  slug: string;
}

interface SyncResult {
  questionId: string;
  status: 'created' | 'skipped' | 'error';
  topicId?: number;
  reason?: string;
}

async function getDiscourseApiKey(): Promise<string> {
  // Check both env var formats - underscore version for local dev, space version for production secrets
  const apiKey = Deno.env.get('DISCOURSE_API_KEY') || Deno.env.get('Discourse API Key');
  if (!apiKey) {
    throw new Error('Discourse API Key not found in secrets. Set DISCOURSE_API_KEY environment variable.');
  }
  return apiKey;
}

async function fetchDiscourseCategories(apiKey: string): Promise<Map<string, number>> {
  const response = await fetch(`${DISCOURSE_URL}/categories.json`, {
    headers: {
      'Api-Key': apiKey,
      'Api-Username': DISCOURSE_USERNAME,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const categoryMap = new Map<string, number>();

  for (const category of data.category_list.categories) {
    categoryMap.set(category.name, category.id);
  }

  return categoryMap;
}

async function fetchExistingTopicsInCategory(
  apiKey: string,
  categoryId: number,
  categorySlug: string
): Promise<Set<string>> {
  const existingQuestionIds = new Set<string>();
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${DISCOURSE_URL}/c/${categorySlug}/${categoryId}.json?page=${page}`,
      {
        headers: {
          'Api-Key': apiKey,
          'Api-Username': DISCOURSE_USERNAME,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch topics for category ${categoryId}: ${response.status}`);
      break;
    }

    const data = await response.json();
    const topics = data.topic_list?.topics || [];

    if (topics.length === 0) {
      hasMore = false;
      break;
    }

    for (const topic of topics) {
      // Extract question ID from topic title (e.g., "T1A01 - Question text")
      const match = topic.title.match(/^([TGE]\d[A-Z]\d{2})\s*-/);
      if (match) {
        existingQuestionIds.add(match[1]);
      }
    }

    page++;
    // Safety limit to prevent infinite loops
    if (page > 50) {
      console.warn('Reached page limit when fetching existing topics');
      break;
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return existingQuestionIds;
}

function formatTopicBody(question: Question): string {
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = letters[question.correct_answer];

  const optionsText = question.options
    .map((opt, i) => `- **${letters[i]})** ${opt}`)
    .join('\n');

  const explanationText = question.explanation
    ? question.explanation
    : '_No explanation yet. Help improve this by contributing below!_';

  return `## Question
${question.question}

## Answer Options
${optionsText}

**Correct Answer: ${correctLetter}**

---

## Explanation
${explanationText}

---
_This topic was automatically created to facilitate community discussion about this exam question. Feel free to share study tips, memory tricks, or additional explanations!_`;
}

async function createDiscourseTopic(
  apiKey: string,
  categoryId: number,
  question: Question
): Promise<{ success: boolean; topicId?: number; error?: string }> {
  // Truncate title if needed (Discourse has a 255 char limit)
  const maxTitleLength = 250;
  let title = `${question.id} - ${question.question}`;
  if (title.length > maxTitleLength) {
    title = title.substring(0, maxTitleLength - 3) + '...';
  }

  const body = formatTopicBody(question);

  try {
    const response = await fetch(`${DISCOURSE_URL}/posts.json`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Api-Username': DISCOURSE_USERNAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        raw: body,
        category: categoryId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, topicId: data.topic_id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function getCategorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '-');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = await getDiscourseApiKey();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action = 'sync', license, batchSize = 50 } = await req.json().catch(() => ({}));

    // Validate batch size (max 100 to stay well within timeout limits)
    const effectiveBatchSize = Math.min(Math.max(1, batchSize), 100);

    console.log(`Starting Discourse sync with action: ${action}, license: ${license || 'all'}, batchSize: ${effectiveBatchSize}`);

    // Fetch category IDs from Discourse
    console.log('Fetching Discourse categories...');
    const categoryIds = await fetchDiscourseCategories(apiKey);

    // Validate required categories exist
    const missingCategories: string[] = [];
    for (const categoryName of Object.values(CATEGORY_MAP)) {
      if (!categoryIds.has(categoryName)) {
        missingCategories.push(categoryName);
      }
    }

    if (missingCategories.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Missing required categories in Discourse',
          missingCategories,
          availableCategories: Array.from(categoryIds.keys()),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which license types to sync
    let licenseFilter: string[] = ['T', 'G', 'E'];
    if (license) {
      const licenseMap: Record<string, string> = {
        'technician': 'T',
        'general': 'G',
        'extra': 'E',
      };
      const prefix = licenseMap[license.toLowerCase()];
      if (!prefix) {
        return new Response(
          JSON.stringify({ error: 'Invalid license type. Use: technician, general, or extra' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      licenseFilter = [prefix];
    }

    // Fetch existing topics for each category to check for duplicates
    console.log('Fetching existing topics from Discourse...');
    const existingTopics = new Set<string>();

    for (const prefix of licenseFilter) {
      const categoryName = CATEGORY_MAP[prefix];
      const categoryId = categoryIds.get(categoryName)!;
      const categorySlug = getCategorySlug(categoryName);

      const topicsInCategory = await fetchExistingTopicsInCategory(apiKey, categoryId, categorySlug);
      for (const id of topicsInCategory) {
        existingTopics.add(id);
      }
    }

    console.log(`Found ${existingTopics.size} existing topics`);

    // Fetch questions from Supabase
    console.log('Fetching questions from database...');
    let query = supabase
      .from('questions')
      .select('id, question, options, correct_answer, explanation');

    // Filter by license if specified
    if (licenseFilter.length === 1) {
      query = query.ilike('id', `${licenseFilter[0]}%`);
    }

    const { data: questions, error: dbError } = await query;

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No questions found to sync', created: 0, skipped: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${questions.length} questions in database`);

    // Filter to only questions that need to be created
    const questionsToCreate = questions.filter(q => !existingTopics.has(q.id));
    const skippedQuestions = questions.filter(q => existingTopics.has(q.id));

    console.log(`${questionsToCreate.length} topics to create, ${skippedQuestions.length} already exist`);

    // For dry-run, return detailed preview of what would be done
    if (action === 'dry-run') {
      // Generate example topics for preview (up to 3 per license type)
      const exampleTopics: Array<{
        questionId: string;
        category: string;
        title: string;
        bodyPreview: string;
      }> = [];

      for (const q of questionsToCreate.slice(0, 9)) {
        const question = q as Question;
        const prefix = question.id[0];
        const countForPrefix = exampleTopics.filter(e => e.questionId[0] === prefix).length;
        if (countForPrefix < 3) {
          const maxTitleLength = 250;
          let title = `${question.id} - ${question.question}`;
          if (title.length > maxTitleLength) {
            title = title.substring(0, maxTitleLength - 3) + '...';
          }
          const body = formatTopicBody(question);
          exampleTopics.push({
            questionId: question.id,
            category: CATEGORY_MAP[prefix],
            title,
            bodyPreview: body.length > 500 ? body.substring(0, 500) + '...' : body,
          });
        }
      }

      // Count by license type
      const countByLicense: Record<string, { toCreate: number; toSkip: number }> = {};
      for (const prefix of ['T', 'G', 'E']) {
        countByLicense[CATEGORY_MAP[prefix]] = {
          toCreate: questionsToCreate.filter((q: Question) => q.id[0] === prefix).length,
          toSkip: skippedQuestions.filter((q: Question) => q.id[0] === prefix).length,
        };
      }

      // Estimate time (1 second per topic)
      const estimatedTimeSeconds = questionsToCreate.length;
      const estimatedTimeMinutes = Math.ceil(estimatedTimeSeconds / 60);

      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary: {
            totalToCreate: questionsToCreate.length,
            totalToSkip: skippedQuestions.length,
            totalInDatabase: questions.length,
            estimatedTime: `~${estimatedTimeMinutes} minute${estimatedTimeMinutes !== 1 ? 's' : ''}`,
          },
          byCategory: countByLicense,
          exampleTopics,
          allQuestionsToCreate: questionsToCreate.map((q: Question) => q.id),
          allQuestionsToSkip: skippedQuestions.map((q: Question) => q.id),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create topics - only process up to batchSize to stay within timeout limits
    const results: SyncResult[] = [];
    let created = 0;
    let errors = 0;

    const batchToProcess = questionsToCreate.slice(0, effectiveBatchSize);
    const remaining = questionsToCreate.length - batchToProcess.length;

    console.log(`Processing batch of ${batchToProcess.length} topics (${remaining} remaining after this batch)`);

    for (const question of batchToProcess) {
      const prefix = question.id[0];
      const categoryName = CATEGORY_MAP[prefix];
      const categoryId = categoryIds.get(categoryName)!;

      console.log(`Creating topic for ${question.id}...`);
      const result = await createDiscourseTopic(apiKey, categoryId, question as Question);

      if (result.success) {
        results.push({ questionId: question.id, status: 'created', topicId: result.topicId });
        created++;
      } else {
        results.push({ questionId: question.id, status: 'error', reason: result.error });
        errors++;
        console.error(`Failed to create topic for ${question.id}: ${result.error}`);
      }

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const isComplete = remaining === 0;

    console.log(`Batch complete. Created: ${created}, Errors: ${errors}, Remaining: ${remaining}`);

    return new Response(
      JSON.stringify({
        success: true,
        complete: isComplete,
        batch: {
          processed: batchToProcess.length,
          created,
          errors,
          skippedAsExisting: skippedQuestions.length,
        },
        progress: {
          totalInDatabase: questions.length,
          alreadyInDiscourse: skippedQuestions.length,
          createdThisBatch: created,
          remainingToCreate: remaining,
          estimatedBatchesRemaining: Math.ceil(remaining / effectiveBatchSize),
        },
        details: results,
        nextAction: isComplete
          ? null
          : `Call again with same parameters to process next batch of ${Math.min(remaining, effectiveBatchSize)} topics`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
