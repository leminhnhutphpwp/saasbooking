import { cn } from '@/lib/utils';

/**
 * Consistent page-top header used across manager pages:
 * a title (h1), an optional description, and an optional right-side actions slot.
 *
 * Usage:
 *   <PageHeader title="Lịch đặt sân" description="..." actions={<Button/>} />
 */
export function PageHeader({ title, description, actions, className, children }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
