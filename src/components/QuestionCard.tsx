import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RotateCcw, Trash2, Clock, Calendar, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Question } from '@/types/question';
import { DifficultyBadge } from './DifficultyBadge';
import { Button } from '@/ui/button';
import { formatDate, formatDateTime, getDaysUntilRevision, getNextRevisionDate, getRequiredRevisionCount, getRevisionStatus } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  onMarkRevised: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSolvedAt: (id: string, solvedAt: string) => void;
  showRevisionStatus?: boolean;
}

export const QuestionCard = ({
  question,
  onMarkRevised,
  onDelete,
  onUpdateSolvedAt,
  showRevisionStatus = false,
}: QuestionCardProps) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  const toLocalDateInput = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  };

  const revisionBaseDate = question.revisionCount > 0 ? question.lastRevisedAt : question.solvedAt;
  const daysUntil = getDaysUntilRevision(revisionBaseDate);
  const nextRevisionDate = getNextRevisionDate(revisionBaseDate);
  const status = getRevisionStatus(daysUntil);
  const requiredRevisionCount = getRequiredRevisionCount(question.solvedAt);
  const pendingRevisionCount = Math.max(0, requiredRevisionCount - question.revisionCount);

  const handleDateChange = (dateValue: string) => {
    if (!dateValue) return;
    const [year, month, day] = dateValue.split('-').map(Number);
    if (!year || !month || !day) return;
    const nextDate = new Date(question.solvedAt);
    if (Number.isNaN(nextDate.getTime())) return;
    nextDate.setFullYear(year, month - 1, day);
    onUpdateSolvedAt(question.id, nextDate.toISOString());
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    input.showPicker?.();
    input.focus();
    input.click();
  };

  const getHistoryLabel = (event: Question['history'][number]) => {
    if (event.type === 'solved') return 'Solved';
    if (event.type === 'revised') return 'Revised';
    if (event.type === 'solved-date-updated') return 'Solved date changed';
    return 'Updated';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card p-4 sm:p-5 group border border-border/50 hover:border-primary/30 transition-all duration-200"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="font-mono font-semibold text-foreground text-lg leading-tight truncate">
              {question.title}
            </h3>
            <DifficultyBadge difficulty={question.difficulty} />
            <button
              type="button"
              onClick={openDatePicker}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              aria-label="Edit solved time"
              title="Edit solved time"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            {question.link && (
              <a
                href={question.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMarkRevised(question.id)}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Mark revised"
              aria-label="Mark revised"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(question.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete question"
              aria-label="Delete question"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-400/30 rounded-full px-2 py-0.5">
              Solved {formatDateTime(question.solvedAt)}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={toLocalDateInput(question.solvedAt)}
              onChange={e => handleDateChange(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs rounded-full border px-2 py-0.5 border-sky-400/30 text-sky-300 bg-sky-500/10">
              Next revision on {formatDate(nextRevisionDate.toISOString())}
            </span>
            {showRevisionStatus && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5',
                  status === 'overdue' && 'border-destructive/30 text-destructive bg-destructive/10',
                  status === 'due-soon' && 'border-medium/30 text-medium bg-medium/10',
                  status === 'ok' && 'border-violet-400/30 text-violet-300 bg-violet-500/10'
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                {daysUntil < 0
                  ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`
                  : daysUntil === 0
                  ? 'Revision due today'
                  : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} until next revision`}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-full px-2 py-0.5">
                Revised {question.revisionCount}x
              </span>
              <span
                className={cn(
                  'text-xs rounded-full border px-2 py-0.5',
                  pendingRevisionCount > 0
                    ? 'text-amber-300 bg-amber-500/10 border-amber-400/30'
                    : 'text-teal-300 bg-teal-500/10 border-teal-400/30'
                )}
              >
                Required revisions {requiredRevisionCount}x
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(prev => !prev)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/30 border border-border/50 rounded-full px-2 py-0.5 hover:bg-secondary/60 hover:text-foreground transition-colors ml-auto"
              aria-label="Toggle question history"
            >
              <History className="w-3.5 h-3.5" />
              History
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showHistory && (
            <div className="mt-3 rounded-md border border-border/50 bg-background/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Activity</p>
              <div className="space-y-2">
                {question.history.map(event => (
                  <div key={event.id} className="text-xs text-muted-foreground">
                    <span className="text-foreground">{getHistoryLabel(event)}</span>{' '}
                    <span>• {formatDateTime(event.at)}</span>
                    {event.type === 'solved-date-updated' && event.from && event.to && (
                      <div className="mt-1 text-[11px]">
                        from {formatDateTime(event.from)} to {formatDateTime(event.to)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
