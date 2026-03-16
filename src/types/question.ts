export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionHistoryEventType = 'solved' | 'solved-date-updated' | 'revised';

export interface QuestionHistoryEvent {
  id: string;
  type: QuestionHistoryEventType;
  at: string; // ISO date string
  from?: string; // ISO date string (for solved-date-updated)
  to?: string; // ISO date string (for solved-date-updated)
}

export interface Question {
  id: string;
  title: string;
  difficulty: Difficulty;
  link?: string;
  solvedAt: string; // ISO date string
  lastRevisedAt: string; // ISO date string
  revisionCount: number;
  history: QuestionHistoryEvent[];
}

export const REVISION_INTERVAL_DAYS = 7;
