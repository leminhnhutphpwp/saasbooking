import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
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
import { formatVND } from '@/lib/format';
import { RefreshCw, Plus, XCircle } from 'lucide-react';

const WEEKDAY_LABELS = {
    1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm',
    5: 'Thứ Sáu', 6: 'Thứ Bảy', 7: 'Chủ Nhật',
};

const STATUS_LABELS = {
    active: 'Đang hoạt động',
    ended: 'Đã kết thúc',
    cancelled: 'Đã hủy',
};

const STATUS_VARIANTS = {
    active: 'default',
    ended: 'secondary',
    cancelled: 'outline',
};

export default function Index({ series, customers, courts, weekdays }) {
    const [open, setOpen] = useState(false);

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

    const cancelSeries = (s) => {
        if (confirm(`Hủy đặt cố định của "${s.customer_name}"?`)) {
            router.delete(`/manager/series/${s.uuid}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <ManagerLayout>
            <Head title="Đặt cố định" />

            <PageContainer>
                <PageHeader
                    title="Đặt cố định"
                    description={`${series.length} lịch đặt cố định · Thiết lập lịch lặp hàng tuần cho khách quen`}
                    actions={
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo đặt cố định
                        </Button>
                    }
                />

                {series.length === 0 ? (
                    <EmptyState
                        icon={RefreshCw}
                        title="Chưa có lịch đặt cố định nào"
                        description="Đặt cố định giúp khách quen có slot cố định hàng tuần mà không cần đặt lại mỗi tuần."
                        example="VD: Anh Minh — Sân 1 — Thứ 2 hàng tuần — 07:00–08:00"
                        action={
                            <Button onClick={openCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Tạo đặt cố định đầu tiên
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {series.map((s) => (
                            <Card key={s.uuid} className="overflow-hidden transition-shadow hover:shadow-md">
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <RefreshCw className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{s.customer_name}</div>
                                                <div className="text-sm text-muted-foreground">{s.customer_phone}</div>
                                            </div>
                                        </div>
                                        <Badge variant={STATUS_VARIANTS[s.status]}>
                                            {STATUS_LABELS[s.status]}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Sân</p>
                                            <p className="font-medium">{s.court_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Thứ</p>
                                            <p className="font-medium">{WEEKDAY_LABELS[s.weekday]}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Giờ</p>
                                            <p className="font-mono font-medium">{s.start_local}–{s.end_local}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Giá/buổi</p>
                                            <p className="font-medium text-primary">{formatVND(s.price_per_session_snapshot)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{s.start_date} → {s.end_date}</span>
                                        <span className="font-medium text-foreground">{s.bookings_count}/{s.sessions_total} buổi</span>
                                    </div>

                                    {s.status === 'active' && (
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-muted-foreground hover:text-destructive"
                                                onClick={() => cancelSeries(s)}
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                                Hủy
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContainer>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Tạo đặt cố định</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Khách hàng</Label>
                            <Select
                                value={form.data.customer_id}
                                onValueChange={(v) => form.setData('customer_id', Number(v))}
                            >
                                <SelectTrigger>
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
                            <Label>Sân</Label>
                            <Select
                                value={form.data.court_id}
                                onValueChange={(v) => form.setData('court_id', Number(v))}
                            >
                                <SelectTrigger>
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
                            <Label>Ngày trong tuần</Label>
                            <Select
                                value={form.data.weekday}
                                onValueChange={(v) => form.setData('weekday', v)}
                            >
                                <SelectTrigger>
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
