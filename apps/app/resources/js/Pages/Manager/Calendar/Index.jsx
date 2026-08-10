import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { validators } from '@/lib/validators';
import { useFieldValidation } from '@/hooks/useFieldValidation';
import { formatVND } from '@/lib/format';
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
const SLOT_HEIGHT = 44;

const STATUS_TINT = {
    confirmed: { bg: 'bg-turf-100', border: 'var(--turf-600)', text: 'text-turf-700', label: 'Đã xác nhận' },
    pending_deposit: { bg: 'bg-sunk', border: 'var(--ink-mute)', text: 'text-ink-mute', label: 'Chờ cọc' },
    cancelled: { bg: 'bg-sunk', border: 'var(--ink-mute)', text: 'text-ink-mute', label: 'Đã hủy' },
    expired: { bg: 'bg-sunk', border: 'var(--ink-mute)', text: 'text-ink-mute line-through', label: 'Hết hạn' },
    completed: { bg: 'bg-turf-100', border: 'var(--turf-600)', text: 'text-turf-700', label: 'Đã hoàn tất' },
    no_show: { bg: 'bg-surface', border: 'var(--danger)', text: 'text-destructive', label: 'Bom sân' },
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

function vietnamNow() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

    return { date: `${values.year}-${values.month}-${values.day}`, minutes: Number(values.hour) * 60 + Number(values.minute) };
}

