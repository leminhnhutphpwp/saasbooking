import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

/**
 * Consistent page-top header used across manager pages:
 * optional back button/breadcrumb + title (h1) + description + actions slot.
 *
 * Usage:
 *   <PageHeader title="Lịch đặt sân" description="..." actions={<Button/>} />
 *   <PageHeader backHref="/manager/courts" title="Giờ mở cửa — Sân A1" />
 */
export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  className,
  children,
}) {
  return (
        <div
          className={cn(
            'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel || 'Quay lại'}
          </Link>
        )}
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
