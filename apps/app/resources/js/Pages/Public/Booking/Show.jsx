import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { formatVND } from '@/lib/format';
import { MapPin, X, Check, Loader2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

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

// Date strip component
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

// Loading skeleton
function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-4 p-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="flex gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-16 w-[52px] rounded-xl bg-muted" />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-muted" />
                ))}
            </div>
        </div>
    );
}

// SVG Court component
function CourtSVG({ court, x, y, width, height, isSelected, brandColor, onSelect }) {
    const freeCount = court.free.length;
    const isSoldOut = freeCount === 0;

    const bgColor = isSoldOut
        ? '#f3f4f6' // gray-100
        : isSelected
            ? brandColor
            : `${brandColor}15`; // 15 = ~8% opacity

    const borderColor = isSoldOut
        ? '#e5e7eb' // gray-200
        : isSelected
            ? brandColor
            : `${brandColor}40`; // 40 = ~25% opacity

    const textColor = isSoldOut
        ? '#9ca3af' // gray-400
        : isSelected
            ? '#ffffff'
            : '#1f2937'; // gray-800

    return (
        <g
            onClick={() => !isSoldOut && onSelect(court)}
            style={{ cursor: isSoldOut ? 'default' : 'pointer' }}
            className="court-group"
        >
            {/* Court rectangle */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={12}
                ry={12}
                fill={bgColor}
                stroke={borderColor}
                strokeWidth={2}
                className="court-rect"
            />

            {/* Court name */}
            <text
                x={x + width / 2}
                y={y + height / 2 - 8}
                textAnchor="middle"
                fill={textColor}
                fontSize={14}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
            >
                {court.court_name}
            </text>

            {/* Slot count badge */}
            {!isSoldOut ? (
                <g>
                    <rect
                        x={x + width / 2 - 24}
                        y={y + height / 2 + 6}
                        width={48}
                        height={20}
                        rx={10}
                        fill={isSelected ? 'rgba(255,255,255,0.2)' : `${brandColor}20`}
                    />
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 20}
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : brandColor}
                        fontSize={11}
                        fontWeight={500}
                        fontFamily="system-ui, sans-serif"
                    >
                        Còn {freeCount} khung
                    </text>
                </g>
            ) : (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 14}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize={12}
                    fontFamily="system-ui, sans-serif"
                >
                    Hết chỗ
                </text>
            )}

            {/* Hover effect overlay */}
            {!isSoldOut && (
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={12}
                    ry={12}
                    fill="transparent"
                    className="court-hover"
                />
            )}
        </g>
    );
}

// Time slot pill component
function SlotPill({ slot, isSelected, brandColor, onSelect }) {
    const isPeak = slot.peak;

    return (
        <button
            onClick={() => onSelect(slot)}
            className={`inline-flex flex-col items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all min-w-[72px] ${
                isSelected
                    ? 'text-white shadow-md'
                    : isPeak
                        ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'border-border bg-card hover:border-foreground/30 hover:bg-accent'
            }`}
            style={
                isSelected
                    ? { backgroundColor: brandColor, borderColor: brandColor }
                    : {}
            }
        >
            <span className="text-base font-bold">{hhmm(slot.start)}</span>
            <span className="text-xs opacity-70">{formatVND(slot.price)}</span>
            {isPeak && (
                <Badge variant="secondary" className="mt-1 h-4 px-1 text-[9px]">
                    Cao
                </Badge>
            )}
        </button>
    );
}