function vietnamRelativeDate(offset) {
    const date = new Date(`${vietnamNow().date}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);

    return date.toISOString().slice(0, 10);
}

function formatDateHeader(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const todayStr = vietnamNow().date;
    const tomorrowStr = vietnamRelativeDate(1);
    const yesterdayStr = vietnamRelativeDate(-1);

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

    useEffect(() => {
        const tick = () => {
            const { minutes } = vietnamNow();
            if (minutes >= DAY_START * 60 && minutes < DAY_END * 60) {
                setNowPos(pct(minutes));
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

    const { fieldErrors, updateField, isFormValid, validateAll } = useFieldValidation(form, {
        name: validators.name,
        phone: validators.phone,
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
        if (!validateAll()) return;
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

    const todayStr = vietnamNow().date;
    const isToday = date === todayStr;

    return (
        <ManagerLayout>
            <Head title="Lịch đặt sân" />

            <PageContainer>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <PageHeader
                        title={formatDateHeader(date)}
                        description={`${bookings.length} lịch đặt · ${courts.length} sân`}
                    />
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Button variant="outline" size="icon" onClick={() => goDay(-1)} aria-label="Ngày trước">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0 flex-1 sm:flex-none">
                            <Label htmlFor="calendar-date" className="sr-only">Chọn ngày xem lịch</Label>
                            <Input id="calendar-date" type="date" value={date} onChange={(e) => changeDate(e.target.value)} className="w-full sm:w-40" />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => goDay(1)} aria-label="Ngày sau">
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
                    <div className="manager-panel"><EmptyState icon={Clock} title="Chưa có sân nào" description="Thêm sân trước khi xem lịch đặt." action={<Button asChild><Link href={route('manager.courts.index')}>Thêm sân</Link></Button>} /></div>
                )}

                {courts.length > 0 && (
                    <>
                    <div className="hidden overflow-x-auto md:block">
                        <div
                            className="grid min-w-max"
                            style={{
                                gridTemplateColumns: `72px repeat(${courts.length}, minmax(180px, 1fr))`,
                            }}
                        >
                            <div className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-border bg-sunk">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {courts.map((court) => (
                                <div
                                    key={court.id}
                                    className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-l border-border bg-sunk px-2 text-sm font-semibold"
                                >
                                    {court.name}
                                </div>
                            ))}

                            <div className="relative col-start-1 row-start-2">
                                {timeSlots.map((slot) => (
                                    <div
                                        key={slot}
                                        className="flex h-11 items-start justify-end pr-2 text-xs leading-none text-muted-foreground"
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
                                        className="relative border-l border-border"
                                        style={{ height: timeSlots.length * SLOT_HEIGHT }}
                                    >
                                        {timeSlots.map((slot, i) => (
                                            <div
                                                key={slot}
                                                className={`h-11 border-b border-border ${i % 2 === 0 ? 'bg-sunk' : ''}`}
                                            />
                                        ))}

                                        {isToday && nowPos && (
                                            <div
                                                className="absolute left-0 right-0 z-20 border-t-2 border-primary"
                                                style={{ top: `${nowPos}%` }}
                                            >
                                                <div className="-mt-2 ml-1 h-3 w-3 rounded-full bg-primary" />
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
                                                            <Link
                                                                href={route('manager.bookings.index', { search: b.code })}
                                                                aria-label={`${b.customer || 'Khách chưa đặt tên'}, ${hhmm(b.start)} đến ${hhmm(b.end)}, ${b.court}`}
                                                                className={`absolute left-0.5 right-0.5 z-10 block overflow-hidden rounded-inner border-l-2 px-2 py-1 text-left text-xs leading-tight shadow-flat transition-colors hover:bg-turf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${tint.bg}`}
                                                                style={{ top: `${top}%`, height: `${heightPct}%`, borderLeftColor: tint.border }}
                                                            >
                                                                <div className={`truncate font-semibold ${tint.text}`}>
                                                                    {b.customer}
                                                                </div>
                                                                <div className="truncate text-muted-foreground">
                                                                    {hhmm(b.start)}–{hhmm(b.end)}
                                                                </div>
                                                                <span className="sr-only">{tint.label}</span>
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="space-y-1">
                                                            <p className="font-semibold">{b.customer}</p>
                                                            <p className="text-xs">{b.phone}</p>
                                                            <p className="text-xs">
                                                                {hhmm(b.start)}–{hhmm(b.end)} · {b.court}
                                                            </p>
                                                            <StatusBadge type="booking" value={b.status} />
                                                            <p className="font-mono text-xs opacity-60">{b.code}</p>
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
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    key={`empty-${slot}`}
                                                    aria-label={`Đặt hộ tại ${court.name}, ${slot}`}
                                                    className="absolute left-0 right-0 z-0 h-auto cursor-pointer px-1 opacity-60 hover:bg-turf-100 hover:opacity-100"
                                                    style={{
                                                        top: `${pct(slotMin)}%`,
                                                        height: `${pct(slotMin + 30) - pct(slotMin)}%`,
                                                    }}
                                                    onClick={() => openWalkIn(court.id, slot)}
                                                >
                                                    <div className="flex h-full items-center justify-center gap-1 text-xs font-medium text-turf-700">
                                                        <Plus className="h-3 w-3" />
                                                        {court.prices?.[slot] != null && formatVND(court.prices[slot])}
                                                    </div>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="space-y-4 md:hidden" aria-label="Lịch đặt theo sân">
                        {courts.map((court) => {
                            const dayBookings = bookingsByCourt[court.id] ?? [];
                            return <section key={court.id} className="manager-panel p-6" aria-labelledby={`court-${court.id}`}>
                                <div className="flex items-center justify-between gap-3"><h2 id={`court-${court.id}`} className="font-semibold text-foreground">{court.name}</h2><span className="text-xs text-muted-foreground">{dayBookings.length} lịch đặt</span></div>
                                {dayBookings.length > 0 ? <ul className="mt-4 space-y-2">{dayBookings.map((booking) => <li key={`${booking.code}-${booking.start}`}><Link href={route('manager.bookings.index', { search: booking.code })} className="manager-well block p-3 transition-colors hover:bg-turf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-foreground">{booking.customer || 'Khách chưa đặt tên'}</p><p className="mt-1 text-xs tabular-nums text-muted-foreground">{hhmm(booking.start)}-{hhmm(booking.end)} · {booking.phone}</p></div><StatusBadge type="booking" value={booking.status} /></div></Link></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">Chưa có lịch đặt tại sân này.</p>}
                                <div className="mt-5"><h3 className="manager-label text-muted-foreground">Khung giờ trống</h3><div className="mt-3 grid grid-cols-3 gap-2">{timeSlots.map((slot) => {
                                    const slotMin = toMinutes(slot);
                                    const slotEndMin = slotMin + 30;
                                    const hasBooking = dayBookings.some((booking) => toMinutes(hhmm(booking.start)) < slotEndMin && toMinutes(hhmm(booking.end)) > slotMin);
                                    if (hasBooking) return null;
                                    return <Button key={slot} type="button" variant="secondary" size="sm" className="min-w-0 px-2 tabular-nums" onClick={() => openWalkIn(court.id, slot)} aria-label={`Đặt hộ tại ${court.name}, ${slot}`}>{slot}</Button>;
                                })}</div></div>
                            </section>;
                        })}
                    </div>
                    </>
                )}

                {courts.length > 0 && bookings.length === 0 && (
                    <div className="manager-panel"><EmptyState icon={Clock} title="Chưa có lịch đặt nào" description="Chọn một khung giờ trống để đặt hộ khách vãng lai." action={<Button onClick={() => openWalkIn(courts[0].id, '18:00')}>Đặt hộ khách</Button>} /></div>
                )}
            </PageContainer>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Đặt hộ khách vãng lai</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="walk-in-court">Sân</Label>
                            <Select value={form.data.court_id} onValueChange={(v) => form.setData('court_id', v)}>
                                <SelectTrigger id="walk-in-court"><SelectValue /></SelectTrigger>
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
                                <Label htmlFor="walk-in-duration">Thời lượng</Label>
                                <Select value={form.data.duration} onValueChange={(v) => form.setData('duration', v)}>
                                    <SelectTrigger id="walk-in-duration"><SelectValue /></SelectTrigger>
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
                            <Input id="name" placeholder="Nguyễn Văn A" value={form.data.name} onChange={(e) => updateField('name', e.target.value)} />
                            {(fieldErrors.name || form.errors.name) && <p className="text-sm text-destructive">{fieldErrors.name || form.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input id="phone" type="tel" placeholder="0901 234 567" value={form.data.phone} onChange={(e) => updateField('phone', e.target.value)} />
                            {(fieldErrors.phone || form.errors.phone) && <p className="text-sm text-destructive">{fieldErrors.phone || form.errors.phone}</p>}
                        </div>
                        {(form.errors.start_at || form.errors.court_id) && (
                            <p className="text-sm text-destructive">{form.errors.start_at ?? form.errors.court_id}</p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing || !isFormValid} className="w-full sm:w-auto">
                                Xác nhận đặt
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
