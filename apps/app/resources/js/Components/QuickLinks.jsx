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
    { key: 'calendar',  href: 'manager.calendar.index',  icon: CalendarDays,  label: 'Lịch đặt sân', tint: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:group-hover:bg-violet-950/70' },
    { key: 'walkin',    href: 'manager.calendar.index',  icon: CalendarPlus,  label: 'Đặt hộ',       tint: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:group-hover:bg-indigo-950/70' },
    { key: 'refunds',   href: 'manager.refunds.index',   icon: HandCoins,     label: 'Hoàn cọc',     tint: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:group-hover:bg-rose-950/70' },
    { key: 'reconcile', href: 'manager.reconcile.index', icon: Building2,     label: 'Đối soát',     tint: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:group-hover:bg-amber-950/70' },
    { key: 'reports',   href: 'manager.reports.index',   icon: BarChart3,     label: 'Báo cáo',      tint: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:group-hover:bg-emerald-950/70' },
    { key: 'settings',  href: 'manager.courts.index',    icon: Settings2,     label: 'Cấu hình',     tint: 'bg-sky-50 text-sky-600 group-hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:group-hover:bg-sky-950/70' },
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
