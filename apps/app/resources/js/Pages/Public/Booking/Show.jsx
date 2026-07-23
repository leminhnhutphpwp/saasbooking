import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { formatVND } from '@/lib/format';
import { Clock, MapPin, CalendarDays, ChevronLeft, ChevronRight, X, Check, Loader2 } from 'lucide-react';

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function hhmm(iso) {
    return iso.slice(11, 16);
}

function toDateStr(d) {
    return d.toISOString().slice(0, 10);
}

function DateStrip({ date, tenantSlug, onChange }) {
    const scrollRef = useRef(null);
    const days = [];
    const today = toDateStr(new Date());
    for (let i = -3; i <= 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    useEffect(() => {
        const idx = days.findIndex((d) => toDateStr(d) === date);
        if (idx >= 0 && scrollRef.current) {
            const child = scrollRef.current.children[idx];
            if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [date]);

    return (
        <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {days.map((d) => {
                const ds = toDateStr(d);
                const active = ds === date;
                const isToday = ds === today;
                const dayNum = d.getDate();
                const dayName = DAY_NAMES[d.getDay()];
                return (
                    <button
                        key={ds}
                        onClick={() => onChange(ds)}
                        className={`flex min-w-[52px] flex-col items-center rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                            active
                                ? 'text-white shadow-md'
                                : 'border border-border bg-card text-muted-foreground hover:bg-accent'
                        }`}
                        style={active ? { backgroundColor: 'var(--brand, #059669)' } : {}}
                    >
                        <span className="text-[10px] uppercase">{isToday ? 'Hôm nay' : dayName}</span>
                        <span className="text-lg font-bold leading-tight">{dayNum}</span>
                    </button>
                );
            })}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-4 p-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="flex gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-16 w-[52px] rounded-xl bg-muted" />
                ))}
            </div>
            <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-xl border p-4">
                        <div className="mb-3 h-5 w-24 rounded bg-muted" />
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 6 }).map((_, j) => (
                                <div key={j} className="h-9 w-24 rounded-lg bg-muted" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Show({ tenant, date, courts }) {
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const form = useForm({ name: '', phone: '', court_id: null, start_at: '', end_at: '' });
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    const isSoldOut = courts.length === 0 || courts.every((c) => c.free.length === 0);

    const changeDate = (d) => {
        setLoading(true);
        router.get(`/book/${tenant.slug}`, { date: d }, {
            preserveState: false,
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    const pick = (court, slot) => {
        setSelected({ court_id: court.court_id, court_name: court.court_name, start: slot.start, end: slot.end, price: slot.price });
        form.setData({ name: form.data.name, phone: form.data.phone, court_id: court.court_id, start_at: slot.start, end_at: slot.end });
    };

    const clear = () => {
        setSelected(null);
        form.setData({ court_id: null, start_at: '', end_at: '' });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(`/book/${tenant.slug}/hold`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Head title={`Đặt sân — ${tenant.name}`} />

            <style>{`
                :root { --brand: ${pc}; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="border-b bg-white" style={{ borderTopColor: pc, borderTopWidth: '3px' }}>
                <div className="mx-auto flex max-w-3xl items-center gap-3 p-4">
                    {brand.logo_path && (
                        <img src={`/storage/${brand.logo_path}`} alt={tenant.name} className="h-10 w-auto rounded object-contain" />
                    )}
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: pc }}>{tenant.name}</h1>
                        <p className="text-xs text-gray-500">Đặt sân nhanh — cọc VietQR chống bom</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <LoadingSkeleton />
            ) : (
                <div className="mx-auto max-w-3xl space-y-4 p-4">
                    <DateStrip date={date} tenantSlug={tenant.slug} onChange={changeDate} />

                    {isSoldOut && (
                        <div className="rounded-xl border bg-card p-8 text-center">
                            <CalendarDays className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                            <p className="font-medium text-muted-foreground">Hôm nay không còn chỗ trống</p>
                            <p className="mt-1 text-sm text-muted-foreground/60">Vui lòng chọn ngày khác</p>
                        </div>
                    )}

                    {!isSoldOut && (
                        <div className="space-y-3">
                            {courts.map((court) => {
                                const hasCourtSelected = selected?.court_id === court.court_id;
                                return (
                                    <div key={court.court_id} className="rounded-xl border bg-card">
                                        <div className="flex items-center gap-2 border-b px-4 py-3">
                                            <MapPin className="h-4 w-4" style={{ color: pc }} />
                                            <h2 className="font-semibold">{court.court_name}</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-4">
                                            {court.free.length === 0 && (
                                                <p className="w-full text-center text-sm text-muted-foreground/60 py-2">Hết chỗ</p>
                                            )}
                                            {court.free.map((slot, i) => {
                                                const isSelected = selected?.start === slot.start && hasCourtSelected;
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => pick(court, slot)}
                                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                                            isSelected
                                                                ? 'text-white shadow-md'
                                                                : 'hover:border-foreground/30 hover:bg-accent'
                                                        } ${slot.peak ? 'border-amber-200 bg-amber-50' : ''}`}
                                                        style={
                                                            isSelected
                                                                ? { backgroundColor: pc, borderColor: pc }
                                                                : {}
                                                        }
                                                    >
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>{hhmm(slot.start)}</span>
                                                        <span className="text-xs opacity-70">{formatVND(slot.price)}</span>
                                                        {slot.peak && (
                                                            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px]">Cao</Badge>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {selected && (
                <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white p-4 shadow-lg">
                    <form onSubmit={submit} className="mx-auto max-w-3xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                            <div className="flex flex-1 items-start gap-3">
                                <button type="button" onClick={clear} className="mt-1 rounded p-1 text-muted-foreground hover:bg-accent">
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">
                                        {selected.court_name} · {hhmm(selected.start)}–{hhmm(selected.end)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatVND(selected.price)} · Cọc {formatVND(Math.round(selected.price))}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="name" className="text-xs">Họ tên</Label>
                                    <Input
                                        id="name"
                                        placeholder="Nguyễn Văn A"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                    {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="phone" className="text-xs">SĐT</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="0901 234 567"
                                        value={form.data.phone}
                                        onChange={(e) => form.setData('phone', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                    {form.errors.phone && <p className="text-xs text-destructive">{form.errors.phone}</p>}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={form.processing || !form.data.name || !form.data.phone}
                                    className="h-9 shrink-0 gap-2"
                                    style={{ backgroundColor: pc }}
                                >
                                    {form.processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Giữ chỗ
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
