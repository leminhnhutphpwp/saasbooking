import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { formatVND } from '@/lib/format';
import { ShieldCheck, X, Loader2, Check, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

/* ─── Constants ─── */
const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function hhmm(iso) {
    return iso.slice(11, 16);
}

function toDateStr(d) {
    return d.toISOString().slice(0, 10);
}

/* ─── Date Strip ─── */
function DateStrip({ date, onChange }) {
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
        <div className="px-4 py-3">
            <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
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
                            className={`flex min-w-[54px] flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold transition-all duration-200 shrink-0 ${
                                active
                                    ? 'bg-white text-black shadow-lg scale-105'
                                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                        >
                            <span className="text-[10px] uppercase tracking-wide mb-0.5">
                                {isToday ? 'Nay' : dayName}
                            </span>
                            <span className="text-lg font-bold leading-none">{dayNum}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── SVG Court Card ─── */
function CourtCard({ court, isSelected, isSoldOut, brandColor, onSelect }) {
    const freeCount = court.free.length;

    // Pick a price from the first available slot for display
    const priceRange = useMemo(() => {
        if (court.free.length === 0) return null;
        const prices = court.free.map((s) => s.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return formatVND(min);
        return `${formatVND(min)} – ${formatVND(max)}`;
    }, [court.free]);

    return (
        <button
            onClick={() => !isSoldOut && onSelect(court)}
            disabled={isSoldOut}
            className={`court-card group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                isSoldOut
                    ? 'cursor-not-allowed opacity-60'
                    : isSelected
                        ? 'ring-3 ring-white/90 shadow-2xl scale-[1.02] z-10'
                        : 'hover:scale-[1.03] hover:shadow-xl hover:shadow-black/20 cursor-pointer'
            }`}
            style={
                isSelected
                    ? { animation: 'court-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }
                    : {}
            }
        >
            {/* SVG Court Surface */}
            <svg
                viewBox="0 0 240 150"
                className="w-full h-auto block"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Court surface gradient */}
                    <linearGradient id={`court-grad-${court.court_id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isSoldOut ? '#9ca3af' : '#4ade80'} />
                        <stop offset="50%" stopColor={isSoldOut ? '#6b7280' : '#22c55e'} />
                        <stop offset="100%" stopColor={isSoldOut ? '#4b5563' : '#16a34a'} />
                    </linearGradient>
                    {/* Selected glow */}
                    <filter id={`glow-${court.court_id}`}>
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Court surface */}
                <rect
                    x="4"
                    y="4"
                    width="232"
                    height="142"
                    rx="12"
                    fill={`url(#court-grad-${court.court_id})`}
                    className="transition-all duration-300"
                />

                {/* Court boundary */}
                <rect
                    x="4"
                    y="4"
                    width="232"
                    height="142"
                    rx="12"
                    fill="none"
                    stroke="white"
                    strokeWidth={isSelected ? "3" : "2"}
                    opacity={isSelected ? 1 : 0.85}
                />

                {/* Service lines - vertical */}
                <line x1="68" y1="4" x2="68" y2="146" stroke="white" strokeWidth="1" opacity="0.4" />
                <line x1="172" y1="4" x2="172" y2="146" stroke="white" strokeWidth="1" opacity="0.4" />

                {/* Center line - horizontal */}
                <line x1="4" y1="75" x2="236" y2="75" stroke="white" strokeWidth="1.2" opacity="0.5" />

                {/* Net line (center vertical, dashed) */}
                <line x1="120" y1="4" x2="120" y2="146" stroke="white" strokeWidth="1.8" strokeDasharray="6,4" opacity="0.7" />

                {/* Corner markers */}
                <circle cx="16" cy="16" r="3" fill="white" opacity="0.5" />
                <circle cx="224" cy="16" r="3" fill="white" opacity="0.5" />
                <circle cx="16" cy="134" r="3" fill="white" opacity="0.5" />
                <circle cx="224" cy="134" r="3" fill="white" opacity="0.5" />

                {/* Center service line - small segments */}
                <line x1="120" y1="4" x2="120" y2="75" stroke="white" strokeWidth="1.5" opacity="0.5" />
                <line x1="120" y1="75" x2="120" y2="146" stroke="white" strokeWidth="1.5" opacity="0.5" />
            </svg>

            {/* Info overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                {/* Top: Court name */}
                <div className="flex items-start justify-between">
                    <span
                        className="font-bold text-lg text-white drop-shadow-md"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
                    >
                        {court.court_name}
                    </span>
                    {isSelected && (
                        <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                            ĐANG CHỌN
                        </span>
                    )}
                </div>

                {/* Bottom: Status + price */}
                <div className="flex items-end justify-between">
                    {isSoldOut ? (
                        <span className="bg-black/50 text-white/70 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                            Hết chỗ
                        </span>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <span
                                className="bg-black/40 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm"
                            >
                                Còn {freeCount} khung
                            </span>
                            {priceRange && (
                                <span
                                    className="bg-white/90 text-black text-[11px] font-bold px-3 py-1 rounded-full shadow-sm"
                                >
                                    {priceRange}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sold out overlay */}
            {isSoldOut && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white/90 font-bold text-sm tracking-wide">HẾT CHỖ</span>
                </div>
            )}
        </button>
    );
}

/* ─── Time Slot Pill ─── */
function SlotPill({ slot, isSelected, brandColor, onSelect }) {
    const isPeak = slot.peak;
    const priceLabel = slot.price >= 1000 ? `${Math.round(slot.price / 1000)}k` : formatVND(slot.price);

    return (
        <button
            onClick={() => onSelect(slot)}
            className={`slot-pill inline-flex flex-col items-center rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 min-w-[68px] shrink-0 ${
                isSelected
                    ? 'text-white shadow-lg scale-105'
                    : isPeak
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30'
                        : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:border-white/40'
            }`}
            style={
                isSelected
                    ? { backgroundColor: brandColor, borderColor: brandColor, boxShadow: `0 4px 20px ${brandColor}60` }
                    : {}
            }
        >
            <span className="text-sm font-bold leading-none">{hhmm(slot.start)}</span>
            <span className="text-[10px] opacity-75 mt-1">{priceLabel}</span>
            {isPeak && (
                <span className="text-[8px] font-bold tracking-wider mt-1 uppercase opacity-80">Cao</span>
            )}
        </button>
    );
}

/* ─── Bottom Sheet ─── */
function BottomSheet({ court, selectedSlot, brandColor, onSlotSelect, onClose, children }) {
    if (!court) return null;

    const freeCount = court.free.length;

    // Group slots by time of day
    const groups = { Sáng: [], Chiều: [], Tối: [] };
    court.free.forEach((slot) => {
        const h = parseInt(slot.start.slice(11, 13), 10);
        if (h < 12) groups['Sáng'].push(slot);
        else if (h < 18) groups['Chiều'].push(slot);
        else groups['Tối'].push(slot);
    });

    return (
        <div className="bottom-sheet fixed inset-x-0 bottom-0 z-50 bg-gradient-to-b from-gray-950 to-black border-t border-white/10 shadow-2xl rounded-t-3xl">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${brandColor}30` }}
                    >
                        <MapPin className="h-4 w-4" style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">{court.court_name}</h3>
                        <p className="text-xs text-white/50">
                            Còn {freeCount} khung giờ trống
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-full p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Timeline scroll */}
            <div className="px-5 py-4">
                {['Sáng', 'Chiều', 'Tối'].map((group) => {
                    const slots = groups[group];
                    if (slots.length === 0) return null;
                    return (
                        <div key={group} className="mb-3 last:mb-0">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                {group}
                            </p>
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {slots.map((slot, i) => (
                                    <SlotPill
                                        key={i}
                                        slot={slot}
                                        isSelected={selectedSlot?.start === slot.start}
                                        brandColor={brandColor}
                                        onSelect={onSlotSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Booking form */}
            {children}
        </div>
    );
}

/* ─── Empty State ─── */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm">
                <MapPin className="h-10 w-10 text-white/40" />
            </div>
            <p className="text-white font-bold text-lg mb-1">Không còn chỗ trống</p>
            <p className="text-white/50 text-sm">Vui lòng chọn ngày khác</p>
        </div>
    );
}

/* ─── Main Component ─── */
export default function Show({ tenant, date, courts }) {
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const form = useForm({ name: '', phone: '', court_id: null, start_at: '', end_at: '' });

    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    const isSoldOut = courts.length === 0 || courts.every((c) => c.free.length === 0);

    const changeDate = (d) => {
        setLoading(true);
        setSelectedCourt(null);
        setSelectedSlot(null);
        setSheetOpen(false);
        router.get(`/book/${tenant.slug}`, { date: d }, {
            preserveState: false,
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    const handleCourtSelect = useCallback((court) => {
        setSelectedCourt(court);
        setSelectedSlot(null);
        setSheetOpen(true);
    }, []);

    const handleSlotSelect = useCallback((slot) => {
        setSelectedSlot(slot);
        form.setData({
            name: form.data.name,
            phone: form.data.phone,
            court_id: selectedCourt?.court_id,
            start_at: slot.start,
            end_at: slot.end,
        });
    }, [selectedCourt, form]);

    const handleSheetClose = useCallback(() => {
        setSheetOpen(false);
        setSelectedCourt(null);
        setSelectedSlot(null);
        form.setData({ court_id: null, start_at: '', end_at: '' });
    }, [form]);

    const submit = (e) => {
        e.preventDefault();
        form.post(`/book/${tenant.slug}/hold`);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Head title={`Đặt sân — ${tenant.name}`} />

            <style>{`
                :root { --brand: ${pc}; }

                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

                /* Background pattern */
                .venue-bg {
                    background:
                        radial-gradient(ellipse at 20% 50%, ${pc}22 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 20%, ${pc}18 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 80%, ${pc}12 0%, transparent 50%),
                        linear-gradient(160deg, #0a0a0a 0%, #111 40%, #0a0a0a 100%);
                }

                /* Animated subtle dots */
                .venue-bg::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(${pc}15 1px, transparent 1px);
                    background-size: 24px 24px;
                    animation: pattern-drift 60s linear infinite;
                    pointer-events: none;
                }

                @keyframes pattern-drift {
                    0% { background-position: 0 0; }
                    100% { background-position: 24px 24px; }
                }

                /* Court pulse animation */
                @keyframes court-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 ${pc}80; }
                    50% { box-shadow: 0 0 0 8px ${pc}00; }
                }

                /* Bottom sheet */
                .bottom-sheet {
                    transform: translateY(100%);
                    transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
                }
                .bottom-sheet.open {
                    transform: translateY(0);
                }

                /* Slot pill hover */
                .slot-pill:hover:not(.selected) {
                    transform: translateY(-1px);
                }

                /* Court card hover glow */
                .court-card:not(:disabled):hover {
                    box-shadow: 0 8px 40px ${pc}30;
                }
            `}</style>

            {/* ─── Layer 1: Full-Screen Background ─── */}
            <div className="venue-bg relative min-h-screen flex flex-col">
                {/* Venue Header */}
                <header className="relative z-10 px-5 pt-6 pb-2">
                    <div className="flex items-center gap-4">
                        {brand.logo_path && (
                            <img
                                src={`/storage/${brand.logo_path}`}
                                alt={tenant.name}
                                className="h-12 w-12 rounded-xl border-2 border-white/20 object-cover bg-white/10 backdrop-blur-sm"
                            />
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{tenant.name}</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-[11px] text-white/50 font-medium">
                                    Giữ sân 15 phút · cọc VietQR chống bom
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Date Strip */}
                <div className="relative z-10">
                    <DateStrip date={date} onChange={changeDate} />
                </div>

                {/* ─── Layer 2: Venue Map ─── */}
                <main className="relative z-10 flex-1 px-4 pb-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="animate-pulse rounded-2xl bg-white/5 h-[200px]" />
                            ))}
                        </div>
                    ) : isSoldOut ? (
                        <EmptyState />
                    ) : (
                        <>
                            {/* Courts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                {courts.map((court) => (
                                    <CourtCard
                                        key={court.court_id}
                                        court={court}
                                        isSelected={selectedCourt?.court_id === court.court_id}
                                        isSoldOut={court.free.length === 0}
                                        brandColor={pc}
                                        onSelect={handleCourtSelect}
                                    />
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-[11px] text-white/40 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-emerald-400 to-emerald-600" />
                                    <span>Còn chỗ</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-sm bg-white/20 border border-white/40" />
                                    <span>Đang chọn</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-sm bg-gray-500/60" />
                                    <span>Hết chỗ</span>
                                </div>
                            </div>
                        </>
                    )}
                </main>

                {/* ─── Layer 3: Bottom Sheet ─── */}
                <div className={`bottom-sheet ${sheetOpen ? 'open' : ''}`}>
                    {sheetOpen && selectedCourt && (
                        <BottomSheet
                            court={selectedCourt}
                            selectedSlot={selectedSlot}
                            brandColor={pc}
                            onSlotSelect={handleSlotSelect}
                            onClose={handleSheetClose}
                        >
                            {/* Booking Form */}
                            {selectedSlot && (
                                <div className="px-5 pb-6 pt-2 border-t border-white/10">
                                    <form onSubmit={submit} className="space-y-3">
                                        {/* Price summary */}
                                        <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                                            <div>
                                                <p className="text-white font-bold text-sm">
                                                    {selectedCourt.court_name}
                                                </p>
                                                <p className="text-white/50 text-xs mt-0.5">
                                                    {new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })} · {hhmm(selectedSlot.start)}–{hhmm(selectedSlot.end)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-bold text-base">{formatVND(selectedSlot.price)}</p>
                                                <p className="text-white/40 text-[10px]">Tiền cọc giữ chỗ</p>
                                            </div>
                                        </div>

                                        {/* Name + Phone inline */}
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Họ tên"
                                                    value={form.data.name}
                                                    onChange={(e) => form.setData('name', e.target.value)}
                                                    className="h-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 text-sm rounded-xl focus-visible:ring-white/30"
                                                />
                                                {form.errors.name && (
                                                    <p className="text-[10px] text-red-400 mt-1">{form.errors.name}</p>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="Số điện thoại"
                                                    type="tel"
                                                    value={form.data.phone}
                                                    onChange={(e) => form.setData('phone', e.target.value)}
                                                    className="h-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 text-sm rounded-xl focus-visible:ring-white/30"
                                                />
                                                {form.errors.phone && (
                                                    <p className="text-[10px] text-red-400 mt-1">{form.errors.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <Button
                                            type="submit"
                                            disabled={form.processing || !form.data.name || !form.data.phone}
                                            className="w-full h-12 rounded-xl text-base font-bold shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                                            style={{
                                                backgroundColor: pc,
                                                boxShadow: `0 4px 20px ${pc}50`,
                                                color: '#fff',
                                            }}
                                        >
                                            {form.processing ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Check className="h-5 w-5 mr-1" />
                                            )}
                                            Giữ chỗ
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </BottomSheet>
                    )}
                </div>
            </div>
        </div>
    );
}
