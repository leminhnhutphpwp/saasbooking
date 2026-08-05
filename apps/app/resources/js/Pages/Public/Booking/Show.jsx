import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { AlertCircle, CalendarDays, Check, ChevronRight, Clock3, Loader2, MapPin, Phone, X } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { formatVND } from '@/lib/format';
import { validators } from '@/lib/validators';
import { useFieldValidation } from '@/hooks/useFieldValidation';

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const hhmm = (iso) => iso.slice(11, 16);
const toDateStr = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const TODAY_STR = toDateStr(new Date());

function CourtRow({ court, selected, brandColor, onSelect }) {
    const freeCount = court.free.length;
    const firstSlot = court.free[0];
    const prices = court.free.map((slot) => slot.price).filter((price) => price > 0);
    const fromPrice = prices.length ? Math.min(...prices) : null;

    return (
        <button
            type="button"
            className="court-card group flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition hover:border-gray-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4"
            style={selected ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : {}}
            onClick={(event) => onSelect(court, event.currentTarget)}
            disabled={!freeCount}
            aria-pressed={selected}
            aria-label={`${court.court_name}, ${freeCount ? `còn ${freeCount} khung giờ` : 'hết chỗ'}`}
        >
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <span className="text-[10px] font-semibold uppercase">Sân</span>
                <span className="text-lg font-bold leading-none">{court.court_name.replace(/^.*?(\d+)$/, '$1')}</span>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">{court.court_name}</p>
                    {selected && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: brandColor }}>ĐANG CHỌN</span>}
                </div>
                {freeCount ? (
                    <p className="mt-1 text-xs text-gray-500">{freeCount} giờ trống{firstSlot ? ` · sớm nhất ${hhmm(firstSlot.start)}` : ''}</p>
                ) : <p className="mt-1 text-xs font-medium text-gray-400">Đã kín lịch</p>}
            </div>
            <div className="shrink-0 text-right">
                {fromPrice !== null && <p className="text-sm font-bold text-gray-900">{formatVND(fromPrice)}</p>}
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: freeCount ? brandColor : '#9ca3af' }}>
                    {freeCount ? 'Chọn giờ' : 'Hết chỗ'} {freeCount ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                </span>
            </div>
        </button>
    );
}

function SlotPill({ slot, isSelected, brandColor, onSelect }) {
    return (
        <button
            type="button"
            className="slot-pill rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2"
            style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor, color: '#fff' } : { borderColor: '#e5e7eb', color: '#1f2937' }}
            onClick={() => onSelect(slot)}
            aria-pressed={isSelected}
            aria-label={`${hhmm(slot.start)} đến ${hhmm(slot.end)}, ${formatVND(slot.price)}${isSelected ? ', đang chọn' : ''}`}
        >
            <span className="block text-sm font-bold">{hhmm(slot.start)} - {hhmm(slot.end)}</span>
            <span className="mt-0.5 block text-[11px] opacity-75">{formatVND(slot.price)}</span>
        </button>
    );
}

