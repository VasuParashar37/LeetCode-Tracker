import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link as LinkIcon } from 'lucide-react';
import { Difficulty } from '@/types/question';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';

interface AddQuestionFormProps {
  onAdd: (title: string, difficulty: Difficulty, link?: string) => void;
  initialTitle?: string;
  initialDifficulty?: Difficulty;
  initialLink?: string;
  autoAddToken?: string;
  onAutoAddHandled?: () => void;
}

export const AddQuestionForm = ({
  onAdd,
  initialTitle = '',
  initialDifficulty = 'Medium',
  initialLink = '',
  autoAddToken,
  onAutoAddHandled,
}: AddQuestionFormProps) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [link, setLink] = useState('');
  const [showLink, setShowLink] = useState(false);
  const handledAutoAddTokenRef = useRef<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), difficulty, link.trim() || undefined);
    setTitle('');
    setLink('');
    setShowLink(false);
  };

  const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

  useEffect(() => {
    setTitle(initialTitle);
    setDifficulty(initialDifficulty);
    setLink(initialLink);
    setShowLink(Boolean(initialLink));
  }, [initialTitle, initialDifficulty, initialLink]);

  useEffect(() => {
    if (!autoAddToken || handledAutoAddTokenRef.current === autoAddToken) return;
    if (!title.trim()) return;
    onAdd(title.trim(), difficulty, link.trim() || undefined);
    handledAutoAddTokenRef.current = autoAddToken;
    onAutoAddHandled?.();
    setTitle('');
    setLink('');
    setShowLink(false);
  }, [autoAddToken, title, difficulty, link, onAdd, onAutoAddHandled]);

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-card p-4 space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="Question title (e.g., Two Sum)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 bg-background/50 border-border/50 font-mono placeholder:font-sans focus:border-primary"
        />
        
        <div className="flex gap-1.5">
          {difficulties.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                "px-3 py-2 text-xs font-mono font-medium rounded-md border transition-all duration-200",
                difficulty === d
                  ? d === 'Easy'
                    ? "difficulty-easy border-easy"
                    : d === 'Medium'
                    ? "difficulty-medium border-medium"
                    : "difficulty-hard border-hard"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {showLink ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-3"
        >
          <Input
            type="url"
            placeholder="LeetCode problem URL (optional)"
            value={link}
            onChange={e => setLink(e.target.value)}
            className="flex-1 bg-background/50 border-border/50 font-mono text-sm placeholder:font-sans focus:border-primary"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowLink(false);
              setLink('');
            }}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </motion.div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLink(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Add problem link
        </button>
      )}

      <Button
        type="submit"
        disabled={!title.trim()}
        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium glow-effect"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Solved Question
      </Button>
    </motion.form>
  );
};
