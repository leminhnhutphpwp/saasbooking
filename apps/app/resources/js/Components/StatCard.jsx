import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

const ACCENTS = {
  default: 'text-foreground',
  violet: 'text-orange-600 dark:text-orange-400',
  emerald: 'text-orange-600 dark:text-orange-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  primary: 'text-primary',
};

const ICON_BG = {
  default: 'bg-muted text-muted-foreground',
  violet: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  emerald: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
  primary: 'bg-primary/10 text-primary',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'default',
  trend,
  action,
  chart,
  className,
}) {
  const accentClass = ACCENTS[accent] ?? accent;
  const iconBgClass = ICON_BG[accent] ?? 'bg-muted text-muted-foreground';

  return (
    <Card className={cn('relative', className)}>
      {action && (
        <div className="absolute right-4 top-4">
          {action}
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className={cn('text-4xl font-bold leading-none tracking-tight', accentClass)}>
              {value}
            </div>
            {trend && (
              <div className="text-xs text-muted-foreground">{trend}</div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                iconBgClass,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {chart && (
          <div className="mt-4 border-t border-border pt-4">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
