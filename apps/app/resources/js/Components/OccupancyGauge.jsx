import { cn } from '@/lib/utils';

/**
 * Circular gauge visualization for occupancy percentage.
 * Uses SVG circle with stroke-dasharray for progress indicator.
 */
export function OccupancyGauge({ value, size = 120, strokeWidth = 12, className }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const getColor = (val) => {
        if (val >= 80) return 'text-emerald-500';
        if (val >= 50) return 'text-primary';
        if (val >= 30) return 'text-amber-500';
        return 'text-muted-foreground';
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg
                width={size}
                height={size}
                className="-rotate-90 transform"
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-muted"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn('transition-all duration-500', getColor(value))}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{value}%</span>
                <span className="text-xs text-muted-foreground">Công suất</span>
            </div>
        </div>
    );
}
