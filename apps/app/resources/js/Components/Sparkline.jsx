import { cn } from '@/lib/utils';

/**
 * Simple sparkline chart using SVG polyline.
 * Renders a line chart with optional area fill.
 */
export function Sparkline({ data, className, height = 40, strokeColor = 'currentColor', fillColor = 'currentColor', fillOpacity = 0.1 }) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const width = 100;
    const padding = 2;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - min) / range) * chartHeight;
        return `${x},${y}`;
    });

    const polylinePoints = points.join(' ');
    const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={cn('w-full', className)}
            style={{ height: `${height}px` }}
            preserveAspectRatio="none"
        >
            <polygon
                points={areaPoints}
                fill={fillColor}
                fillOpacity={fillOpacity}
            />
            <polyline
                points={polylinePoints}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
