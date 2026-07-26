import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import { Toaster, toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { formatVND } from '@/lib/format';
import { validators } from '@/lib/validators';
import { useFieldValidation } from '@/hooks/useFieldValidation';
import { ShieldCheck, X, Loader2, Check, MapPin, SlidersHorizontal, Phone, Mail, Globe, AlertCircle, History } from 'lucide-react';

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const hhmm = (iso) => iso.slice(11, 16);
const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY_STR = toDateStr(new Date());

/* ─── Shared SVG Defs ─── */
function SharedSvgDefs() {
    return (
        <svg className="absolute w-0 h-0" aria-hidden="true">
            <defs>
                <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6dab7e" />
                    <stop offset="50%" stopColor="#5a9a6d" />
                    <stop offset="100%" stopColor="#4d8c60" />
                </linearGradient>
                <linearGradient id="cs" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c5c9ce" />
                    <stop offset="100%" stopColor="#a8adb3" />
                </linearGradient>
                <pattern id="ss" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <rect width="4" height="8" fill="rgba(0,0,0,0.04)" />
                </pattern>
            </defs>
        </svg>
    );
}

/* ─── Court Card ─── */
const CourtCard = memo(function CourtCard({ court, isSelected, isSoldOut, brandColor, onSelect, index }) {
    const freeCount = court.free.length;
    const priceRange = useMemo(() => {
        if (court.free.length === 0) return null;
        const priced = court.free.filter((s) => s.price > 0);
        if (priced.length === 0) return null;
        const prices = priced.map((s) => s.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return { min, max, label: min === max ? formatVND(min) : `Từ ${formatVND(min)}` };
    }, [court.free]);

    const handleClick = useCallback(() => {
        if (!isSoldOut) onSelect(court);
    }, [isSoldOut, onSelect, court]);

    return (
        <button
            onClick={handleClick}
            disabled={isSoldOut}
            className="court-card group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-300 ease-out focus:outline-none"
            style={{
                contain: 'content',
                animationDelay: `${index * 60}ms`,
                ...(isSoldOut ? { opacity: 0.5, filter: 'grayscale(0.5)' } : isSelected ? { transform: 'translateY(-2px)' } : {}),
            }}
        >
            <div
                className="relative rounded-2xl overflow-hidden transition-all duration-300 border"
                style={{
                    borderColor: isSelected ? brandColor : 'rgba(0,0,0,0.06)',
                    boxShadow: isSelected
                        ? `0 0 0 1px ${brandColor}, 0 8px 24px ${brandColor}20`
                        : '0 1px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
            >
                <svg viewBox="0 0 280 170" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="272" height="162" rx="14" fill={isSoldOut ? 'url(#cs)' : 'url(#cg)'} />
                    <rect x="4" y="4" width="272" height="80" rx="14" fill="rgba(255,255,255,0.08)" />
                    <rect x="14" y="14" width="252" height="142" rx="3" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
                    <line x1="14" y1="50" x2="266" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                    <line x1="14" y1="120" x2="266" y2="120" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                    <line x1="140" y1="14" x2="140" y2="50" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
                    <line x1="140" y1="120" x2="140" y2="156" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
                    <line x1="14" y1="85" x2="266" y2="85" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeDasharray="7,4" />
                    <circle cx="22" cy="22" r="2.5" fill="rgba(255,255,255,0.35)" />
                    <circle cx="258" cy="22" r="2.5" fill="rgba(255,255,255,0.35)" />
                    <circle cx="22" cy="148" r="2.5" fill="rgba(255,255,255,0.35)" />
                    <circle cx="258" cy="148" r="2.5" fill="rgba(255,255,255,0.35)" />
                </svg>

                {isSelected && <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${brandColor}12 0%, transparent 40%)` }} />}
                {isSoldOut && (
                    <div className="absolute inset-0 pointer-events-none">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="url(#ss)" /></svg>
                    </div>
                )}

                <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                    {/* Top: name */}
                    <div className="flex items-start justify-between">
                        <span
                            className="font-bold text-[13px] rounded-lg px-2.5 py-1 leading-none"
                            style={{
                                color: isSoldOut ? '#666' : '#fff',
                                backgroundColor: isSoldOut ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.18)',
                                backdropFilter: 'blur(4px)',
                                textShadow: isSoldOut ? 'none' : '0 1px 2px rgba(0,0,0,0.15)',
                            }}
                        >
                            {court.court_name}
                        </span>
                        {isSelected && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: brandColor }}>ĐANG CHỌN</span>
                        )}
                    </div>

                    {/* Bottom: availability left, price right */}
                    <div className="flex items-end justify-between">
                        {isSoldOut ? (
                            <span className="text-[11px] font-semibold text-gray-500 bg-white/70 backdrop-blur-sm rounded-full px-2.5 py-1">Hết chỗ</span>
                        ) : (
                            <>
                                {/* Left: availability */}
                                <span
                                    className="text-[11px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center gap-1 bg-white/85 backdrop-blur-sm"
                                    style={{ color: '#374151' }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: freeCount > 4 ? '#22c55e' : freeCount > 2 ? '#eab308' : '#ef4444' }}
                                    />
                                    {freeCount} khung trống
                                </span>

                                {/* Right: price — large & prominent */}
                                {priceRange && (
                                    <span
                                        className="text-sm font-bold rounded-lg px-3 py-1.5 bg-white/90 backdrop-blur-sm shadow-sm"
                                        style={{ color: brandColor }}
                                    >
                                        {priceRange.label}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {isSoldOut && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-gray-500 font-bold text-xs tracking-wide">HẾT CHỖ</span>
                    </div>
                )}
            </div>
        </button>
    );
});

/* ─── Slot Pill ─── */
function SlotPill({ slot, isSelected, brandColor, onSelect }) {
    const priceLabel = formatVND(slot.price);
    return (
        <button
            onClick={() => onSelect(slot)}
            className="slot-pill inline-flex flex-col items-center rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 min-w-[60px] sm:min-w-[64px] shrink-0 border"
            style={
                isSelected
                    ? { backgroundColor: brandColor, color: '#fff', borderColor: brandColor, boxShadow: `0 3px 14px ${brandColor}40` }
                    : { backgroundColor: '#faf9f7', borderColor: 'rgba(0,0,0,0.06)', color: '#555' }
            }
        >
            <span className="text-sm font-bold leading-none">{hhmm(slot.start)}</span>
            <span className="text-[10px] mt-1" style={{ opacity: isSelected ? 0.85 : 0.5 }}>{priceLabel}</span>
        </button>
    );
}

/* ─── Empty State ─── */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 border border-gray-200/60 animate-float">
                <MapPin className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-bold text-base mb-1">Không còn chỗ trống</p>
            <p className="text-gray-400 text-sm">Vui lòng chọn ngày khác</p>
        </div>
    );
}

/* ─── Main ─── */
let pc = '#059669';

export default function Show({ tenant, date, courts, dateAvailability = {}, customer }) {
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [availableOnly, setAvailableOnly] = useState(false);
    const [timeFilter, setTimeFilter] = useState(null);
    const [sortBy, setSortBy] = useState(null);
    const form = useForm({ name: '', phone: '', court_id: null, start_at: '', end_at: '' });
    const formRef = useRef(form);
    formRef.current = form;

    const brand = tenant.settings?.branding ?? {};
    pc = brand.primary_color || '#059669';

    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const { fieldErrors, updateField, isFormValid } = useFieldValidation(form, {
        name: validators.name,
        phone: validators.phone,
    });

    /* Filter & sort courts */
    const filteredCourts = useMemo(() => {
        let result = [...courts];

        if (availableOnly) {
            result = result.filter((c) => c.free.length > 0);
        }

        if (timeFilter) {
            result = result.filter((c) => {
                return c.free.some((s) => {
                    const h = parseInt(s.start.slice(11, 13), 10);
                    if (timeFilter === 'Sáng') return h < 12;
                    if (timeFilter === 'Chiều') return h >= 12 && h < 18;
                    if (timeFilter === 'Tối') return h >= 18;
                    return false;
                });
            });
        }

        if (sortBy === 'price_asc') {
            result.sort((a, b) => {
                const aMin = a.free.length ? Math.min(...a.free.map((s) => s.price)) : Infinity;
                const bMin = b.free.length ? Math.min(...b.free.map((s) => s.price)) : Infinity;
                return aMin - bMin;
            });
        } else if (sortBy === 'price_desc') {
            result.sort((a, b) => {
                const aMax = a.free.length ? Math.max(...a.free.map((s) => s.price)) : -Infinity;
                const bMax = b.free.length ? Math.max(...b.free.map((s) => s.price)) : -Infinity;
                return bMax - aMax;
            });
        }

        return result;
    }, [courts, availableOnly, timeFilter, sortBy]);

    const isSoldOut = courts.length === 0 || courts.every((c) => c.free.length === 0);

    const changeDate = useCallback((d) => {
        setLoading(true);
        setSelectedCourt(null);
        setSelectedSlot(null);
        setSheetOpen(false);
        router.get(`/book/${tenant.slug}`, { date: d }, {
            preserveState: false,
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    }, [tenant.slug]);

    const handleCourtSelect = useCallback((court) => {
        setSelectedCourt(court);
        setSelectedSlot(null);
        setSheetOpen(true);
    }, []);

    const handleSlotSelect = useCallback((slot) => {
        setSelectedSlot(slot);
        const f = formRef.current;
        f.setData({ name: f.data.name, phone: f.data.phone, court_id: selectedCourt?.court_id, start_at: slot.start, end_at: slot.end });
    }, [selectedCourt]);

    const handleSheetClose = useCallback(() => {
        setSheetOpen(false);
        setSelectedCourt(null);
        setSelectedSlot(null);
        formRef.current.setData({ court_id: null, start_at: '', end_at: '' });
    }, []);

    const submit = useCallback((e) => {
        e.preventDefault();
        formRef.current.post(`/book/${tenant.slug}/hold`);
    }, [tenant.slug]);

    const slotGroups = useMemo(() => {
        if (!selectedCourt) return { Sáng: [], Chiều: [], Tối: [] };
        const g = { Sáng: [], Chiều: [], Tối: [] };
        selectedCourt.free.forEach((s) => {
            const h = parseInt(s.start.slice(11, 13), 10);
            if (h < 12) g['Sáng'].push(s);
            else if (h < 18) g['Chiều'].push(s);
            else g['Tối'].push(s);
        });
        return g;
    }, [selectedCourt]);

    return (
        <>
            <Toaster richColors position="top-center" />
            <div className="min-h-screen text-gray-800" style={{ backgroundColor: '#f4f3f0' }}>
                <Head title={`Đặt sân — ${tenant.name}`} />

                <style>{`
                    :root { --brand: ${pc}; }
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                    .venue-header { background: linear-gradient(180deg, #fff 0%, #f4f3f0 100%); border-bottom: 1px solid rgba(0,0,0,0.04); }
                    @keyframes court-entrance { from { opacity:0; transform:translateY(12px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
                    .court-card { animation: court-entrance 0.3s ease-out both; }
                    @keyframes float-gentle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
                    .animate-float { animation: float-gentle 3s ease-in-out infinite; }
                    .bottom-sheet { animation: sheet-up 0.3s cubic-bezier(0.32,0.72,0,1) both; }
                    @keyframes sheet-up { from { transform:translateY(100%); opacity:0.5; } to { transform:translateY(0); opacity:1; } }
                    .slot-pill:active:not(:disabled) { transform: scale(0.95); }
                `}</style>

                <SharedSvgDefs />

                {/* ─── Header: 3 rows compact ─── */}
                <header className="venue-header sticky top-0 z-20">
                    {/* Row 1: venue info */}
                    <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            {brand.logo_path && (
                                <img src={`/storage/${brand.logo_path}`} alt={tenant.name} className="h-9 w-9 rounded-lg object-cover border border-gray-200/60 bg-white shadow-sm shrink-0" />
                            )}
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base font-bold text-gray-800 truncate">{tenant.name}</h1>
                                <div className="flex items-center gap-1 mt-px">
                                    <ShieldCheck className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium truncate">Giữ sân 15 phút · cọc VietQR</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-gray-400 font-medium shrink-0">
                            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />Còn</span>
                            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />Sắp hết</span>
                            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />Hết</span>
                        </div>
                    </div>

                    {/* Row 1b: customer history link (if customer prop available) */}
                    {customer?.code && (
                        <div className="flex items-center justify-end px-4 sm:px-5 pb-1">
                            <button
                                onClick={() => router.visit(`/book/${tenant.slug}/cus-${customer.code}`)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-gray-500 bg-gray-100/60 hover:bg-gray-200/60 transition-colors"
                            >
                                <History className="h-3 w-3" />
                                Xem lịch sử đặt sân
                            </button>
                        </div>
                    )}

                    {/* Row 2: address + contact (if available) */}
                    {(tenant.address || tenant.phone) && (
                        <div className="flex items-center gap-3 px-4 sm:px-5 pb-2 text-[10px] text-gray-500">
                            {tenant.address && (
                                <span className="flex items-center gap-1 min-w-0">
                                    <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                                    <span className="truncate">{tenant.address}</span>
                                </span>
                            )}
                            {tenant.phone && (
                                <a href={`tel:${tenant.phone}`} className="flex items-center gap-1 shrink-0 hover:text-gray-700">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span>{tenant.phone}</span>
                                </a>
                            )}
                            {tenant.email && (
                                <a href={`mailto:${tenant.email}`} className="flex items-center gap-1 shrink-0 hover:text-gray-700">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <span>{tenant.email}</span>
                                </a>
                            )}
                            {tenant.website && (
                                <a href={tenant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 shrink-0 hover:text-gray-700">
                                    <Globe className="h-3 w-3 text-gray-400" />
                                    <span>Website</span>
                                </a>
                            )}
                        </div>
                    )}

                    {/* Row 3: date + filters */}
                    <div className="flex items-center gap-2 px-4 sm:px-5 pb-2.5">
                        {/* Date pills */}
                        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-1.5">
                                {(() => {
                                    const days = [];
                                    for (let i = -3; i <= 3; i++) {
                                        const d = new Date();
                                        d.setDate(d.getDate() + i);
                                        days.push(d);
                                    }
                                    return days.map((d) => {
                                        const ds = toDateStr(d);
                                        const active = ds === date;
                                        const isToday = ds === TODAY_STR;
                                        const hasAvailability = dateAvailability[ds] !== false;
                                        return (
                                            <button
                                                key={ds}
                                                onClick={() => changeDate(ds)}
                                                disabled={!hasAvailability}
                                                className={`flex flex-col items-center rounded-xl px-2.5 py-1.5 text-[10px] font-semibold transition-all shrink-0 border ${
                                                    active
                                                        ? 'text-white border-transparent shadow-sm'
                                                        : hasAvailability
                                                            ? 'bg-white/60 text-gray-500 border-gray-200/50 hover:bg-white hover:text-gray-700'
                                                            : 'bg-gray-100/40 text-gray-300 border-gray-100/50 cursor-not-allowed'
                                                }`}
                                                style={active ? { backgroundColor: pc, boxShadow: `0 2px 8px ${pc}30` } : {}}
                                            >
                                                <span className="uppercase tracking-wide opacity-70 leading-none mb-0.5">{isToday ? 'Nay' : DAY_NAMES[d.getDay()]}</span>
                                                <span className="text-sm font-bold leading-none">{d.getDate()}</span>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-7 bg-gray-200/80 shrink-0" />

                        {/* Filters */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={() => setAvailableOnly(!availableOnly)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                                    availableOnly ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-gray-400 border-gray-200/50 bg-white/50 hover:bg-white'
                                }`}
                            >Còn trống</button>

                            <button
                                onClick={() => setTimeFilter(timeFilter === 'Chiều' ? null : 'Chiều')}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                                    timeFilter ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-400 border-gray-200/50 bg-white/50 hover:bg-white'
                                }`}
                            >{timeFilter || 'Giờ'}</button>

                            <button
                                onClick={() => setSortBy(sortBy === 'price_asc' ? null : 'price_asc')}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                                    sortBy ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-400 border-gray-200/50 bg-white/50 hover:bg-white'
                                }`}
                            >{sortBy === 'price_asc' ? 'Giá ↑' : 'Giá'}</button>

                            <span className="text-[9px] text-gray-300 font-medium ml-0.5">{filteredCourts.length}/{courts.length}</span>
                        </div>
                    </div>
                </header>

                {/* ─── Courts ─── */}
                <main className="px-4 sm:px-5 pb-6 pt-1">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="animate-pulse rounded-2xl bg-gray-200/50 h-[160px] sm:h-[180px]" />
                            ))}
                        </div>
                    ) : isSoldOut ? (
                        <EmptyState />
                    ) : filteredCourts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <SlidersHorizontal className="h-8 w-8 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-semibold text-sm">Không có sân phù hợp</p>
                            <p className="text-gray-400 text-xs mt-1">Thử bỏ bộ lọc hoặc chọn ngày khác</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                            {filteredCourts.map((court, idx) => (
                                <CourtCard
                                    key={court.court_id}
                                    court={court}
                                    isSelected={selectedCourt?.court_id === court.court_id}
                                    isSoldOut={court.free.length === 0}
                                    brandColor={pc}
                                    onSelect={handleCourtSelect}
                                    index={idx}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* ─── Backdrop ─── */}
            {sheetOpen && selectedCourt && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" onClick={handleSheetClose} />
            )}

            {/* ─── Bottom Sheet ─── */}
            <div className="bottom-sheet fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200/80 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] rounded-t-3xl max-h-[88vh] sm:max-h-[85vh] overflow-y-auto overscroll-contain">
                <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white/95 backdrop-blur-md z-10 rounded-t-3xl">
                    <div className="w-9 h-[3px] rounded-full bg-gray-300" />
                </div>

                {selectedCourt && (
                    <>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${pc}12` }}>
                                    <MapPin className="h-4 w-4" style={{ color: pc }} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-800 text-sm truncate">{selectedCourt.court_name}</h3>
                                    <p className="text-[11px] text-gray-400">Còn {selectedCourt.free.length} khung giờ trống</p>
                                </div>
                            </div>
                            <button onClick={handleSheetClose} className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content: 2-column */}
                        <div className="flex flex-col sm:flex-row">
                            {/* Left: time slots */}
                            <div className="flex-1 px-4 sm:px-5 py-3 min-w-0">
                                {['Sáng', 'Chiều', 'Tối'].map((group) => {
                                    const slots = slotGroups[group];
                                    if (slots.length === 0) return null;
                                    return (
                                        <div key={group} className="mb-2.5 last:mb-0">
                                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-300">{group}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {slots.map((slot, i) => (
                                                    <SlotPill key={`${slot.start}-${i}`} slot={slot} isSelected={selectedSlot?.start === slot.start} brandColor={pc} onSelect={handleSlotSelect} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right: form */}
                            <div className="sm:w-[380px] shrink-0 px-4 sm:px-5 py-4 border-t sm:border-t-0 sm:border-l border-gray-100">
                                {selectedSlot ? (
                                    <form onSubmit={submit} className="space-y-3">
                                        {flash?.error && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                <span>{flash.error}</span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-gray-800 font-bold text-sm">{selectedCourt.court_name}</p>
                                            <p className="text-gray-400 text-[11px] mt-0.5">
                                                {new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            <p className="text-gray-500 text-[11px] font-medium mt-0.5">
                                                {hhmm(selectedSlot.start)} – {hhmm(selectedSlot.end)}
                                            </p>
                                            <p className="text-gray-800 font-bold text-base mt-1.5">{formatVND(selectedSlot.price)}</p>
                                            <p className="text-gray-400 text-[10px]">Tiền cọc giữ chỗ</p>
                                        </div>
                                        <div className="border-t border-gray-100" />
                                        <div className="space-y-2">
                                            <div>
                                                <Input placeholder="Họ tên (ít nhất 2 ký tự)" value={form.data.name} onChange={(e) => updateField('name', e.target.value)}
                                                    className={`h-9 bg-gray-50 text-gray-800 placeholder:text-gray-300 text-sm rounded-xl focus-visible:ring-gray-300 ${fieldErrors.name || form.errors.name ? 'border-red-300 focus-visible:ring-red-200' : 'border-gray-200/80'}`} />
                                                {(fieldErrors.name || form.errors.name) && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{fieldErrors.name || form.errors.name}</p>}
                                            </div>
                                            <div>
                                                <Input placeholder="Số điện thoại (VD: 0912345678)" type="tel" value={form.data.phone} onChange={(e) => updateField('phone', e.target.value)}
                                                    className={`h-9 bg-gray-50 text-gray-800 placeholder:text-gray-300 text-sm rounded-xl focus-visible:ring-gray-300 ${fieldErrors.phone || form.errors.phone ? 'border-red-300 focus-visible:ring-red-200' : 'border-gray-200/80'}`} />
                                                {(fieldErrors.phone || form.errors.phone) && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{fieldErrors.phone || form.errors.phone}</p>}
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={form.processing || !isFormValid}
                                            className="w-full h-10 rounded-xl text-sm font-bold shadow-md transition-all duration-200 hover:brightness-110 active:scale-[0.98] text-white"
                                            style={{ backgroundColor: pc, boxShadow: `0 3px 16px ${pc}30` }}>
                                            {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                            Giữ chỗ
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-center h-full min-h-[120px]">
                                        <p className="text-gray-300 text-sm">Chọn khung giờ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
