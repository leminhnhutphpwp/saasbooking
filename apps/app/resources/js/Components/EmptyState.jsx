import { cn } from '@/lib/utils';

/**
 * Empty-list placeholder: an optional icon, a title, a description, and an
 * optional action (e.g. a Button).
 *
 * Usage:
 *   <EmptyState icon={CalendarDays} title="Chưa có lịch nào" description="..."
 *     action={<Button>Đặt hộ</Button>} />
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      )}
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
