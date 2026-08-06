import {
    BarChart3,
    Building2,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    Eye,
    LayoutDashboard,
    Palette,
    Repeat,
    RotateCcw,
    Settings2,
    Users,
} from 'lucide-react';

export const managerNav = [
    {
        title: 'Tổng quan sân',
        icon: LayoutDashboard,
        items: [
            { title: 'Trang chủ', href: 'manager.home', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Vận hành hằng ngày',
        icon: CalendarDays,
        items: [
            { title: 'Lịch đặt sân', href: 'manager.calendar.index', icon: CalendarDays },
            { title: 'Đơn đặt sân', href: 'manager.bookings.index', icon: ClipboardList },
            { title: 'Khách hàng', href: 'manager.customers.index', icon: Users },
            { title: 'Đặt cố định', href: 'manager.series.index', icon: Repeat },
        ],
    },
    {
        title: 'Tài chính & kiểm soát',
        icon: CircleDollarSign,
        items: [
            { title: 'Hoàn cọc', href: 'manager.refunds.index', icon: RotateCcw },
            { title: 'Đối soát', href: 'manager.reconcile.index', icon: Eye },
            { title: 'Báo cáo', href: 'manager.reports.index', icon: BarChart3 },
        ],
    },
    {
        title: 'Thiết lập sân',
        icon: Settings2,
        items: [
            { title: 'Danh sách sân', href: 'manager.courts.index', icon: Building2 },
            { title: 'Thương hiệu', href: 'manager.branding.edit', icon: Palette },
        ],
    },
];
