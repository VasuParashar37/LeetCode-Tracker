import { REVISION_INTERVAL_DAYS } from '@/types/question';

export const getDaysUntilRevision = (solvedAt: string): number => {
  const solvedDate = new Date(solvedAt);
  const now = new Date();
  const diffTime = now.getTime() - solvedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return REVISION_INTERVAL_DAYS - diffDays;
};

export const getRequiredRevisionCount = (solvedAt: string): number => {
  const solvedDate = new Date(solvedAt);
  const today = new Date();
  const solvedStart = new Date(solvedDate.getFullYear(), solvedDate.getMonth(), solvedDate.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.floor((todayStart.getTime() - solvedStart.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(diffDays / REVISION_INTERVAL_DAYS));
};

export const getNextRevisionDate = (baseDate: string): Date => {
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + REVISION_INTERVAL_DAYS);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  return dueStart < todayStart ? todayStart : dueDate;
};

export const isRevisionDue = (solvedAt: string): boolean => {
  return getDaysUntilRevision(solvedAt) <= 0;
};

export const isSolvedToday = (solvedAt: string): boolean => {
  const solved = new Date(solvedAt);
  const today = new Date();
  return (
    solved.getDate() === today.getDate() &&
    solved.getMonth() === today.getMonth() &&
    solved.getFullYear() === today.getFullYear()
  );
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getRevisionStatus = (daysUntil: number): 'overdue' | 'due-soon' | 'ok' => {
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 2) return 'due-soon';
  return 'ok';
};
