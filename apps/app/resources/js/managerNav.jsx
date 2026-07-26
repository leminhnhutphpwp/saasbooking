import {
    BarChart3,
    Building2,
    CalendarDays,
    ClipboardList,
    LayoutDashboard,
    Palette,
    Receipt,
    Repeat,
    RotateCcw,
    Settings2,
    Users,
} from 'lucide-react';

export const managerNav = [
    {
        title: 'Tổng quan',
        items: [
            { title: 'Tổng quan', href: 'manager.home', icon: LayoutDashboard },
            { title: 'Khách hàng', href: 'manager.customers.index', icon: Users },
        ],
    },
    {
        title: 'Vận hành',
        items: [
            { title: 'Lịch đặt sân', href: 'manager.calendar.index', icon: CalendarDays },
            { title: 'Đặt sân', href: 'manager.bookings.index', icon: ClipboardList },
            { title: 'Đặt cố định', href: 'manager.series.index', icon: Repeat },
        ],
    },
    {
        title: 'Tài chính',
        items: [
            { title: 'Hoàn cọc', href: 'manager.refunds.index', icon: RotateCcw },
            { title: 'Đối soát', href: 'manager.reconcile.index', icon: Receipt },
        ],
    },
    {
        title: 'Phân tích',
        items: [
            { title: 'Báo cáo', href: 'manager.reports.index', icon: BarChart3 },
        ],
    },
    {
        title: 'Cấu hình',
        items: [
            { title: 'Danh sách sân', href: 'manager.courts.index', icon: Building2 },
            { title: 'Thương hiệu', href: 'manager.branding.edit', icon: Palette },
            { title: 'Cài đặt', href: 'manager.venue.edit', icon: Settings2 },
        ],
    },
];
