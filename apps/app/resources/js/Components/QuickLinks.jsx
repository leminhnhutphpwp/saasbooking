import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    Building2,
    CalendarDays,
    CalendarPlus,
    HandCoins,
    Settings2,
} from 'lucide-react';

/**
 * QwenCloud-style quick-link icon row.
 * Each item: icon on top in a soft rounded tile, label under, hover tint + lift.
 */
const LINKS = [
    { key: 'calendar',  href: 'manager.calendar.index',  icon: CalendarDays,  label: 'Lịch đặt sân', tint: 'bg-primary/10 text-primary group-hover:bg-primary/15' },
    { key: 'walkin',    href: 'manager.calendar.index',  icon: CalendarPlus,  label: 'Đặt hộ',       tint: 'bg-primary/10 text-primary group-hover:bg-primary/15' },
    { key: 'refunds',   href: 'manager.refunds.index',   icon: HandCoins,     label: 'Hoàn cọc',     tint: 'bg-primary/10 text-primary group-hover:bg-primary/15' },
    { key: 'reconcile', href: 'manager.reconcile.index', icon: Building2,     label: 'Đối soát',     tint: 'bg-primary/10 text-primary group-hover:bg-primary/15' },
    { key: 'reports',   href: 'manager.reports.index',   icon: BarChart3,     label: 'Báo cáo',      tint: 'bg-primary/10 text-primary group-hover:bg-primary/15' },
    { key: 'settings',  href: 'manager.courts.index',    icon: Settings2,     label: 'Cấu hình',     tint: 'bg-primary/10 text-primary group-hover:bg-primary/15' },
];

export function QuickLinks({ className }) {
    return (
        <div className={cn('grid grid-cols-3 gap-3 sm:grid-cols-6', className)}>
            {LINKS.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.key}
                        href={route(item.href)}
                        className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-colors', item.tint)}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium text-foreground">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
