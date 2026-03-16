import { useEffect, useState } from 'react';
import { Difficulty, Question, QuestionHistoryEvent, QuestionHistoryEventType } from '@/types/question';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/database.types';
import { toast } from '@/ui/use-toast';

type QuestionRow = Database['public']['Tables']['questions']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
type QuestionUpdate = Database['public']['Tables']['questions']['Update'];
type QuestionHistoryRow = Database['public']['Tables']['question_history']['Row'];
type QuestionHistoryInsert = Database['public']['Tables']['question_history']['Insert'];

const sortBySolvedAtDesc = (items: Question[]) =>
  [...items].sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());

const sortHistoryDesc = (history: QuestionHistoryEvent[]) =>
  [...history].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

const normalizeTitle = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeLink = (value?: string) => {
  if (!value) return '';
  try {
    const url = new URL(value.trim());
    const pathname = url.pathname.replace(/\/+$/, '');
    return `${url.hostname.toLowerCase()}${pathname.toLowerCase()}`;
  } catch {
    return value.trim().toLowerCase().replace(/\/+$/, '');
  }
};

const mapHistoryRowToEvent = (row: QuestionHistoryRow): QuestionHistoryEvent => ({
  id: row.id,
  type: row.event_type as QuestionHistoryEventType,
  at: row.event_at,
  from: row.from_value ?? undefined,
  to: row.to_value ?? undefined,
});

const mapRowsToQuestions = (questionRows: QuestionRow[], historyRows: QuestionHistoryRow[]): Question[] => {
  const historyByQuestionId = new Map<string, QuestionHistoryEvent[]>();

  historyRows.forEach(row => {
    const event = mapHistoryRowToEvent(row);
    const existing = historyByQuestionId.get(row.question_id) ?? [];
    existing.push(event);
    historyByQuestionId.set(row.question_id, existing);
  });

  return sortBySolvedAtDesc(
    questionRows.map(row => {
      const history = sortHistoryDesc(historyByQuestionId.get(row.id) ?? []);

      return {
        id: row.id,
        title: row.title,
        difficulty: row.difficulty,
        link: row.link ?? undefined,
        solvedAt: row.solved_at,
        lastRevisedAt: row.last_revised_at,
        revisionCount: row.revision_count,
        history:
          history.length > 0
            ? history
            : [
                {
                  id: crypto.randomUUID(),
                  type: 'solved',
                  at: row.solved_at,
                },
              ],
      };
    })
  );
};

