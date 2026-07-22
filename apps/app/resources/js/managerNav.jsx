import { Building2, CalendarDays, Settings, RotateCcw, Palette } from 'lucide-react';

export const managerNav = [
    {
        title: 'Vận hành',
        items: [
            { title: 'Sân', href: 'manager.courts.index', icon: Building2 },
            { title: 'Lịch đặt sân', href: 'manager.calendar.index', icon: CalendarDays },
            { title: 'Hoàn cọc', href: 'manager.refunds.index', icon: RotateCcw },
        ],
    },
    {
        title: 'Cấu hình',
        items: [
            { title: 'Giờ & Giá', href: 'manager.courts.index', icon: Settings },
            { title: 'Thương hiệu', href: 'manager.branding.edit', icon: Palette },
        ],
    },
];
