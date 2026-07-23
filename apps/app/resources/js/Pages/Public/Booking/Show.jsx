import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { formatVND } from '@/lib/format';
import { MapPin, X, Check, Loader2, ShieldCheck } from 'lucide-react';

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

function hhmm(iso) {
    return iso.slice(11, 16);
}

function toDateStr(d) {
    return d.toISOString().slice(0, 10);
}

function slotGroup(h) {
    if (h < 12) return 'Sáng';
    if (h < 18) return 'Chiều';
    return 'Tối';
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

    const currentMonth = MONTHS[new Date(date + 'T00:00:00').getMonth()];

    useEffect(() => {
        const idx = days.findIndex((d) => toDateStr(d) === date);
        if (idx >= 0 && scrollRef.current) {
            const child = scrollRef.current.children[idx];
            if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [date]);

    return (
        <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{currentMonth}</p>
            <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {days.map((d) => {
                    const ds = toDateStr(d);
                    const active = ds === date;
                    const isToday = ds === today;
                    const dayNum = d.getDate();
                    const dayName = DAY_NAMES[d.getDay()];
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                        <button
                            key={ds}
                            onClick={() => onChange(ds)}
                            className={`flex min-w-[52px] flex-col items-center rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                                active
                                    ? 'text-white shadow-md'
                                    : 'border border-border bg-card text-muted-foreground hover:bg-accent'
                            } ${isWeekend && !active ? 'bg-muted/30' : ''}`}
                            style={active ? { backgroundColor: 'var(--brand, #059669)' } : {}}
                        >
                            <span className="text-[10px] uppercase">{isToday ? 'Hôm nay' : dayName}</span>
                            <span className="text-lg font-bold leading-tight">{dayNum}</span>
                        </button>
                    );
                })}
            </div>
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
                        <div className="mb-3 h-5 w-32 rounded bg-muted" />
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
        <div className="min-h-screen bg-gray-50 pb-28">
            <Head title={`Đặt sân — ${tenant.name}`} />

            <style>{`
                :root { --brand: ${pc}; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Hero */}
            <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${pc}dd 0%, ${pc} 100%)` }}>
                <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
                    {brand.logo_path && (
                        <img src={`/storage/${brand.logo_path}`} alt={tenant.name} className="h-12 w-12 rounded-xl border-2 border-white/30 object-cover bg-white" />
                    )}
                    <div className="text-white">
                        <h1 className="text-xl font-bold">{tenant.name}</h1>
                        <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Giữ sân 15 phút · cọc VietQR chống bom
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <LoadingSkeleton />
            ) : (
                <div className="mx-auto max-w-3xl space-y-4 p-4">
                    <DateStrip date={date} tenantSlug={tenant.slug} onChange={changeDate} />

                    {isSoldOut && (
                        <div className="rounded-xl border bg-card p-10 text-center">
                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted/80">
                                <MapPin className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="font-semibold text-foreground">Hôm nay không còn chỗ trống</p>
                            <p className="mt-1 text-sm text-muted-foreground">Vui lòng chọn ngày khác</p>
                        </div>
                    )}

                    {!isSoldOut && (
                        <div className="space-y-4">
                            {courts.map((court) => {
                                const hasCourtSelected = selected?.court_id === court.court_id;
                                const freeCount = court.free.length;

                                // Group slots by time of day
                                const groups = { Sáng: [], Chiều: [], Tối: [] };
                                court.free.forEach((slot) => {
                                    const h = parseInt(slot.start.slice(11, 13), 10);
                                    const g = slotGroup(h);
                                    groups[g].push(slot);
                                });

                                if (freeCount === 0) {
                                    return (
                                        <div key={court.court_id} className="rounded-xl border bg-card p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <h2 className="font-semibold">{court.court_name}</h2>
                                            </div>
                                            <p className="text-sm text-muted-foreground/60">Hết chỗ hôm nay</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={court.court_id} className="rounded-xl border bg-card">
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" style={{ color: pc }} />
                                                <h2 className="font-semibold">{court.court_name}</h2>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                Còn {freeCount} khung
                                            </Badge>
                                        </div>

                                        <div className="space-y-3 px-4 pb-4">
                                            {['Sáng', 'Chiều', 'Tối'].map((group) => {
                                                const slots = groups[group];
                                                if (slots.length === 0) return null;
                                                return (
                                                    <div key={group}>
                                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                            {group} ({slots[0] ? hhmm(slots[0].start)?.split(':')[0] + 'h' : ''} – {slots[slots.length - 1] ? hhmm(slots[slots.length - 1].end)?.split(':')[0] + 'h' : ''})
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {slots.map((slot, i) => {
                                                                const isSelected = selected?.start === slot.start && hasCourtSelected;
                                                                const isPeak = slot.peak;
                                                                return (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => pick(court, slot)}
                                                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                                                            isSelected
                                                                                ? 'text-white shadow-md'
                                                                                : isPeak
                                                                                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                                                                                    : 'border-border bg-card hover:border-foreground/30 hover:bg-accent'
                                                                        }`}
                                                                        style={
                                                                            isSelected
                                                                                ? { backgroundColor: pc, borderColor: pc }
                                                                                : {}
                                                                        }
                                                                    >
                                                                        <span className="font-bold">{hhmm(slot.start)}</span>
                                                                        <span className="text-xs opacity-70">{formatVND(slot.price)}</span>
                                                                        {isPeak && (
                                                                            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px]">
                                                                                Cao
                                                                            </Badge>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
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
                <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white shadow-lg">
                    <div className="mx-auto max-w-3xl p-4">
                        <form onSubmit={submit} className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold">
                                        {selected.court_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })} · {hhmm(selected.start)}–{hhmm(selected.end)}
                                    </p>
                                </div>
                                <button type="button" onClick={clear} className="rounded p-1 text-muted-foreground hover:bg-accent">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground">Giá sân:</span>
                                <span className="font-semibold">{formatVND(selected.price)}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">Cọc:</span>
                                <span className="font-semibold">{formatVND(Math.round(selected.price))}</span>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
                                    <Label htmlFor="phone" className="text-xs">Số điện thoại</Label>
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
                                    className="mt-2 h-11 w-full gap-2 text-base font-semibold sm:mt-0 sm:w-auto"
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}