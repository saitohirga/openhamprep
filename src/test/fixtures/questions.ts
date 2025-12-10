import type { Question } from '@/hooks/useQuestions';

/**
 * Mock question data for testing
 * These fixtures can be imported and used across all test files
 */

export const mockTechnicianQuestion: Question = {
  id: 'T1A01',
  question: 'What is the maximum transmitting power an amateur station may use?',
  options: {
    A: '200 watts PEP output',
    B: '1000 watts PEP output',
    C: '1500 watts PEP output',
    D: '2000 watts PEP output',
  },
  correctAnswer: 'C',
  subelement: 'T1',
  group: 'T1A',
  links: [],
  explanation: 'FCC regulations specify 1500 watts PEP output as the maximum power.',
};

export const mockGeneralQuestion: Question = {
  id: 'G1A01',
  question: 'What is the purpose of a power supply bleeder resistor?',
  options: {
    A: 'To discharge stored energy',
    B: 'To cool the transformer',
    C: 'To filter noise',
    D: 'To regulate voltage',
  },
  correctAnswer: 'A',
  subelement: 'G1',
  group: 'G1A',
  links: [
    {
      url: 'https://example.com/power-supply',
      title: 'Power Supply Safety',
      description: 'Understanding bleeder resistors',
      image: 'https://example.com/image.jpg',
      type: 'article' as const,
      siteName: 'Ham Radio Guide',
    },
  ],
  explanation: 'Bleeder resistors discharge capacitors for safety.',
};

export const mockExtraQuestion: Question = {
  id: 'E1A01',
  question: 'What is the maximum bandwidth permitted in the 60-meter band?',
  options: {
    A: '2.8 kHz',
    B: '5.6 kHz',
    C: '10 kHz',
    D: '20 kHz',
  },
  correctAnswer: 'A',
  subelement: 'E1',
  group: 'E1A',
  links: [],
  explanation: '2.8 kHz is the maximum permitted bandwidth on 60 meters.',
};

export const mockQuestionWithoutExplanation: Question = {
  id: 'T2A01',
  question: 'What is a common repeater frequency offset in the 2-meter band?',
  options: {
    A: '600 kHz',
    B: '1.0 MHz',
    C: '1.6 MHz',
    D: '5.0 MHz',
  },
  correctAnswer: 'A',
  subelement: 'T2',
  group: 'T2A',
  links: [],
  explanation: null,
};

/**
 * Array of mock questions for practice tests
 */
export const mockQuestionsArray: Question[] = [
  mockTechnicianQuestion,
  mockGeneralQuestion,
  mockExtraQuestion,
  mockQuestionWithoutExplanation,
];

/**
 * Generate multiple questions with specified parameters
 */
export function createMockQuestions(count: number, overrides?: Partial<Question>): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockTechnicianQuestion,
    id: `T${i + 1}A01`,
    question: `Test question ${i + 1}`,
    ...overrides,
  }));
}
