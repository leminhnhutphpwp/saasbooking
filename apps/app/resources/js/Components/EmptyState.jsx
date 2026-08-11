import { AlertCircle, FilterX, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const variantDefaults = {
    'first-use': { icon: PlusCircle },
    'filtered': { icon: FilterX },
    'error': { icon: AlertCircle },
};

export function EmptyState({
    variant,
    icon: Icon,
    title,
    description,
    example,
    action,
    className,
}) {
    const resolvedIcon = Icon ?? (variant ? variantDefaults[variant]?.icon : null);

    return (
        <div
            className={cn(
                'flex min-h-56 flex-col items-start justify-center px-6 py-10 text-left',
                className,
            )}
        >
            {resolvedIcon && (
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--r-well)] bg-sunk text-ink-soft">
                    <resolvedIcon className="h-5 w-5" />
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
                <p className="mt-2 text-xs text-muted-foreground">{example}</p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