export default function Show({ tenant, date, courts, dateAvailability = {} }) {
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const form = useForm({ name: '', phone: '', court_id: null, start_at: '', end_at: '' });
    const formRef = useRef(form);
    const sheetRef = useRef(null);
    const courtTriggerRef = useRef(null);
    const mainRef = useRef(null);
    formRef.current = form;

    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';
    const { flash } = usePage().props;
    const { fieldErrors, updateField, isFormValid } = useFieldValidation(form, { name: validators.name, phone: validators.phone });
    const isSoldOut = courts.length === 0 || courts.every((court) => court.free.length === 0);
    const selectedDateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const changeDate = useCallback((nextDate) => {
        setLoading(true);
        setSelectedCourt(null);
        setSelectedSlot(null);
        setSheetOpen(false);
        router.get(`/book/${tenant.slug}`, { date: nextDate }, { preserveState: false, preserveScroll: true, onFinish: () => setLoading(false) });
    }, [tenant.slug]);

    const handleCourtSelect = useCallback((court, trigger) => {
        courtTriggerRef.current = trigger;
        setSelectedCourt(court);
        setSelectedSlot(null);
        setSheetOpen(true);
    }, []);

    const handleSlotSelect = useCallback((slot) => {
        setSelectedSlot(slot);
        const current = formRef.current;
        current.setData({ name: current.data.name, phone: current.data.phone, court_id: selectedCourt?.court_id, start_at: slot.start, end_at: slot.end });
    }, [selectedCourt]);

    const handleSheetClose = useCallback(() => {
        const trigger = courtTriggerRef.current;
        setSheetOpen(false);
        setSelectedCourt(null);
        setSelectedSlot(null);
        formRef.current.setData({ court_id: null, start_at: '', end_at: '' });
        requestAnimationFrame(() => (trigger?.isConnected && !trigger.disabled ? trigger : mainRef.current)?.focus());
    }, []);

    useEffect(() => {
        if (!sheetOpen) return undefined;
        const frame = requestAnimationFrame(() => sheetRef.current?.querySelector('[data-sheet-close]')?.focus());
        return () => cancelAnimationFrame(frame);
    }, [sheetOpen]);

    const handleSheetKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            handleSheetClose();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = [...(sheetRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? [])].filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }, [handleSheetClose]);

    const slotGroups = useMemo(() => {
        const groups = { Sáng: [], Chiều: [], Tối: [] };
        selectedCourt?.free.forEach((slot) => {
            const hour = Number(slot.start.slice(11, 13));
            groups[hour < 12 ? 'Sáng' : hour < 18 ? 'Chiều' : 'Tối'].push(slot);
        });
        return groups;
    }, [selectedCourt]);

    const submit = useCallback((event) => {
        event.preventDefault();
        formRef.current.post(`/book/${tenant.slug}/hold`);
    }, [tenant.slug]);

    const days = Array.from({ length: 7 }, (_, index) => {
        const next = new Date();
        next.setDate(next.getDate() + index - 1);
        return next;
    });

    return <>
        <Toaster richColors position="top-center" />
        <Head title={`Đặt sân - ${tenant.name}`} />
        <div className="min-h-screen bg-[#f6f5f2] text-gray-800">
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                {brand.logo_path && <img src={`/storage/${brand.logo_path}`} alt="" className="h-9 w-9 rounded-lg border object-cover" />}
                                <h1 className="truncate text-lg font-bold text-gray-950">{tenant.name}</h1>
                            </div>
                            {(tenant.address || tenant.phone) && <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                                {tenant.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tenant.address}</span>}
                                {tenant.phone && <a className="inline-flex items-center gap-1 font-medium text-gray-600" href={`tel:${tenant.phone}`}><Phone className="h-3.5 w-3.5" />{tenant.phone}</a>}
                            </div>}
                        </div>
                        <div className="shrink-0 rounded-lg px-2.5 py-1.5 text-right" style={{ backgroundColor: `${pc}12` }}>
                            <span className="block text-[10px] font-bold uppercase tracking-wide" style={{ color: pc }}>Ngày đặt</span>
                            <span className="block text-xs font-semibold text-gray-800">{selectedDateLabel}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                        {days.map((day) => {
                            const value = toDateStr(day);
                            const active = value === date;
                            const available = dateAvailability[value] !== false;
                            return <button key={value} type="button" disabled={!available} onClick={() => changeDate(value)} className="shrink-0 rounded-lg border px-3 py-2 text-center transition disabled:opacity-35" style={active ? { backgroundColor: pc, borderColor: pc, color: '#fff' } : { background: '#fff', borderColor: '#e5e7eb' }}>
                                <span className="block text-[10px] font-semibold">{value === TODAY_STR ? 'Hôm nay' : DAY_NAMES[day.getDay()]}</span>
                                <span className="block text-lg font-bold leading-none">{day.getDate()}</span>
                            </button>;
                        })}
                    </div>
                </div>
            </header>

            <main ref={mainRef} tabIndex={-1} className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Lịch sân</p>
                        <h2 className="mt-1 text-xl font-bold text-gray-950">Chọn sân và giờ chơi</h2>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-gray-500">{courts.filter((court) => court.free.length).length}/{courts.length} sân còn giờ</p>
                </div>
                {loading ? <div className="space-y-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[76px] animate-pulse rounded-xl bg-gray-200" />)}</div>
                    : isSoldOut ? <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center"><CalendarDays className="mx-auto h-8 w-8 text-gray-300" /><p className="mt-3 font-bold">Ngày này đã kín lịch</p><p className="mt-1 text-sm text-gray-500">Chọn một ngày còn trống để xem giờ chơi.</p></div>
                        : <div className="space-y-2">{courts.map((court) => <CourtRow key={court.court_id} court={court} selected={selectedCourt?.court_id === court.court_id} brandColor={pc} onSelect={handleCourtSelect} />)}</div>}
            </main>
        </div>

        {sheetOpen && selectedCourt && <div className="fixed inset-0 z-40 bg-black/30" onClick={handleSheetClose} />}
        {sheetOpen && selectedCourt && <div ref={sheetRef} className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-[min(720px,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="booking-sheet-title" onKeyDown={handleSheetKeyDown}>
            <div className="flex items-start justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
                <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Chọn giờ cho</p><h3 id="booking-sheet-title" className="mt-1 text-lg font-bold text-gray-950">{selectedCourt.court_name}</h3><p className="mt-0.5 text-xs text-gray-500">{selectedDateLabel} · {selectedCourt.free.length} khung giờ trống</p></div>
                <button data-sheet-close type="button" onClick={handleSheetClose} aria-label="Đóng chọn sân" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-5 p-4 sm:grid-cols-[1fr_280px] sm:p-6">
                <div className="space-y-4">{Object.entries(slotGroups).map(([period, slots]) => slots.length ? <section key={period}><p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{period}</p><div className="grid grid-cols-2 gap-2 xs:grid-cols-3">{slots.map((slot) => <SlotPill key={slot.start} slot={slot} isSelected={selectedSlot?.start === slot.start} brandColor={pc} onSelect={handleSlotSelect} />)}</div></section> : null)}</div>
                <div className="border-t border-gray-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    {selectedSlot ? <form onSubmit={submit} className="space-y-3">
                        <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-bold text-gray-500">TÓM TẮT ĐẶT SÂN</p><p className="mt-2 font-bold text-gray-900">{selectedCourt.court_name}</p><p className="text-sm text-gray-600">{hhmm(selectedSlot.start)} - {hhmm(selectedSlot.end)} · {selectedDateLabel}</p><p className="mt-2 text-lg font-bold" style={{ color: pc }}>{formatVND(selectedSlot.price)}</p><p className="text-[11px] text-gray-500">Tiền cọc và hạn giữ chỗ hiển thị ở bước thanh toán.</p></div>
                        {flash?.error && <p className="flex gap-1 text-xs text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{flash.error}</p>}
                        <Input placeholder="Họ tên (ít nhất 2 ký tự)" value={form.data.name} onChange={(event) => updateField('name', event.target.value)} className={fieldErrors.name || form.errors.name ? 'border-red-400' : ''} />
                        {(fieldErrors.name || form.errors.name) && <p className="text-xs text-red-600">{fieldErrors.name || form.errors.name}</p>}
                        <Input placeholder="Số điện thoại (VD: 0912345678)" type="tel" value={form.data.phone} onChange={(event) => updateField('phone', event.target.value)} className={fieldErrors.phone || form.errors.phone ? 'border-red-400' : ''} />
                        {(fieldErrors.phone || form.errors.phone) && <p className="text-xs text-red-600">{fieldErrors.phone || form.errors.phone}</p>}
                        <Button type="submit" disabled={form.processing || !isFormValid} className="w-full text-white" style={{ backgroundColor: pc }}>{form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}Giữ chỗ</Button>
                    </form> : <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 text-center"><Clock3 className="h-5 w-5 text-gray-300" /><p className="mt-2 text-sm font-medium text-gray-500">Chọn một giờ trống</p></div>}
                </div>
            </div>
        </div>}
    </>;
}
