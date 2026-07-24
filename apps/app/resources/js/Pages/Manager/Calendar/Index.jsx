import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { StatusBadge } from '@/Components/StatusBadge';
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
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';

const DAY_START = 5;
const DAY_END = 23;
const TOTAL_MIN = (DAY_END - DAY_START) * 60;

const STATUS_TINT = {
    confirmed: { bg: 'bg-orange-50 dark:bg-orange-950/40', border: '#f97316', text: 'text-orange-700 dark:text-orange-300' },
    pending_deposit: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: '#f59e0b', text: 'text-amber-700 dark:text-amber-300' },
    cancelled: { bg: 'bg-muted/50', border: '#94a3b8', text: 'text-muted-foreground' },
    expired: { bg: 'bg-muted/50', border: '#94a3b8', text: 'text-muted-foreground line-through' },
    completed: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: '#10b981', text: 'text-emerald-700 dark:text-emerald-300' },
    no_show: { bg: 'bg-rose-50 dark:bg-rose-950/40', border: '#ef4444', text: 'text-rose-700 dark:text-rose-300' },
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

function formatDateHeader(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (dateStr === todayStr) return `Hôm nay · ${weekday}`;
    if (dateStr === tomorrowStr) return `Ngày mai · ${weekday}`;
    if (dateStr === yesterdayStr) return `Hôm qua · ${weekday}`;
    return `${weekday} · ${date}`;
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
        <ManagerLayout>
            <Head title="Lịch đặt sân" />

            <PageContainer size="default" className="max-w-full 2xl:max-w-7xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <PageHeader
                        title={formatDateHeader(date)}
                        description={`${bookings.length} lịch đặt · ${courts.length} sân`}
                    />
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goDay(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => changeDate(e.target.value)}
                            className="h-9 w-40"
                        />
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goDay(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        {!isToday && (
                            <Button variant="secondary" size="sm" className="h-9" onClick={goToday}>
                                Hôm nay
                            </Button>
                        )}
                    </div>
                </div>

                {courts.length === 0 && (
                    <div className="rounded-2xl border bg-card p-12 text-center">
                        <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-foreground">Chưa có sân nào</p>
                        <p className="mt-1 text-sm text-muted-foreground">Thêm sân trước khi xem lịch đặt.</p>
                    </div>
                )}

                {courts.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm" ref={scrollRef}>
                        <div
                            className="grid min-w-[600px]"
                            style={{
                                gridTemplateColumns: `72px repeat(${courts.length}, minmax(180px, 1fr))`,
                            }}
                        >
                            <div className="sticky top-0 z-10 flex h-11 items-center justify-center border-b bg-muted/40">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            {courts.map((court) => (
                                <div
                                    key={court.id}
                                    className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-l bg-muted/40 px-2 text-sm font-semibold"
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
                                                className={`h-8 border-b ${i % 2 === 0 ? 'border-border/50' : 'border-border/20'}`}
                                            />
                                        ))}

                                        {isToday && nowPos && (
                                            <div
                                                className="absolute left-0 right-0 z-20 border-t-2 border-primary"
                                                style={{ top: `${nowPos}%` }}
                                            >
                                                <div className="-mt-2 ml-1 h-3 w-3 rounded-full bg-primary shadow-sm" />
                                            </div>
                                        )}

                                        {dayBookings.map((b) => {
                                            const startMin = toMinutes(hhmm(b.start));
                                            const endMin = toMinutes(hhmm(b.end));
                                            const top = pct(startMin);
                                            const heightPct = Math.max(0, pct(endMin) - pct(startMin));
                                            const tint = STATUS_TINT[b.status] ?? STATUS_TINT.confirmed;

                                            return (
                                                <TooltipProvider key={`${b.code}-${b.start}`}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={`absolute left-0.5 right-0.5 z-10 cursor-pointer overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md ${tint.bg}`}
                                                                style={{ top: `${top}%`, height: `${heightPct}%`, minHeight: 24, borderLeftColor: tint.border }}
                                                            >
                                                                <div className={`truncate font-semibold ${tint.text}`}>
                                                                    {b.customer}
                                                                </div>
                                                                <div className="truncate text-muted-foreground">
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
                                                    className="absolute left-0 right-0 z-5 cursor-pointer rounded opacity-0 transition-all hover:opacity-100 hover:bg-primary/5"
                                                    style={{
                                                        top: `${pct(slotMin)}%`,
                                                        height: `${pct(slotMin + 30) - pct(slotMin)}%`,
                                                    }}
                                                    onClick={() => openWalkIn(court.id, slot)}
                                                >
                                                    <div className="flex h-full items-center justify-center text-xs text-primary">
                                                        <Plus className="h-3 w-3" />
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
                    <div className="rounded-2xl border bg-card p-8 text-center">
                        <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            Chưa có lịch đặt nào trong ngày này.
                        </p>
                    </div>
                )}
            </PageContainer>

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
