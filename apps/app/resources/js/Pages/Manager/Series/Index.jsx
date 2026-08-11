import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card } from '@/Components/ui/card';
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
import { formatVND, formatDate, formatTime } from '@/lib/format';
import { RefreshCw, Plus, XCircle, StopCircle } from 'lucide-react';

const WEEKDAY_LABELS = {
    1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm',
    5: 'Thứ Sáu', 6: 'Thứ Bảy', 7: 'Chủ Nhật',
};

const WEEKDAY_SHORT = {
    1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5',
    5: 'T6', 6: 'T7', 7: 'CN',
};

export default function Index({ series, customers, courts, weekdays }) {
    const [open, setOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [endTarget, setEndTarget] = useState(null);
    const [occurrenceTarget, setOccurrenceTarget] = useState(null);
    const [cancelProcessing, setCancelProcessing] = useState(false);
    const [endProcessing, setEndProcessing] = useState(false);
    const [occurrenceProcessing, setOccurrenceProcessing] = useState(false);

    const form = useForm({
        customer_id: '',
        court_id: '',
        weekday: '1',
        start_local: '07:00',
        end_local: '08:00',
        start_date: '',
        end_date: '',
        deposit_per_session: '',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        form.post('/manager/series', {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    const cancelSeries = () => {
        if (!cancelTarget) return;

        setCancelProcessing(true);
        router.delete(`/manager/series/${cancelTarget.uuid}`, {
            preserveScroll: true,
            onSuccess: () => setCancelTarget(null),
            onFinish: () => setCancelProcessing(false),
        });
    };

    const endSeries = () => {
        if (!endTarget) return;

        setEndProcessing(true);
        router.post(`/manager/series/${endTarget.uuid}/end`, {}, {
            preserveScroll: true,
            onSuccess: () => setEndTarget(null),
            onFinish: () => setEndProcessing(false),
        });
    };

    const cancelOccurrence = () => {
        if (!occurrenceTarget) return;

        setOccurrenceProcessing(true);
        router.post(
            `/manager/series/${occurrenceTarget.series.uuid}/cancel-occurrence/${occurrenceTarget.booking.uuid}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setOccurrenceTarget(null),
                onFinish: () => setOccurrenceProcessing(false),
            }
        );
    };

    const formatOccurrenceDate = (iso) => {
        const d = new Date(iso);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    };

    return (
        <ManagerLayout>
            <Head title="Đặt cố định" />

            <PageContainer>
                <PageHeader
                    title="Đặt cố định"
                    description={`${series.length} lịch đặt cố định · Thiết lập lịch lặp hàng tuần cho khách quen`}
                    actions={series.length > 0 && (
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo đặt cố định
                        </Button>
                    )}
                />

                {series.length === 0 ? (
                    <Card className="overflow-hidden">
                        <div className="grid lg:grid-cols-3">
                            <div className="flex min-h-56 flex-col items-start justify-center px-6 py-10 text-left lg:col-span-2 lg:px-10 lg:py-12">
                                <div className="manager-icon-well mb-4">
                                    <RefreshCw className="h-5 w-5" />
                                </div>
                                <p className="manager-label text-ink-mute">Lịch hàng tuần</p>
                                <h2 className="mt-2 text-xl font-semibold text-foreground">Chưa có lịch đặt cố định nào</h2>
                                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                                    Giữ một khung giờ quen thuộc cho khách quen để họ không cần đặt lại mỗi tuần.
                                </p>
                                <Button onClick={openCreate} className="mt-6 gap-2">
                                    <Plus className="h-4 w-4" />
                                    Tạo đặt cố định đầu tiên
                                </Button>
                            </div>
                            <div className="bg-sunk p-6 lg:p-8">
                                <p className="manager-label text-ink-mute">Một lịch gồm</p>
                                <div className="mt-5 space-y-4 text-sm text-ink-soft">
                                    <div>
                                        <p className="font-semibold text-foreground">Khách và sân</p>
                                        <p className="mt-1">Gắn khách quen với sân phù hợp.</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Ngày và giờ cố định</p>
                                        <p className="mt-1">Lặp lại cùng một khung giờ mỗi tuần.</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Khoảng áp dụng</p>
                                        <p className="mt-1">Chọn ngày bắt đầu và kết thúc cho lịch.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        {series.map((s) => (
                            <Card key={s.uuid} className="flex h-full flex-col">
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="manager-icon-well shrink-0">
                                                <RefreshCw className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{s.customer_name}</div>
                                                <div className="text-sm text-muted-foreground">{s.customer_phone}</div>
                                            </div>
                                        </div>
                                        <StatusBadge type="series" value={s.status} />
                                    </div>

                                    <div className="mt-5">
                                        <p className="manager-label text-ink-mute">Lịch lặp</p>
                                        <p className="mt-1 text-lg font-semibold text-foreground">{WEEKDAY_LABELS[s.weekday]} · <span className="font-num">{s.start_local}–{s.end_local}</span></p>
                                    </div>

                                    <div className="manager-well mt-5 grid grid-cols-2 gap-3 p-4 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Sân</p>
                                            <p className="font-medium">{s.court_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Giá/buổi</p>
                                            <p className="num font-semibold text-sm">{formatVND(s.price_per_session_snapshot)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm text-muted-foreground">
                                        <span>{s.start_date} → {s.end_date}</span>
                                        <span className="font-medium text-foreground">{s.bookings_count}/{s.sessions_total} buổi</span>
                                    </div>

                                    {s.status === 'active' && s.occurrences && s.occurrences.length > 0 && (
                                        <div className="mt-4 border-t pt-4">
                                            <p className="manager-label text-ink-mute mb-3">Các buổi sắp tới</p>
                                            <div className="space-y-2">
                                                {s.occurrences.map((occ) => (
                                                    <div
                                                        key={occ.uuid}
                                                        className="flex items-center justify-between gap-2 rounded-md bg-sunk px-3 py-2 text-sm"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {WEEKDAY_SHORT[new Date(occ.start_at).getDay() === 0 ? 7 : new Date(occ.start_at).getDay()]}
                                                            </span>
                                                            <span className="font-medium">
                                                                {formatOccurrenceDate(occ.start_at)}
                                                            </span>
                                                            <span className="text-muted-foreground">·</span>
                                                            <span className="font-num text-xs">
                                                                {formatTime(occ.start_at)}–{formatTime(occ.end_at)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <StatusBadge type="booking" value={occ.status} />
                                                            {occ.can_cancel && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-auto px-2 py-1 text-xs text-destructive hover:text-destructive"
                                                                    onClick={() => setOccurrenceTarget({ series: s, booking: occ })}
                                                                >
                                                                    Hủy
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {s.status === 'active' && (
                                        <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => setEndTarget(s)}
                                            >
                                                <StopCircle className="h-3.5 w-3.5" />
                                                Kết thúc lịch
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-muted-foreground hover:text-destructive"
                                                onClick={() => setCancelTarget(s)}
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                                Hủy lịch
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContainer>

            <ConfirmActionDialog
                open={cancelTarget !== null}
                onOpenChange={(nextOpen) => !nextOpen && setCancelTarget(null)}
                onConfirm={cancelSeries}
                title="Hủy lịch đặt cố định"
                description={cancelTarget ? `Toàn bộ lịch chưa hoàn thành của ${cancelTarget.customer_name} tại ${cancelTarget.court_name} sẽ bị hủy. Hành động này không thể hoàn tác.` : ''}
                confirmLabel="Hủy lịch"
                processingLabel="Đang hủy…"
                processing={cancelProcessing}
            />

            <ConfirmActionDialog
                open={endTarget !== null}
                onOpenChange={(nextOpen) => !nextOpen && setEndTarget(null)}
                onConfirm={endSeries}
                title="Kết thúc lịch đặt cố định"
                description={endTarget ? `Lịch của ${endTarget.customer_name} tại ${endTarget.court_name} sẽ ngừng tạo mới từ ngày mai. Các lịch đã xác nhận vẫn giữ nguyên.` : ''}
                confirmLabel="Kết thúc lịch"
                processingLabel="Đang xử lý…"
                processing={endProcessing}
                variant="neutral"
            />

            <ConfirmActionDialog
                open={occurrenceTarget !== null}
                onOpenChange={(nextOpen) => !nextOpen && setOccurrenceTarget(null)}
                onConfirm={cancelOccurrence}
                title="Hủy buổi này"
                description={occurrenceTarget ? `Buổi ${formatDate(occurrenceTarget.booking.start_at)} lúc ${formatTime(occurrenceTarget.booking.start_at)} của ${occurrenceTarget.series.customer_name} sẽ bị hủy.` : ''}
                confirmLabel="Hủy buổi"
                processingLabel="Đang hủy…"
                processing={occurrenceProcessing}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Tạo đặt cố định</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="series-customer">Khách hàng</Label>
                            <Select
                                value={form.data.customer_id}
                                onValueChange={(v) => form.setData('customer_id', Number(v))}
                            >
                                <SelectTrigger id="series-customer">
                                    <SelectValue placeholder="Chọn khách hàng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name} ({c.phone})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.customer_id && (
                                <p className="text-sm text-destructive">{form.errors.customer_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="series-court">Sân</Label>
                            <Select
                                value={form.data.court_id}
                                onValueChange={(v) => form.setData('court_id', Number(v))}
                            >
                                <SelectTrigger id="series-court">
                                    <SelectValue placeholder="Chọn sân" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courts.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.court_id && (
                                <p className="text-sm text-destructive">{form.errors.court_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="series-weekday">Ngày trong tuần</Label>
                            <Select
                                value={form.data.weekday}
                                onValueChange={(v) => form.setData('weekday', v)}
                            >
                                <SelectTrigger id="series-weekday">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {weekdays.map((d) => (
                                        <SelectItem key={d.value} value={String(d.value)}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="start_local">Giờ bắt đầu</Label>
                                <Input
                                    id="start_local"
                                    type="time"
                                    value={form.data.start_local}
                                    onChange={(e) => form.setData('start_local', e.target.value)}
                                />
                                {form.errors.start_local && (
                                    <p className="text-sm text-destructive">{form.errors.start_local}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_local">Giờ kết thúc</Label>
                                <Input
                                    id="end_local"
                                    type="time"
                                    value={form.data.end_local}
                                    onChange={(e) => form.setData('end_local', e.target.value)}
                                />
                                {form.errors.end_local && (
                                    <p className="text-sm text-destructive">{form.errors.end_local}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Ngày bắt đầu</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(e) => form.setData('start_date', e.target.value)}
                                />
                                {form.errors.start_date && (
                                    <p className="text-sm text-destructive">{form.errors.start_date}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Ngày kết thúc</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={form.data.end_date}
                                    onChange={(e) => form.setData('end_date', e.target.value)}
                                />
                                {form.errors.end_date && (
                                    <p className="text-sm text-destructive">{form.errors.end_date}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deposit_per_session">
                                Tiền cọc mỗi buổi <span className="text-xs text-muted-foreground">(để trống = mặc định)</span>
                            </Label>
                            <Input
                                id="deposit_per_session"
                                type="number"
                                min="0"
                                step="1000"
                                value={form.data.deposit_per_session}
                                onChange={(e) => form.setData('deposit_per_session', e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                Tạo
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
