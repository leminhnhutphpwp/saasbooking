import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

/**
 * A single dashboard stat tile: label + big value, with an optional icon and
 * an optional trend line. Matches the calendar stat tiles.
 *
 * Usage:
 *   <StatCard label="Tổng đặt" value={12} icon={CalendarDays} />
 *   <StatCard label="Đã xác nhận" value={8} icon={Check} accent="emerald" />
 */

const ACCENTS = {
  default: 'text-foreground',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  primary: 'text-primary',
};

const ICON_BG = {
  default: 'bg-muted text-muted-foreground',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
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
  className,
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className={cn('text-2xl font-bold', ACCENTS[accent])}>
            {value}
          </div>
          {trend && (
            <div className="text-xs text-muted-foreground">{trend}</div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              ICON_BG[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
