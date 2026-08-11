import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { StatusBadge } from '@/Components/StatusBadge';
import CalendarBookingItem from '@/Components/CalendarBookingItem';
import CustomerSearch from '@/Components/CustomerSearch';
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
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';

const SLOT_HEIGHT = 44;

function toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function formatTime(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
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

export default function Index({ date, courts, availability, duration }) {
    const [open, setOpen] = useState(false);
    const [nowPos, setNowPos] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(String(duration));
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const tick = () => {
            const { minutes } = vietnamNow();
            setNowPos(minutes);
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
        duration: String(duration),
    });

    const { fieldErrors, updateField, isFormValid, validateAll } = useFieldValidation(form, {
        name: validators.name,
        phone: validators.phone,
    });

    const changeDate = (d) => {
        router.get('/manager/calendar', { date: d, duration: selectedDuration }, { preserveState: true, preserveScroll: true });
    };

    const changeDuration = (d) => {
        setSelectedDuration(d);
        router.get('/manager/calendar', { date, duration: d }, { preserveState: true, preserveScroll: true });
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
        form.setData('duration', selectedDuration);
        form.clearErrors();
        setSelectedCustomer(null);
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (!validateAll()) return;
        const [h, m] = form.data.time.split(':').map(Number);
        const endMin = h * 60 + m + Number(form.data.duration);
        const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
        form.transform((d) => ({
            customer_id: selectedCustomer?.id ?? null,
            name: selectedCustomer ? null : d.name,
            phone: selectedCustomer ? null : d.phone,
            court_id: d.court_id,
            start_at: `${date} ${d.time}:00`,
            end_at: `${date} ${end}:00`,
        })).post('/manager/calendar/walk-in', {
            onSuccess: () => { setOpen(false); form.reset(); setSelectedCustomer(null); },
        });
    };

    const todayStr = vietnamNow().date;
    const isToday = date === todayStr;

    const getCourtAvailability = (court) => {
        return availability[court.uuid] || { opening_windows: [], free_intervals: [], booked_slots: [] };
    };

    const getCourtTimeRange = (court) => {
        const { opening_windows } = getCourtAvailability(court);
        if (opening_windows.length === 0) return { start: 360, end: 1380 };
        let minStart = 1440;
        let maxEnd = 0;
        opening_windows.forEach((w) => {
            const start = toMinutes(w.open);
            const end = toMinutes(w.close);
            if (start < minStart) minStart = start;
            if (end > maxEnd) maxEnd = end;
        });
        return { start: minStart, end: maxEnd };
    };

    const totalBookings = Object.values(availability).reduce((sum, a) => sum + a.booked_slots.length, 0);

    return (
        <ManagerLayout>
            <Head title="Lịch đặt sân" />

            <PageContainer>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <PageHeader
                        title={formatDateHeader(date)}
                        description={`${totalBookings} lịch đặt · ${courts.length} sân`}
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
                        <Select value={selectedDuration} onValueChange={changeDuration}>
                            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="60">60 phút</SelectItem>
                                <SelectItem value="90">90 phút</SelectItem>
                                <SelectItem value="120">120 phút</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {courts.length === 0 && (
                    <div className="manager-panel"><EmptyState icon={Clock} title="Chưa có sân nào" description="Thêm sân trước khi xem lịch đặt." action={<Button asChild><Link href={route('manager.courts.index')}>Thêm sân</Link></Button>} /></div>
                )}

                {courts.length > 0 && (
                    <>
                    {/* Desktop grid */}
                    <div className="hidden overflow-x-auto md:block">
                        <div
                            className="grid min-w-max"
                            style={{
                                gridTemplateColumns: `72px repeat(${courts.length}, minmax(200px, 1fr))`,
                            }}
                        >
                            {/* Header row */}
                            <div className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-border bg-sunk">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {courts.map((court) => (
                                <div
                                    key={court.uuid}
                                    className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-l border-border bg-sunk px-2 text-sm font-semibold"
                                >
                                    {court.name}
                                </div>
                            ))}

                            {/* Time labels column (first court only) */}
                            {courts.map((court, idx) => {
                                const { start, end } = getCourtTimeRange(court);
                                const totalMin = end - start;
                                const slotCount = Math.ceil(totalMin / 30);
                                return (
                                    <div key={`time-${court.uuid}`} className={`relative ${idx === 0 ? 'col-start-1 row-start-2' : 'hidden'}`}>
                                        {Array.from({ length: slotCount }, (_, i) => {
                                            const min = start + i * 30;
                                            const time = formatTime(min);
                                            return (
                                                <div
                                                    key={time}
                                                    className="flex h-11 items-start justify-end pr-2 text-xs leading-none text-muted-foreground"
                                                >
                                                    {min % 60 === 0 ? time : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}

                            {/* Court columns with slots */}
                            {courts.map((court) => {
                                const { opening_windows, free_intervals, booked_slots } = getCourtAvailability(court);
                                const { start, end } = getCourtTimeRange(court);
                                const totalMin = end - start;
                                const slotCount = Math.ceil(totalMin / 30);

                                const pct = (minutes) => ((minutes - start) / totalMin * 100).toFixed(3);

                                return (
                                    <div
                                        key={court.uuid}
                                        className="relative border-l border-border"
                                        style={{ height: slotCount * SLOT_HEIGHT }}
                                    >
                                        {/* Time grid rows */}
                                        {Array.from({ length: slotCount }, (_, i) => {
                                            const min = start + i * 30;
                                            const inWindow = opening_windows.some((w) => {
                                                const wStart = toMinutes(w.open);
                                                const wEnd = toMinutes(w.close);
                                                return min >= wStart && min < wEnd;
                                            });
                                            return (
                                                <div
                                                    key={min}
                                                    className={`h-11 border-b border-border/40 ${
                                                        !inWindow
                                                            ? 'opacity-20 pointer-events-none bg-sunk'
                                                            : ''
                                                    }`}
                                                />
                                            );
                                        })}

                                        {/* Now indicator */}
                                        {isToday && nowPos >= start && nowPos < end && (
                                            <div
                                                className="absolute left-0 right-0 z-20 border-t-2 border-destructive"
                                                style={{ top: `${pct(nowPos)}%` }}
                                            >
                                                <div className="-mt-1.5 ml-0.5 h-3 w-3 rounded-full bg-destructive animate-pulse" />
                                            </div>
                                        )}

                                        {/* Booked slots */}
                                        {booked_slots.map((b) => {
                                            const startMin = toMinutes(b.start);
                                            const endMin = toMinutes(b.end);
                                            const top = pct(startMin);
                                            const heightPct = Math.max(0, pct(endMin) - pct(startMin));
                                            const heightPx = Math.max(24, (endMin - startMin) / 30 * SLOT_HEIGHT);

                                            return (
                                                <div
                                                    key={`${b.uuid}-${b.start}`}
                                                    className="absolute left-0 right-0 z-10"
                                                    style={{ top: `${top}%`, height: `${heightPct}%` }}
                                                >
                                                    <CalendarBookingItem
                                                        booking={b}
                                                        courtName={court.name}
                                                        heightPx={heightPx}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile view */}
                    <div className="space-y-4 md:hidden" aria-label="Lịch đặt theo sân">
                        {courts.map((court) => {
                            const { opening_windows, free_intervals, booked_slots } = getCourtAvailability(court);
                            return (
                                <section key={court.uuid} className="manager-panel p-5" aria-labelledby={`court-${court.uuid}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 id={`court-${court.uuid}`} className="font-semibold text-foreground">{court.name}</h2>
                                        <span className="text-xs text-muted-foreground">{booked_slots.length} lịch đặt</span>
                                    </div>

                                    {booked_slots.length > 0 ? (
                                        <ul className="mt-4 space-y-2">
                                            {booked_slots.map((booking) => (
                                                <li key={`${booking.uuid}-${booking.start}`}>
                                                    <Link
                                                        href={`/manager/bookings/${booking.uuid}`}
                                                        className="manager-well block p-3 transition-colors hover:bg-turf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium text-foreground truncate">{booking.customer || 'Chưa có tên'}</p>
                                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                                                    <span className="tabular-nums">{booking.start}–{booking.end}</span>
                                                                    {booking.code && <span className="tabular-nums text-ink-mute">#{booking.code}</span>}
                                                                    {booking.amount != null && <span className="tabular-nums font-medium text-ink-soft">{formatVND(booking.amount)}</span>}
                                                                </div>
                                                            </div>
                                                            <StatusBadge type="booking" value={booking.status} />
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-4 text-sm text-muted-foreground">Chưa có lịch đặt tại sân này.</p>
                                    )}

                                    <div className="mt-5">
                                        <h3 className="manager-label text-muted-foreground">Khung giờ trống</h3>
                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            {free_intervals.map((interval) => (
                                                <Button
                                                    key={interval.start}
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="min-w-0 px-2 tabular-nums"
                                                    onClick={() => openWalkIn(court.id, interval.start)}
                                                    aria-label={`Đặt hộ tại ${court.name}, ${interval.start}`}
                                                >
                                                    {interval.start}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                    </>
                )}

                {courts.length > 0 && totalBookings === 0 && (
                    <div className="manager-panel"><EmptyState icon={Clock} title="Chưa có lịch đặt nào" description="Chọn một khung giờ trống để đặt hộ khách vãng lai." action={<Button onClick={() => openWalkIn(courts[0].id, '18:00')}>Đặt hộ khách</Button>} /></div>
                )}
            </PageContainer>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Đặt hộ khách</DialogTitle>
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

                        {/* Customer: search existing or enter new */}
                        <div className="space-y-2">
                            <Label>Khách hàng</Label>
                            <CustomerSearch
                                onSelect={(c) => setSelectedCustomer(c)}
                                onClear={() => setSelectedCustomer(null)}
                            />
                        </div>

                        {!selectedCustomer && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên khách mới</Label>
                                    <Input id="name" placeholder="Nguyễn Văn A" value={form.data.name} onChange={(e) => updateField('name', e.target.value)} />
                                    {(fieldErrors.name || form.errors.name) && <p className="text-sm text-destructive">{fieldErrors.name || form.errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input id="phone" type="tel" placeholder="0901 234 567" value={form.data.phone} onChange={(e) => updateField('phone', e.target.value)} />
                                    {(fieldErrors.phone || form.errors.phone) && <p className="text-sm text-destructive">{fieldErrors.phone || form.errors.phone}</p>}
                                </div>
                            </>
                        )}

                        {(form.errors.start_at || form.errors.court_id || form.errors.customer_id) && (
                            <p className="text-sm text-destructive">{form.errors.start_at ?? form.errors.court_id ?? form.errors.customer_id}</p>
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
