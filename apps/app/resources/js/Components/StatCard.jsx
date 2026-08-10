import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  action,
  chart,
  className,
}) {
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
            <div className="manager-card-title text-muted-foreground">{label}</div>
            <div className="manager-metric text-3xl leading-9">
              {value}
            </div>
            {trend && (
              <div className="text-xs text-muted-foreground">{trend}</div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                'ui-well flex h-10 w-10 shrink-0 items-center justify-center',
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {chart && (
          <div className="mt-4 pt-4">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