export const useQuestions = (userId?: string) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshQuestions = async (activeUserId: string) => {
    const [questionsResult, historyResult] = await Promise.all([
      supabase
        .from('questions')
          .select('*')
          .order('solved_at', { ascending: false }),
        supabase
          .from('question_history')
          .select('*')
          .order('event_at', { ascending: false }),
    ]);

    if (questionsResult.error || historyResult.error) {
      const message = questionsResult.error?.message ?? historyResult.error?.message ?? 'Unknown error';
      throw new Error(message);
    }

    setQuestions(
      mapRowsToQuestions(
        questionsResult.data ?? [],
        historyResult.data ?? []
      )
    );
    setIsLoaded(true);
    return activeUserId;
  };

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      if (!userId) {
        if (isMounted) {
          setQuestions([]);
          setIsLoaded(true);
        }
        return;
      }

      setIsLoaded(false);
      try {
        await refreshQuestions(userId);
        if (!isMounted) return;
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load tracker data:', error);
        toast({
          title: 'Could not load questions',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
        setQuestions([]);
        setIsLoaded(true);
      }
    };

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const insertHistoryEvent = async (
    questionId: string,
    eventType: QuestionHistoryEventType,
    eventAt: string,
    fromValue?: string,
    toValue?: string
  ) => {
    if (!userId) return null;

    const payload: QuestionHistoryInsert = {
      question_id: questionId,
      user_id: userId,
      event_type: eventType,
      event_at: eventAt,
      from_value: fromValue ?? null,
      to_value: toValue ?? null,
    };

    const { data, error } = await supabase
      .from('question_history')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      toast({
        title: 'Question saved, but history failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    return mapHistoryRowToEvent(data);
  };

  const addQuestion = async (title: string, difficulty: Difficulty, link?: string) => {
    if (!userId) return;

    const now = new Date().toISOString();
    const normalizedTitle = normalizeTitle(title);
    const normalizedLink = normalizeLink(link);

    const existing = questions.find(q => {
      const titleMatches = normalizeTitle(q.title) === normalizedTitle;
      const linkMatches = normalizedLink && normalizeLink(q.link) === normalizedLink;
      return Boolean(linkMatches || titleMatches);
    });

    if (existing) {
      const payload: QuestionUpdate = {
        difficulty: existing.difficulty ?? difficulty,
        link: existing.link || link || null,
        last_revised_at: now,
        revision_count: existing.revisionCount + 1,
      };

      const { data, error } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        toast({
          title: 'Could not update question',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const historyEvent = await insertHistoryEvent(existing.id, 'revised', now);

      setQuestions(prev =>
        prev.map(q =>
          q.id === existing.id
            ? {
                ...q,
                title: data.title,
                difficulty: data.difficulty,
                link: data.link ?? undefined,
                solvedAt: data.solved_at,
                lastRevisedAt: data.last_revised_at,
                revisionCount: data.revision_count,
                history: sortHistoryDesc(historyEvent ? [historyEvent, ...q.history] : q.history),
              }
            : q
        )
      );
      return;
    }

    const payload: QuestionInsert = {
      user_id: userId,
      title,
      difficulty,
      link: link || null,
      solved_at: now,
      last_revised_at: now,
      revision_count: 0,
    };

    const { data, error } = await supabase
      .from('questions')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      toast({
        title: 'Could not save question',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const questionRow = data;
    const solvedEvent = await insertHistoryEvent(questionRow.id, 'solved', now);

    setQuestions(prev =>
      sortBySolvedAtDesc([
        {
          id: questionRow.id,
          title: questionRow.title,
          difficulty: questionRow.difficulty,
          link: questionRow.link ?? undefined,
          solvedAt: questionRow.solved_at,
          lastRevisedAt: questionRow.last_revised_at,
          revisionCount: questionRow.revision_count,
          history: solvedEvent ? [solvedEvent] : [],
        },
        ...prev,
      ])
    );
  };

  const markRevised = async (id: string) => {
    const currentQuestion = questions.find(q => q.id === id);
    if (!currentQuestion) return;

    const now = new Date().toISOString();

    const payload: QuestionUpdate = {
      last_revised_at: now,
      revision_count: currentQuestion.revisionCount + 1,
    };

    const { data, error } = await supabase
      .from('questions')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      toast({
        title: 'Could not mark revision',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const historyEvent = await insertHistoryEvent(id, 'revised', now);
    const updated = data;

    setQuestions(prev =>
      prev.map(q =>
        q.id === id
          ? {
              ...q,
              title: updated.title,
              difficulty: updated.difficulty,
              link: updated.link ?? undefined,
              solvedAt: updated.solved_at,
              lastRevisedAt: updated.last_revised_at,
              revisionCount: updated.revision_count,
              history: sortHistoryDesc(historyEvent ? [historyEvent, ...q.history] : q.history),
            }
          : q
      )
    );
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Could not delete question',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateSolvedAt = async (id: string, solvedAt: string) => {
    const currentQuestion = questions.find(q => q.id === id);
    if (!currentQuestion) return;

    const updatedAt = new Date().toISOString();

    const payload: QuestionUpdate = {
      solved_at: solvedAt,
    };

    const { data, error } = await supabase
      .from('questions')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      toast({
        title: 'Could not update solved date',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const historyEvent = await insertHistoryEvent(id, 'solved-date-updated', updatedAt, currentQuestion.solvedAt, solvedAt);
    const updated = data;

    setQuestions(prev =>
      sortBySolvedAtDesc(
        prev.map(q =>
          q.id === id
            ? {
                ...q,
                title: updated.title,
                difficulty: updated.difficulty,
                link: updated.link ?? undefined,
                solvedAt: updated.solved_at,
                lastRevisedAt: updated.last_revised_at,
                revisionCount: updated.revision_count,
                history: sortHistoryDesc(historyEvent ? [historyEvent, ...q.history] : q.history),
              }
            : q
        )
      )
    );
  };

  return {
    questions,
    addQuestion,
    markRevised,
    deleteQuestion,
    updateSolvedAt,
    isLoaded,
  };
};
