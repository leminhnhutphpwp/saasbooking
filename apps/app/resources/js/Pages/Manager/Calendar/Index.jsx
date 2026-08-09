import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/Components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/Components/ui/tooltip';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Globe, Info, MousePointer2, Phone, Plus, User } from 'lucide-react';

const DAY_START = 5;
const DAY_END = 23;
const TOTAL_MIN = (DAY_END - DAY_START) * 60;

const STATUS_TINT = {
    confirmed: { bg: 'bg-primary/10', border: 'hsl(var(--primary))', text: 'text-primary' },
    pending_deposit: { bg: 'bg-warning/10', border: 'hsl(var(--warning))', text: 'text-warning' },
    cancelled: { bg: 'bg-muted/50', border: 'hsl(var(--muted-foreground))', text: 'text-muted-foreground' },
    expired: { bg: 'bg-muted/50', border: 'hsl(var(--muted-foreground))', text: 'text-muted-foreground line-through' },
    completed: { bg: 'bg-success/10', border: 'hsl(var(--success))', text: 'text-success' },
    no_show: { bg: 'bg-destructive/10', border: 'hsl(var(--destructive))', text: 'text-destructive' },
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
    const [selectedCourtId, setSelectedCourtId] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState(null);
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

    const todayStr = new Date().toISOString().slice(0, 10);
    const isToday = date === todayStr;
    const visibleCourts = selectedCourtId === 'all' ? courts : courts.filter((court) => String(court.id) === selectedCourtId);

    // Court summary chips: count bookings per court
    const courtSummary = visibleCourts.map((court) => ({
        ...court,
        bookingCount: (bookingsByCourt[court.id] ?? []).length,
    }));

    return (
        <ManagerLayout>
            <Head title="Lịch đặt sân" />

            <PageContainer>
                <PageHeader title="Lịch đặt sân" description={`${formatDateHeader(date)} · ${bookings.length} lịch đặt · ${courts.length} sân`} />

                <section className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:flex">
                            <Button variant="outline" size="icon" className="size-10 rounded-xl" onClick={() => goDay(-1)} aria-label="Xem ngày trước">
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => changeDate(e.target.value)}
                                className="h-10 min-w-0 rounded-xl bg-background sm:w-44"
                                aria-label="Chọn ngày xem lịch"
                            />
                            <Button variant="outline" size="icon" className="size-10 rounded-xl" onClick={() => goDay(1)} aria-label="Xem ngày sau">
                                <ChevronRight className="size-4" />
                            </Button>
                            {!isToday && <Button variant="secondary" size="sm" className="col-span-3 h-10 rounded-xl sm:col-auto" onClick={goToday}>Hôm nay</Button>}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground"><MousePointer2 className="size-3.5 text-primary" />Nhấn ô trống để đặt hộ</div>
                            <Select value={selectedCourtId} onValueChange={setSelectedCourtId}>
                                <SelectTrigger className="h-10 w-full rounded-xl bg-background sm:w-52" aria-label="Lọc sân hiển thị"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả sân ({courts.length})</SelectItem>
                                    {courts.map((court) => <SelectItem key={court.id} value={String(court.id)}>{court.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                {courts.length === 0 && (
                    <div className="rounded-2xl border bg-card p-12 text-center">
                        <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-foreground">Chưa có sân nào</p>
                        <p className="mt-1 text-sm text-muted-foreground">Thêm sân trước khi xem lịch đặt.</p>
                    </div>
                )}

                {courts.length > 0 && (
                    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                            <div className="flex min-w-0 items-center gap-2"><CalendarDays className="size-4 shrink-0 text-primary" /><p className="truncate text-sm font-bold text-foreground">Lịch theo sân</p><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{visibleCourts.length} sân</span></div>
                            <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Info className="size-3.5" />Kéo ngang để xem thêm sân</p>
                            <p className="text-xs text-muted-foreground sm:hidden">Vuốt ngang</p>
                        </div>

                        {/* Court summary chips */}
                        <div className="flex flex-wrap gap-2 border-b px-4 py-2 sm:px-5">
                            {courtSummary.map((court) => (
                                <button
                                    key={court.id}
                                    type="button"
                                    onClick={() => setSelectedCourtId(String(court.id))}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        selectedCourtId === String(court.id)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {court.name}
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        selectedCourtId === String(court.id)
                                            ? 'bg-primary-foreground/20'
                                            : 'bg-background'
                                    }`}>
                                        {court.bookingCount}
                                    </span>
                                </button>
                            ))}
                            {selectedCourtId !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCourtId('all')}
                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                                >
                                    Tất cả
                                </button>
                            )}
                        </div>

                        {/* Mobile timeline view (<640px) */}
                        <div className="block sm:hidden">
                            {bookings.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CalendarDays className="mx-auto size-8 text-muted-foreground/40" />
                                    <p className="mt-2 text-sm text-muted-foreground">Chưa có lịch đặt nào</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {bookings.map((b, idx) => {
                                        const isWalkIn = b.channel === 'owner_manual';
                                        const ChannelIcon = isWalkIn ? User : Globe;
                                        const tint = STATUS_TINT[b.status] ?? STATUS_TINT.confirmed;

                                        return (
                                            <button
                                                key={`${b.code}-${idx}`}
                                                type="button"
                                                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40"
                                                onClick={() => setSelectedBooking(b)}
                                            >
                                                <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${tint.bg}`}>
                                                    <ChannelIcon className={`size-5 ${tint.text}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="truncate font-semibold">{b.customer || 'Khách vãng lai'}</p>
                                                        <StatusBadge type="booking" value={b.status} />
                                                    </div>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                        {hhmm(b.start)} – {hhmm(b.end)} · {b.court}
                                                    </p>
                                                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{b.code}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    <div className="hidden overflow-x-auto overscroll-x-contain scroll-smooth sm:block" ref={scrollRef}>
                        <div
                            className="grid min-w-[540px]"
                            style={{
                                gridTemplateColumns: `72px repeat(${visibleCourts.length}, minmax(180px, 1fr))`,
                            }}
                        >
                            <div className="sticky left-0 top-0 z-30 flex h-14 items-center justify-center border-b bg-card">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            {visibleCourts.map((court) => (
                                <div
                                    key={court.id}
                                    className="sticky top-0 z-20 flex h-14 flex-col justify-center border-b border-l bg-card px-3"
                                >
                                    <span className="truncate text-sm font-bold text-foreground">{court.name}</span>
                                    <span className="mt-0.5 text-xs text-muted-foreground">{(bookingsByCourt[court.id] ?? []).length} lịch đặt</span>
                                </div>
                            ))}

                            <div className="sticky left-0 z-20 col-start-1 row-start-2 bg-card">
                                {timeSlots.map((slot) => (
                                    <div
                                        key={slot}
                                        className="flex h-8 items-start justify-end border-b border-border/30 pr-3 pt-0.5 text-[11px] font-medium leading-none text-muted-foreground"
                                    >
                                        {slot.endsWith(':00') ? slot : ''}
                                    </div>
                                ))}
                            </div>

                            {visibleCourts.map((court) => {
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
                                                className={`h-8 border-b ${i % 2 === 0 ? 'border-border/60 bg-muted/[0.03]' : 'border-border/25'}`}
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
                                            const isWalkIn = b.channel === 'owner_manual';
                                            const ChannelIcon = isWalkIn ? User : Globe;

                                            return (
                                                <TooltipProvider key={`${b.code}-${b.start}`}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className={`absolute left-1 right-1 z-10 cursor-pointer overflow-hidden rounded-lg border-l-[3px] px-2 py-1.5 text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tint.bg}`}
                                                                style={{ top: `${top}%`, height: `${heightPct}%`, minHeight: 24, borderLeftColor: tint.border }}
                                                                onClick={() => setSelectedBooking(b)}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    <ChannelIcon className="size-3 shrink-0" />
                                                                    <div className={`truncate font-semibold ${tint.text}`}>
                                                                        {b.customer}
                                                                    </div>
                                                                </div>
                                                                <div className="truncate text-muted-foreground">
                                                                    {hhmm(b.start)}–{hhmm(b.end)}
                                                                </div>
                                                            </button>
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
                        <button
                            type="button"
                                                    key={`empty-${slot}`}
                                                    className="group absolute left-0 right-0 z-5 cursor-pointer rounded opacity-0 transition-all hover:z-20 hover:bg-primary/10 hover:opacity-100 focus-visible:z-30 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    style={{
                                                        top: `${pct(slotMin)}%`,
                                                        height: `${pct(slotMin + 30) - pct(slotMin)}%`,
                                                    }}
                                                    onClick={() => openWalkIn(court.id, slot)}
                                                    aria-label={`Đặt khách vãng lai sân ${court.name}, lúc ${slot}${court.prices?.[slot] != null ? `, ${formatVND(court.prices[slot])}` : ''}`}
                                                >
                                                    <div className="flex h-full items-center justify-center gap-1 text-[10px] font-bold text-primary">
                                                        <Plus className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Đặt hộ</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    </section>
                )}
            </PageContainer>

            {/* Booking detail slide-over panel */}
            <Sheet open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Chi tiết đặt sân</SheetTitle>
                    </SheetHeader>
                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-mono text-sm font-semibold">{selectedBooking.code}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">{selectedBooking.court}</p>
                                    </div>
                                    <StatusBadge type="booking" value={selectedBooking.status} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Khách hàng</p>
                                    <p className="mt-1 font-semibold">{selectedBooking.customer || 'Khách vãng lai'}</p>
                                    {selectedBooking.phone && (
                                        <a href={`tel:${selectedBooking.phone}`} className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                            <Phone className="size-3" />
                                            {selectedBooking.phone}
                                        </a>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Thời gian</p>
                                    <p className="mt-1 text-sm">
                                        {hhmm(selectedBooking.start)} – {hhmm(selectedBooking.end)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(selectedBooking.start).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Loại đặt sân</p>
                                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm">
                                        {selectedBooking.channel === 'owner_manual' ? (
                                            <>
                                                <User className="size-4" />
                                                Đặt hộ (Walk-in)
                                            </>
                                        ) : (
                                            <>
                                                <Globe className="size-4" />
                                                Đặt online
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        router.visit(route('manager.bookings.show', selectedBooking.code));
                                    }}
                                >
                                    Xem chi tiết
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedBooking(null)}
                                >
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

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
