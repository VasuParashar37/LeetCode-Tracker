import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, CheckCircle, AlertCircle, RotateCcw, Zap, Search, LogOut } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQuestions } from '@/hooks/useQuestions';
import { useAuth } from '@/hooks/useAuth';
import { AddQuestionForm } from '@/components/AddQuestionForm';
import { QuestionCard } from '@/components/QuestionCard';
import { StatsCard } from '@/components/StatsCard';
import { EmptyState } from '@/components/EmptyState';
import { AuthForm } from '@/components/AuthForm';
import { isSolvedToday, isRevisionDue } from '@/lib/dateUtils';
import { Difficulty } from '@/types/question';
import { Input } from '@/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Button } from '@/ui/button';
import { toast } from '@/ui/use-toast';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const {
    questions,
    addQuestion,
    markRevised,
    deleteQuestion,
    updateSolvedAt,
    isLoaded,
  } = useQuestions(user?.id);

  const sanitizeDifficulty = (value: string | null): Difficulty => {
    const normalized = (value ?? '').toLowerCase();
    if (normalized === 'easy') return 'Easy';
    if (normalized === 'hard') return 'Hard';
    return 'Medium';
  };

  const prefillTitle = searchParams.get('title') ?? '';
  const prefillDifficulty = sanitizeDifficulty(searchParams.get('difficulty'));
  const prefillLink = searchParams.get('link') ?? '';
  const autoAddToken = searchParams.get('auto') === '1' ? searchParams.toString() : undefined;

  const handleAutoAddHandled = () => {
    setSearchParams({}, { replace: true });
  };

  const { todayQuestions, revisionDueQuestions, stats } = useMemo(() => {
    const today = questions.filter(q => isSolvedToday(q.solvedAt));
    const revisionDue = questions.filter(q =>
      isRevisionDue(q.revisionCount > 0 ? q.lastRevisedAt : q.solvedAt)
    );
    
    return {
      todayQuestions: today,
      revisionDueQuestions: revisionDue,
      stats: {
        total: questions.length,
        today: today.length,
        needsRevision: revisionDue.length,
        totalRevisions: questions.reduce((acc, q) => acc + q.revisionCount, 0),
      },
    };
  }, [questions]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (title: string, difficulty: string, link?: string) => {
    if (!normalizedSearchQuery) return true;
    const haystack = `${title} ${difficulty} ${link ?? ''}`.toLowerCase();
    return haystack.includes(normalizedSearchQuery);
  };

  const filteredTodayQuestions = todayQuestions.filter(q =>
    matchesSearch(q.title, q.difficulty, q.link)
  );
  const filteredRevisionDueQuestions = revisionDueQuestions.filter(q =>
    matchesSearch(q.title, q.difficulty, q.link)
  );
  const filteredAllQuestions = questions.filter(q =>
    matchesSearch(q.title, q.difficulty, q.link)
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You can sign back in whenever you want.',
      });
    } catch (error) {
      toast({
        title: 'Sign out failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isAuthLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground font-mono">LeetCode Tracker</h1>
                <p className="text-xs text-muted-foreground">Track progress. Master patterns.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="hidden text-xs text-muted-foreground sm:block">{user.email}</p>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <StatsCard icon={Zap} label="Total Solved" value={stats.total} />
          <StatsCard icon={CheckCircle} label="Today" value={stats.today} variant="success" />
          <StatsCard 
            icon={AlertCircle} 
            label="Needs Revision" 
            value={stats.needsRevision} 
            variant={stats.needsRevision > 0 ? 'warning' : 'default'} 
          />
          <StatsCard icon={RotateCcw} label="Revisions Done" value={stats.totalRevisions} />
        </motion.div>

        {/* Add Question Form */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Add Solved Question
          </h2>
          <AddQuestionForm
            onAdd={addQuestion}
            initialTitle={prefillTitle}
            initialDifficulty={prefillDifficulty}
            initialLink={prefillLink}
            autoAddToken={autoAddToken}
            onAutoAddHandled={handleAutoAddHandled}
          />
        </section>

        <section className="mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, difficulty, or link"
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
        </section>

        {/* Tabs for Today / Revisions / All */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="bg-secondary/30 border border-border/50">
            <TabsTrigger value="today" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Today ({filteredTodayQuestions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="revision" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Needs Revision ({filteredRevisionDueQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All ({filteredAllQuestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTodayQuestions.length > 0 ? (
                filteredTodayQuestions.map(q => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    onMarkRevised={markRevised}
                    onDelete={deleteQuestion}
                    onUpdateSolvedAt={updateSolvedAt}
                  />
                ))
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title={normalizedSearchQuery ? 'No matching questions for today' : 'No questions solved today'}
                  description={
                    normalizedSearchQuery
                      ? 'Try a different search keyword.'
                      : 'Add a question you solved to start tracking your progress!'
                  }
                />
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="revision" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredRevisionDueQuestions.length > 0 ? (
                filteredRevisionDueQuestions.map(q => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    onMarkRevised={markRevised}
                    onDelete={deleteQuestion}
                    onUpdateSolvedAt={updateSolvedAt}
                    showRevisionStatus
                  />
                ))
              ) : (
                <EmptyState
                  icon={AlertCircle}
                  title={normalizedSearchQuery ? 'No matching revision items' : 'All caught up!'}
                  description={
                    normalizedSearchQuery
                      ? 'Try a different search keyword.'
                      : 'No questions need revision right now. Keep solving new ones!'
                  }
                />
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="all" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredAllQuestions.length > 0 ? (
                filteredAllQuestions.map(q => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    onMarkRevised={markRevised}
                    onDelete={deleteQuestion}
                    onUpdateSolvedAt={updateSolvedAt}
                    showRevisionStatus
                  />
                ))
              ) : (
                <EmptyState
                  icon={Code2}
                  title={normalizedSearchQuery ? 'No matching questions found' : 'No questions yet'}
                  description={
                    normalizedSearchQuery
                      ? 'Try a different search keyword.'
                      : 'Start by adding the first question you solved today!'
                  }
                />
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
