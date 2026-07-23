import {
    Building2,
    CalendarDays,
    Clock,
    Eye,
    Palette,
    Repeat,
    RotateCcw,
} from 'lucide-react';

export const managerNav = [
    {
        title: 'Vận hành',
        items: [
            { title: 'Lịch đặt sân', href: 'manager.calendar.index', icon: CalendarDays },
            { title: 'Đặt cố định', href: 'manager.series.index', icon: Repeat },
            { title: 'Hoàn cọc', href: 'manager.refunds.index', icon: RotateCcw },
            { title: 'Đối soát', href: 'manager.reconcile.index', icon: Eye },
        ],
    },
    {
        title: 'Cấu hình',
        items: [
            { title: 'Danh sách sân', href: 'manager.courts.index', icon: Building2 },
            { title: 'Giờ & Giá', href: 'manager.courts.index', icon: Clock },
            { title: 'Thương hiệu', href: 'manager.branding.edit', icon: Palette },
        ],
    },
];
