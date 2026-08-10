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
 * Shortcuts stay neutral so the page's primary action remains the lone accent.
 */
const LINKS = [
    { key: 'calendar',  href: 'manager.calendar.index',  icon: CalendarDays,  label: 'Lịch đặt sân' },
    { key: 'walkin',    href: 'manager.calendar.index',  icon: CalendarPlus,  label: 'Đặt hộ' },
    { key: 'refunds',   href: 'manager.refunds.index',   icon: HandCoins,     label: 'Hoàn cọc' },
    { key: 'reconcile', href: 'manager.reconcile.index', icon: Building2,     label: 'Đối soát' },
    { key: 'reports',   href: 'manager.reports.index',   icon: BarChart3,     label: 'Báo cáo' },
    { key: 'settings',  href: 'manager.courts.index',    icon: Settings2,     label: 'Cấu hình' },
];

export function QuickLinks({ className }) {
    return (
        <nav className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', className)} aria-label="Truy cập nhanh">
            {LINKS.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.key}
                        href={route(item.href)}
                        className="group flex items-center gap-3 rounded-inner bg-card p-4 text-left shadow-flat transition-shadow duration-150 hover:bg-muted hover:shadow-card"
                    >
                        <div className="ui-well flex h-10 w-10 shrink-0 items-center justify-center transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                            <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
