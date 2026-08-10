import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import {
    CalendarDays,
    Check,
    ChevronRight,
    Clock3,
    Loader2,
    MapPin,
    Phone,
    X,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { formatVND, formatTime } from "@/lib/format";
import { validators } from "@/lib/validators";
import { useFieldValidation } from "@/hooks/useFieldValidation";

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const toDateStr = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const TODAY_STR = toDateStr(new Date());

function CourtRow({ court, selected, onSelect }) {
    const freeCount = court.free.length;
    const firstSlot = court.free[0];
    const prices = court.free
        .map((slot) => slot.price)
        .filter((price) => price > 0);
    const fromPrice = prices.length ? Math.min(...prices) : null;

    return (
        <button
            type="button"
            className={`flex min-h-16 w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-turf-100 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "court-mark bg-turf-100" : "bg-surface"}`}
            onClick={(event) => onSelect(court, event.currentTarget)}
            disabled={!freeCount}
            aria-pressed={selected}
        >
            <span className="grid size-11 shrink-0 place-items-center rounded-inner bg-sunk text-ink-soft">
                <span className="text-xs font-semibold">Sân</span>
                <span className="font-num text-lg font-bold leading-none">
                    {court.court_name.replace(/^Sân\s*/i, "")}
                </span>
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink">
                        {court.court_name}
                    </span>
                    {selected && (
                        <span className="rounded-full bg-turf-100 px-2 py-1 text-xs font-bold text-ink">
                            Đang chọn
                        </span>
                    )}
                </span>
                <span className="mt-1 block text-xs text-ink-soft">
                    {freeCount
                        ? `${freeCount} giờ trống${firstSlot ? ` · sớm nhất ${formatTime(firstSlot.start)}` : ""}`
                        : "Đã kín lịch"}
                </span>
            </span>
            <span className="shrink-0 text-right">
                {fromPrice !== null && (
                    <span className="font-num block text-sm font-bold text-ink">
                        {formatVND(fromPrice)}
                    </span>
                )}
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-turf-700">
                    {freeCount ? "Chọn giờ" : "Hết chỗ"}{" "}
                    {freeCount && <ChevronRight className="size-4" />}
                </span>
            </span>
        </button>
    );
}

function SlotPill({ slot, isSelected, onSelect }) {
    return (
        <button
            type="button"
            className={`min-h-16 rounded-inner p-2 text-left transition-colors hover:bg-turf-100 ${isSelected ? "court-mark bg-turf-100 text-ink" : "bg-surface text-ink"}`}
            onClick={() => onSelect(slot)}
            aria-pressed={isSelected}
        >
            <span className="font-num block text-sm font-bold">
                {formatTime(slot.start)} - {formatTime(slot.end)}
            </span>
            <span className="font-num mt-1 block text-xs text-ink-soft">
                {formatVND(slot.price)}
            </span>
            {isSelected && (
                <span className="mt-1 block text-xs font-semibold">
                    Đã chọn
                </span>
            )}
        </button>
    );
}

export default function Show({ tenant, date, courts, dateAvailability = {} }) {
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const form = useForm({
        name: "",
        phone: "",
        court_id: null,
        start_at: "",
        end_at: "",
    });
    const formRef = useRef(form);
    const sheetRef = useRef(null);
    const courtTriggerRef = useRef(null);
    const mainRef = useRef(null);
    formRef.current = form;
    const { flash } = usePage().props;
    const { fieldErrors, updateField, isFormValid } = useFieldValidation(form, {
        name: validators.name,
        phone: validators.phone,
    });
    const isSoldOut =
        courts.length === 0 || courts.every((court) => court.free.length === 0);
    const selectedDateLabel = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date(`${date}T12:00:00+07:00`));
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);
    const changeDate = useCallback(
        (nextDate) => {
            setLoading(true);
            setSelectedCourt(null);
            setSelectedSlot(null);
            setSheetOpen(false);
            router.get(
                `/book/${tenant.slug}`,
                { date: nextDate },
                {
                    preserveState: false,
                    preserveScroll: true,
                    onFinish: () => setLoading(false),
                },
            );
        },
        [tenant.slug],
    );
    const handleCourtSelect = useCallback((court, trigger) => {
        courtTriggerRef.current = trigger;
        setSelectedCourt(court);
        setSelectedSlot(null);
        setSheetOpen(true);
    }, []);
    const handleSlotSelect = useCallback(
        (slot) => {
            setSelectedSlot(slot);
            const current = formRef.current;
            current.setData({
                name: current.data.name,
                phone: current.data.phone,
                court_id: selectedCourt?.court_id,
                start_at: slot.start,
                end_at: slot.end,
            });
        },
        [selectedCourt],
    );
    const handleSheetClose = useCallback(() => {
        const trigger = courtTriggerRef.current;
        setSheetOpen(false);
        setSelectedCourt(null);
        setSelectedSlot(null);
        formRef.current.setData({ court_id: null, start_at: "", end_at: "" });
        requestAnimationFrame(() =>
            (trigger?.isConnected && !trigger.disabled
                ? trigger
                : mainRef.current
            )?.focus(),
        );
    }, []);
    useEffect(() => {
        if (!sheetOpen) return undefined;
        const frame = requestAnimationFrame(() =>
            sheetRef.current?.querySelector("[data-sheet-close]")?.focus(),
        );
        return () => cancelAnimationFrame(frame);
    }, [sheetOpen]);
    const handleSheetKeyDown = useCallback(
        (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                handleSheetClose();
                return;
            }
            if (event.key !== "Tab") return;
            const focusable = [
                ...(sheetRef.current?.querySelectorAll(
                    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
                ) ?? []),
            ].filter((element) => element.getClientRects().length > 0);
            const first = focusable[0];
            const last = focusable.at(-1);
            if (!first || !last) return;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        },
        [handleSheetClose],
    );
    const slotGroups = useMemo(() => {
        const groups = { Sáng: [], Chiều: [], Tối: [] };
        selectedCourt?.free.forEach((slot) => {
            const hour = Number(slot.start.slice(11, 13));
            groups[hour < 12 ? "Sáng" : hour < 18 ? "Chiều" : "Tối"].push(slot);
        });
        return groups;
    }, [selectedCourt]);
    const submit = useCallback(
        (event) => {
            event.preventDefault();
            formRef.current.post(`/book/${tenant.slug}/hold`);
        },
        [tenant.slug],
    );
    const days = Array.from({ length: 7 }, (_, index) => {
        const next = new Date();
        next.setDate(next.getDate() + index - 1);
        return next;
    });

    return (
        <>
            <Toaster richColors position="top-center" />
            <Head title={`Đặt sân - ${tenant.name}`} />
            <div className="min-h-screen bg-plane text-ink">
                <header className="bg-surface">
                    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {tenant.settings?.branding?.logo_path && (
                                        <img
                                            src={`/storage/${tenant.settings.branding.logo_path}`}
                                            alt=""
                                            className="size-9 rounded-inner object-cover"
                                        />
                                    )}
                                    <h1 className="truncate text-lg font-bold">
                                        {tenant.name}
                                    </h1>
                                </div>
                                {(tenant.address || tenant.phone) && (
                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                                        {tenant.address && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="size-4" />
                                                {tenant.address}
                                            </span>
                                        )}
                                        {tenant.phone && (
                                            <a
                                                className="inline-flex items-center gap-1 font-medium"
                                                href={`tel:${tenant.phone}`}
                                            >
                                                <Phone className="size-4" />
                                                {tenant.phone}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="shrink-0 rounded-inner bg-sunk px-3 py-2 text-right">
                                <span className="block text-xs font-semibold text-ink-soft">
                                    Ngày đặt
                                </span>
                                <span className="block text-xs font-semibold">
                                    {selectedDateLabel}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            {days.map((day) => {
                                const value = toDateStr(day);
                                const active = value === date;
                                const available =
                                    dateAvailability[value] !== false;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        disabled={!available}
                                        onClick={() => changeDate(value)}
                                        aria-pressed={active}
                                        className={`min-h-11 shrink-0 rounded-full px-3 py-2 text-center disabled:opacity-35 ${active ? "bg-turf-600 text-white" : "bg-surface text-ink"}`}
                                    >
                                        <span className="block text-xs font-semibold">
                                            {value === TODAY_STR
                                                ? "Hôm nay"
                                                : DAY_NAMES[day.getDay()]}
                                        </span>
                                        <span className="font-num block text-lg font-bold leading-none">
                                            {day.getDate()}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </header>
                <main
                    ref={mainRef}
                    tabIndex={-1}
                    className="mx-auto max-w-5xl px-4 py-6 sm:px-6"
                >
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase text-ink-mute">
                                Lịch sân
                            </p>
                            <h2 className="mt-1 text-xl font-bold">
                                Chọn sân và giờ chơi
                            </h2>
                        </div>
                        <p className="shrink-0 text-xs text-ink-soft">
                            {courts.filter((court) => court.free.length).length}
                            /{courts.length} sân còn giờ
                        </p>
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-16 rounded-inner bg-sunk"
                                />
                            ))}
                        </div>
                    ) : isSoldOut ? (
                        <div className="rounded-card bg-surface px-5 py-12 text-center shadow-card">
                            <CalendarDays className="mx-auto size-8 text-ink-mute" />
                            <p className="mt-3 font-bold">
                                Ngày này đã kín lịch
                            </p>
                            <p className="mt-1 text-sm text-ink-soft">
                                Chọn một ngày còn trống để xem giờ chơi.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-surface shadow-card">
                            {courts.map((court) => (
                                <CourtRow
                                    key={court.court_id}
                                    court={court}
                                    selected={
                                        selectedCourt?.court_id ===
                                        court.court_id
                                    }
                                    onSelect={handleCourtSelect}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
            {sheetOpen && selectedCourt && (
                <div
                    className="fixed inset-0 z-40 ui-overlay"
                    onClick={handleSheetClose}
                />
            )}
            {sheetOpen && selectedCourt && (
                <div
                    ref={sheetRef}
                    className="fixed inset-x-0 bottom-0 z-50 max-h-screen overflow-y-auto rounded-card bg-surface shadow-float sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-full sm:max-w-2xl sm:-translate-x-1/2"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="booking-sheet-title"
                    onKeyDown={handleSheetKeyDown}
                >
                    <div className="flex items-start justify-between border-b px-4 py-4 sm:px-6">
                        <div>
                            <p className="text-xs font-semibold uppercase text-ink-mute">
                                Chọn giờ cho
                            </p>
                            <h3
                                id="booking-sheet-title"
                                className="mt-1 text-lg font-bold"
                            >
                                {selectedCourt.court_name}
                            </h3>
                            <p className="mt-1 text-xs text-ink-soft">
                                {selectedDateLabel} ·{" "}
                                {selectedCourt.free.length} khung giờ trống
                            </p>
                        </div>
                        <button
                            data-sheet-close
                            type="button"
                            onClick={handleSheetClose}
                            aria-label="Đóng chọn sân"
                            className="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-sunk"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                    <div className="grid gap-6 p-4 sm:grid-cols-5 sm:p-6">
                        <div className="space-y-4 sm:col-span-3">
                            {Object.entries(slotGroups).map(
                                ([period, slots]) =>
                                    slots.length ? (
                                        <section key={period}>
                                            <p className="mb-2 text-xs font-semibold uppercase text-ink-mute">
                                                {period}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {slots.map((slot) => (
                                                    <SlotPill
                                                        key={slot.start}
                                                        slot={slot}
                                                        isSelected={
                                                            selectedSlot?.start ===
                                                            slot.start
                                                        }
                                                        onSelect={
                                                            handleSlotSelect
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    ) : null,
                            )}
                        </div>
                        <div className="border-t pt-4 sm:col-span-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                            {selectedSlot ? (
                                <form onSubmit={submit} className="space-y-3">
                                    <div className="rounded-inner bg-sunk p-3">
                                        <p className="text-xs font-semibold text-ink-soft">
                                            Tóm tắt đặt sân
                                        </p>
                                        <p className="mt-2 font-bold">
                                            {selectedCourt.court_name}
                                        </p>
                                        <p className="text-sm text-ink-soft">
                                            {formatTime(selectedSlot.start)} -{" "}
                                            {formatTime(selectedSlot.end)} ·{" "}
                                            {selectedDateLabel}
                                        </p>
                                        <p className="font-num mt-2 text-lg font-bold text-turf-700">
                                            {formatVND(selectedSlot.price)}
                                        </p>
                                        <p className="mt-1 text-xs text-ink-soft">
                                            Tiền cọc và hạn giữ chỗ hiển thị ở
                                            bước thanh toán.
                                        </p>
                                    </div>
                                    <Input
                                        aria-label="Họ tên"
                                        placeholder="Họ tên (ít nhất 2 ký tự)"
                                        value={form.data.name}
                                        onChange={(event) =>
                                            updateField(
                                                "name",
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            fieldErrors.name ||
                                                form.errors.name,
                                        )}
                                    />
                                    {(fieldErrors.name || form.errors.name) && (
                                        <p className="text-xs text-destructive">
                                            {fieldErrors.name ||
                                                form.errors.name}
                                        </p>
                                    )}
                                    <Input
                                        aria-label="Số điện thoại"
                                        placeholder="Số điện thoại (VD: 0912345678)"
                                        type="tel"
                                        value={form.data.phone}
                                        onChange={(event) =>
                                            updateField(
                                                "phone",
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            fieldErrors.phone ||
                                                form.errors.phone,
                                        )}
                                    />
                                    {(fieldErrors.phone ||
                                        form.errors.phone) && (
                                        <p className="text-xs text-destructive">
                                            {fieldErrors.phone ||
                                                form.errors.phone}
                                        </p>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={
                                            form.processing || !isFormValid
                                        }
                                        className="min-h-11 w-full"
                                    >
                                        {form.processing ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Check className="mr-1 size-4" />
                                        )}
                                        Giữ chỗ
                                    </Button>
                                </form>
                            ) : (
                                <div className="flex min-h-32 flex-col items-center justify-center rounded-inner bg-sunk px-4 text-center">
                                    <Clock3 className="size-5 text-ink-mute" />
                                    <p className="mt-2 text-sm font-medium text-ink-soft">
                                        Chọn một giờ trống
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
