import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { StatusBadge } from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/Components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_START = 5;
const DAY_END = 23;
const TOTAL_MIN = (DAY_END - DAY_START) * 60;

const STATUS_LABEL = {
    confirmed: 'Đã xác nhận',
    pending_deposit: 'Chờ cọc',
    cancelled: 'Đã hủy',
    expired: 'Hết hạn',
    completed: 'Đã hoàn tất',
    no_show: 'Bom',
};

const STATUS_BORDER = {
    confirmed: '#10b981',
    pending_deposit: '#f59e0b',
    cancelled: '#94a3b8',
    expired: '#94a3b8',
    completed: '#10b981',
    no_show: '#ef4444',
};

function pct(minutes) {
    return ((minutes - DAY_START * 60) / TOTAL_MIN * 100).toFixed(3);
}

function hhmm(iso) {
    return iso.slice(11, 16);
}

function toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

export default function Index({ date, bookings, courts, timeSlots }) {
    const [open, setOpen] = useState(false);
    const [nowPos, setNowPos] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        const tick = () => {
            const d = new Date();
            const localMin = d.getHours() * 60 + d.getMinutes();
            if (localMin >= DAY_START * 60 && localMin < DAY_END * 60) {
                setNowPos(pct(localMin));
            } else {
                setNowPos(null);
            }
        };
        tick();
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, []);

    const form = useForm({
        name: '',
        phone: '',
        court_id: String(courts[0]?.id ?? ''),
        time: '18:00',
        duration: '60',
    });

    const changeDate = (d) => {
        router.get('/manager/calendar', { date: d }, { preserveState: true, preserveScroll: true });
    };

    const goDay = (offset) => {
        const d = new Date(date + 'T12:00:00');
        d.setDate(d.getDate() + offset);
        const next = d.toISOString().slice(0, 10);
        if (next !== date) changeDate(next);
    };

    const goToday = () => changeDate('');

    const openWalkIn = (courtId, time) => {
        form.setData('court_id', String(courtId));
        form.setData('time', time);
        form.setData('name', '');
        form.setData('phone', '');
        form.setData('duration', '60');
        form.clearErrors();
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const [h, m] = form.data.time.split(':').map(Number);
        const endMin = h * 60 + m + Number(form.data.duration);
        const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
        form.transform((d) => ({
            name: d.name, phone: d.phone, court_id: d.court_id,
            start_at: `${date} ${d.time}:00`, end_at: `${date} ${end}:00`,
        })).post('/manager/calendar/walk-in', {
            onSuccess: () => { setOpen(false); form.reset(); },
        });
    };

    const bookingsByCourt = {};
    courts.forEach((c) => { bookingsByCourt[c.id] = []; });
    bookings.forEach((b) => {
        if (bookingsByCourt[b.court_id]) {
            bookingsByCourt[b.court_id].push(b);
        }
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const isToday = date === todayStr;

    return (
        <ManagerLayout header={<h2 className="text-sm font-medium text-muted-foreground">Lịch đặt sân</h2>}>
            <Head title="Lịch đặt sân" />

            <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={() => goDay(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => changeDate(e.target.value)}
                            className="w-44"
                        />
                        <Button variant="outline" size="icon" onClick={() => goDay(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        {!isToday && (
                            <Button variant="secondary" size="sm" onClick={goToday}>
                                Hôm nay
                            </Button>
                        )}
                    </div>
                </div>

                {courts.length === 0 && (
                    <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
                        Chưa có sân nào. Thêm sân trước khi xem lịch.
                    </div>
                )}

                {courts.length > 0 && (
                    <div className="overflow-x-auto" ref={scrollRef}>
                        <div
                            className="grid min-w-[600px]"
                            style={{
                                gridTemplateColumns: `72px repeat(${courts.length}, minmax(180px, 1fr))`,
                            }}
                        >
                            <div className="sticky top-0 z-10 flex h-10 items-center justify-center border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                            </div>
                            {courts.map((court) => (
                                <div
                                    key={court.id}
                                    className="sticky top-0 z-10 flex h-10 items-center justify-center border-b bg-muted/50 px-2 text-sm font-semibold"
                                >
                                    {court.name}
                                </div>
                            ))}

                            <div className="relative col-start-1 row-start-2">
                                {timeSlots.map((slot) => (
                                    <div
                                        key={slot}
                                        className="flex h-8 items-start justify-end pr-2 text-[11px] leading-none text-muted-foreground"
                                    >
                                        {slot.endsWith(':00') ? slot : ''}
                                    </div>
                                ))}
                            </div>

                            {courts.map((court) => {
                                const dayBookings = bookingsByCourt[court.id] ?? [];
                                return (
                                    <div
                                        key={court.id}
                                        className="relative border-l"
                                        style={{ height: timeSlots.length * 32 }}
                                    >
                                        {timeSlots.map((slot, i) => (
                                            <div
                                                key={slot}
                                                className={`h-8 border-b ${i % 2 === 0 ? 'border-gray-100' : 'border-gray-50'}`}
                                            />
                                        ))}

                                        {isToday && nowPos && (
                                            <div
                                                className="absolute left-0 right-0 z-20 border-t-2 border-red-500"
                                                style={{ top: `${nowPos}%` }}
                                            >
                                                <div className="-mt-2 ml-1 h-3 w-3 rounded-full bg-red-500" />
                                            </div>
                                        )}

                                        {dayBookings.map((b) => {
                                            const startMin = toMinutes(hhmm(b.start));
                                            const endMin = toMinutes(hhmm(b.end));
                                            const top = pct(startMin);
                                            const heightPct = Math.max(0, pct(endMin) - pct(startMin));

                                            return (
                                                <TooltipProvider key={`${b.code}-${b.start}`}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className="absolute left-0.5 right-0.5 z-10 cursor-pointer overflow-hidden rounded border-l-4 bg-card px-1 py-0.5 text-[11px] leading-tight shadow-sm"
                                                                style={{ top: `${top}%`, height: `${heightPct}%`, minHeight: 20, borderLeftColor: STATUS_BORDER[b.status] || '#e2e8f0' }}
                                                            >
                                                                <div className="truncate font-semibold">
                                                                    {b.customer}
                                                                </div>
                                                                <div className="truncate opacity-75">
                                                                    {hhmm(b.start)}–{hhmm(b.end)}
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="max-w-[220px] space-y-1">
                                                            <p className="font-semibold">{b.customer}</p>
                                                            <p className="text-xs">{b.phone}</p>
                                                            <p className="text-xs">
                                                                {hhmm(b.start)}–{hhmm(b.end)} · {b.court}
                                                            </p>
                                                            <StatusBadge type="booking" value={b.status} />
                                                            <p className="font-mono text-[10px] opacity-60">{b.code}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })}

                                        {timeSlots.map((slot) => {
                                            const slotMin = toMinutes(slot);
                                            const slotEndMin = slotMin + 30;
                                            const hasBooking = dayBookings.some((b) => {
                                                const bStart = toMinutes(hhmm(b.start));
                                                const bEnd = toMinutes(hhmm(b.end));
                                                return bStart < slotEndMin && bEnd > slotMin;
                                            });
                                            if (hasBooking) return null;
                                            return (
                                                <div
                                                    key={`empty-${slot}`}
                                                    className="absolute left-0 right-0 z-5 cursor-pointer rounded opacity-0 transition-opacity hover:opacity-100 hover:bg-blue-50/60"
                                                    style={{
                                                        top: `${pct(slotMin)}%`,
                                                        height: `${pct(slotMin + 30) - pct(slotMin)}%`,
                                                    }}
                                                    onClick={() => openWalkIn(court.id, slot)}
                                                >
                                                    <div className="flex h-full items-center justify-center text-[10px] text-blue-600">
                                                        +
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {courts.length > 0 && bookings.length === 0 && (
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Chưa có lịch đặt nào trong ngày này.
                    </p>
                )}

                {bookings.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        {bookings.length} lịch đặt · {courts.length} sân
                    </p>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Đặt hộ khách vãng lai</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Sân</Label>
                            <Select value={form.data.court_id} onValueChange={(v) => form.setData('court_id', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {courts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="time">Giờ bắt đầu</Label>
                                <Input id="time" type="time" value={form.data.time} onChange={(e) => form.setData('time', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Thời lượng</Label>
                                <Select value={form.data.duration} onValueChange={(v) => form.setData('duration', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="60">60 phút</SelectItem>
                                        <SelectItem value="90">90 phút</SelectItem>
                                        <SelectItem value="120">120 phút</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên khách</Label>
                            <Input id="name" placeholder="Nguyễn Văn A" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input id="phone" type="tel" placeholder="0901 234 567" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                            {form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}
                        </div>
                        {(form.errors.start_at || form.errors.court_id) && (
                            <p className="text-sm text-destructive">{form.errors.start_at ?? form.errors.court_id}</p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing} className="w-full sm:w-auto">
                                Xác nhận đặt
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