// Bottom panel for court selection
function CourtPanel({ court, selectedSlot, brandColor, onSlotSelect, onClose, children }) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!court) return null;

    const freeCount = court.free.length;

    // Group slots by time of day
    const groups = { Sáng: [], Chiều: [], Tối: [] };
    court.free.forEach((slot) => {
        const h = parseInt(slot.start.slice(11, 13), 10);
        const g = slotGroup(h);
        groups[g].push(slot);
    });

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-border shadow-2xl rounded-t-2xl transition-all duration-300 ease-out">
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-2 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${brandColor}20` }}
                    >
                        <MapPin className="h-5 w-5" style={{ color: brandColor }} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{court.court_name}</h3>
                        <p className="text-xs text-muted-foreground">
                            Còn {freeCount} khung giờ trống
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Slot selection */}
            {isExpanded && (
                <div className="px-4 py-3 max-h-[40vh] overflow-y-auto">
                    {['Sáng', 'Chiều', 'Tối'].map((group) => {
                        const slots = groups[group];
                        if (slots.length === 0) return null;
                        return (
                            <div key={group} className="mb-3 last:mb-0">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {group} ({hhmm(slots[0].start)?.split(':')[0]}h – {hhmm(slots[slots.length - 1].end)?.split(':')[0]}h)
                                </p>
                                <div className="flex flex-wrap gap-2">
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
            )}

            {/* Booking form (rendered as children) */}
            {children}
        </div>
    );
}

// Empty state
function EmptyState() {
    return (
        <div className="rounded-xl border bg-card p-10 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted/80">
                <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Hôm nay không còn chỗ trống</p>
            <p className="mt-1 text-sm text-muted-foreground">Vui lòng chọn ngày khác</p>
        </div>
    );
}

export default function Show({ tenant, date, courts }) {
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const form = useForm({ name: '', phone: '', court_id: null, start_at: '', end_at: '' });
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    const isSoldOut = courts.length === 0 || courts.every((c) => c.free.length === 0);

    // Calculate court positions for SVG layout
    const courtLayout = useMemo(() => {
        if (courts.length === 0) return { courts: [], viewBox: '0 0 400 300' };

        const COURT_WIDTH = 160;
        const COURT_HEIGHT = 100;
        const GAP = 16;
        const PADDING = 20;

        // Calculate columns based on screen width (responsive)
        const cols = courts.length === 1 ? 1 : 2;
        const rows = Math.ceil(courts.length / cols);

        const totalWidth = cols * COURT_WIDTH + (cols - 1) * GAP + PADDING * 2;
        const totalHeight = rows * COURT_HEIGHT + (rows - 1) * GAP + PADDING * 2;

        const positionedCourts = courts.map((court, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            return {
                court,
                x: PADDING + col * (COURT_WIDTH + GAP),
                y: PADDING + row * (COURT_HEIGHT + GAP),
                width: COURT_WIDTH,
                height: COURT_HEIGHT,
            };
        });

        return {
            courts: positionedCourts,
            viewBox: `0 0 ${totalWidth} ${totalHeight}`,
        };
    }, [courts]);

    const changeDate = (d) => {
        setLoading(true);
        setSelectedCourt(null);
        setSelectedSlot(null);
        setIsPanelOpen(false);
        router.get(`/book/${tenant.slug}`, { date: d }, {
            preserveState: false,
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    };

    const handleCourtSelect = useCallback((court) => {
        setSelectedCourt(court);
        setSelectedSlot(null);
        setIsPanelOpen(true);
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

    const handlePanelClose = useCallback(() => {
        setIsPanelOpen(false);
        setSelectedCourt(null);
        setSelectedSlot(null);
        form.setData({ court_id: null, start_at: '', end_at: '' });
    }, [form]);

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
                
                .court-rect {
                    transition: all 0.2s ease;
                }
                .court-group:hover .court-rect {
                    filter: brightness(0.95);
                    transform: scale(1.02);
                    transform-origin: center;
                }
                .court-hover {
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .court-group:hover .court-hover {
                    opacity: 1;
                    fill: rgba(0, 0, 0, 0.03);
                }
                
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .panel-slide-up {
                    animation: slideUp 0.3s ease-out;
                }
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

                    {isSoldOut ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-4">
                            {/* SVG Venue Map */}
                            <div className="rounded-2xl border bg-white p-2 shadow-sm">
                                <svg
                                    viewBox={courtLayout.viewBox}
                                    className="w-full h-auto"
                                    style={{ minHeight: '200px' }}
                                >
                                    {/* Background pattern for floor plan feel */}
                                    <defs>
                                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />

                                    {/* Courts */}
                                    {courtLayout.courts.map(({ court, x, y, width, height }) => (
                                        <CourtSVG
                                            key={court.court_id}
                                            court={court}
                                            x={x}
                                            y={y}
                                            width={width}
                                            height={height}
                                            isSelected={selectedCourt?.court_id === court.court_id}
                                            brandColor={pc}
                                            onSelect={handleCourtSelect}
                                        />
                                    ))}
                                </svg>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: `${pc}15`, border: `1px solid ${pc}40` }} />
                                    <span>Còn chỗ</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: pc }} />
                                    <span>Đang chọn</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                                    <span>Hết chỗ</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Panel */}
            {isPanelOpen && selectedCourt && (
                <CourtPanel
                    court={selectedCourt}
                    selectedSlot={selectedSlot}
                    brandColor={pc}
                    onSlotSelect={handleSlotSelect}
                    onClose={handlePanelClose}
                >
                    {/* Booking Form */}
                    {selectedSlot && (
                        <div className="px-4 py-4 border-t border-border bg-white">
                            <form onSubmit={submit} className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-foreground">
                                            {selectedCourt.court_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })} · {hhmm(selectedSlot.start)}–{hhmm(selectedSlot.end)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-muted-foreground">Giá sân:</span>
                                    <span className="font-semibold">{formatVND(selectedSlot.price)}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">Cọc:</span>
                                    <span className="font-semibold">{formatVND(Math.round(selectedSlot.price))}</span>
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
                    )}
                </CourtPanel>
            )}
        </div>
    );
}
