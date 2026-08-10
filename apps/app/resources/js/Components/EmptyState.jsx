import { cn } from '@/lib/utils';

/**
 * Empty-list placeholder with one plain instruction and an optional action.
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
        'flex min-h-56 flex-col items-start justify-center px-6 py-10 text-left',
        className,
      )}
    >
      {Icon && (
          <div className="ui-well mb-4 flex h-10 w-10 items-center justify-center">
            <Icon className="h-5 w-5" />
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
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
