import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const StatsCard = ({ icon: Icon, label, value, variant = 'default' }: StatsCardProps) => {
  const variants = {
    default: 'text-foreground',
    success: 'text-easy',
    warning: 'text-medium',
    danger: 'text-destructive',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-secondary/50", variants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={cn("text-2xl font-mono font-bold", variants[variant])}>{value}</p>
        </div>
      </div>
    </motion.div>
  );
};
