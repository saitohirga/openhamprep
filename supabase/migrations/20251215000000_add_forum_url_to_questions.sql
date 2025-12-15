-- Add forum_url column to questions table for storing Discourse topic URLs
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS forum_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.questions.forum_url IS 'URL to the Discourse forum topic for this question';
