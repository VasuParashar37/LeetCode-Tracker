import { Difficulty } from '@/types/question';
import { cn } from '@/lib/utils';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export const DifficultyBadge = ({ difficulty, className }: DifficultyBadgeProps) => {
  const baseStyles = 'px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border';
  
  const difficultyStyles = {
    Easy: 'difficulty-easy',
    Medium: 'difficulty-medium',
    Hard: 'difficulty-hard',
  };

  return (
    <span className={cn(baseStyles, difficultyStyles[difficulty], className)}>
      {difficulty}
    </span>
  );
};
