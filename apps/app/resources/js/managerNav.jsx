import {
    BarChart3,
    Building2,
    CalendarDays,
    ClipboardList,
    Eye,
    LayoutDashboard,
    Palette,
    Repeat,
    RotateCcw,
    Users,
} from 'lucide-react';

export const managerNav = [
    {
        title: 'Chính',
        items: [
            { title: 'Trang chủ', href: 'manager.home', icon: LayoutDashboard },
            { title: 'Lịch đặt sân', href: 'manager.calendar.index', icon: CalendarDays },
            { title: 'Đơn đặt sân', href: 'manager.bookings.index', icon: ClipboardList },
            { title: 'Khách hàng', href: 'manager.customers.index', icon: Users },
        ],
    },
    {
        title: 'Danh mục',
        items: [
            { title: 'Danh sách sân', href: 'manager.courts.index', icon: Building2 },
            { title: 'Đặt cố định', href: 'manager.series.index', icon: Repeat },
        ],
    },
    {
        title: 'Tài chính',
        items: [
            { title: 'Hoàn cọc', href: 'manager.refunds.index', icon: RotateCcw },
            { title: 'Đối soát', href: 'manager.reconcile.index', icon: Eye },
            { title: 'Báo cáo', href: 'manager.reports.index', icon: BarChart3 },
        ],
    },
    {
        title: 'Cài đặt',
        items: [
            { title: 'Thông tin sân', href: 'manager.venue.edit', icon: Building2 },
            { title: 'Thương hiệu', href: 'manager.branding.edit', icon: Palette },
        ],
    },
];
