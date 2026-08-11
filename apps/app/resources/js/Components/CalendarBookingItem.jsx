import { Link } from '@inertiajs/react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/Components/ui/tooltip';
import { StatusBadge } from '@/Components/StatusBadge';
import { formatVND } from '@/lib/format';
import { User } from 'lucide-react';

const STATUS_STYLE = {
    confirmed: {
        border: 'var(--turf-600)',
        label: 'Đã xác nhận',
    },
    pending_deposit: {
        border: 'var(--warn)',
        label: 'Chờ cọc',
    },
    completed: {
        border: 'var(--turf-600)',
        label: 'Đã hoàn tất',
    },
    cancelled: {
        border: 'var(--ink-mute)',
        label: 'Đã hủy',
    },
    expired: {
        border: 'var(--ink-mute)',
        label: 'Hết hạn',
    },
    no_show: {
        border: 'var(--danger)',
        label: 'Bom sân',
    },
};

export default function CalendarBookingItem({ booking, courtName, heightPx }) {
    const s = STATUS_STYLE[booking.status] ?? STATUS_STYLE.confirmed;

    const showTime = heightPx >= 38;
    const showCode = heightPx >= 60;
    const showAmount = heightPx >= 80;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={`/manager/bookings/${booking.uuid}`}
                        aria-label={`${booking.customer || 'Khách'} · ${booking.start}–${booking.end} · ${s.label}`}
                        className="absolute inset-x-0.5 bottom-0.5 z-10 flex flex-col overflow-hidden rounded-[8px] bg-white text-left shadow-[0_1px_3px_rgba(0,0,0,.08)] transition-shadow hover:shadow-[0_2px_6px_rgba(0,0,0,.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        style={{ borderLeft: `4px solid ${s.border}` }}
                    >
                        <div className="flex flex-1 flex-col gap-0.5 px-2.5 py-1.5 min-h-0">
                            {/* Title: customer name — always visible */}
                            <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
                                {booking.customer || 'Chưa có tên'}
                            </span>

                            {/* Time range */}
                            {showTime && (
                                <span className="truncate text-[11px] leading-tight text-ink-soft tabular-nums">
                                    {booking.start}–{booking.end}
                                </span>
                            )}

                            {/* Booking code */}
                            {showCode && booking.code && (
                                <span className="truncate text-[10px] leading-tight text-ink-mute tabular-nums">
                                    {booking.code}
                                </span>
                            )}

                            {/* Amount */}
                            {showAmount && booking.amount != null && (
                                <span className="truncate text-[10px] leading-tight tabular-nums text-ink-soft">
                                    {formatVND(booking.amount)}
                                </span>
                            )}
                        </div>
                    </Link>
                </TooltipTrigger>

                <TooltipContent side="right" className="space-y-1.5 max-w-[220px]">
                    <p className="font-semibold text-foreground">{booking.customer || 'Chưa có tên'}</p>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p className="tabular-nums">{booking.start}–{booking.end} · {courtName}</p>
                        {booking.code && <p className="tabular-nums">Mã: {booking.code}</p>}
                        {booking.amount != null && <p className="tabular-nums">{formatVND(booking.amount)}</p>}
                        <p>{booking.channel === 'zalo' ? 'Đặt qua Zalo' : 'Đặt tại sân'}</p>
                    </div>
                    <StatusBadge type="booking" value={booking.status} />
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
