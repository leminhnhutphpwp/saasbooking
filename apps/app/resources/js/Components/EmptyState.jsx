import { cn } from '@/lib/utils';

/**
 * Empty-list placeholder v2: icon in a tinted circle + title + hint +
 * optional example text + optional primary action.
 *
 * Centered with a sensible min-height so it looks intentional, not a bare box.
 *
 * Usage:
 *   <EmptyState icon={CalendarDays} title="Chưa có lịch nào"
 *     description="Chưa có ai đặt sân trong ngày này."
 *     example="Ví dụ: Sân A1 · 08:00–09:00"
 *     action={<Button>Đặt hộ</Button>} />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  example,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/80 text-muted-foreground">
          <Icon className="h-8 w-8" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {example && (
        <p className="mt-2 max-w-sm rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
          {example}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
