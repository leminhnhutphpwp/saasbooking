import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
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

const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

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
        if (confirm(`Hủy đặt cố định của “${s.customer_name}”?`)) {
            router.delete(`/manager/series/${s.uuid}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Đặt cố định</h2>}
        >
            <Head title="Đặt cố định" />

            <div className="mx-auto max-w-6xl p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {series.length} lịch đặt cố định
                    </p>
                    <Button onClick={openCreate}>+ Tạo đặt cố định</Button>
                </div>

                <div className="divide-y rounded-lg border bg-card">
                    {series.length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            Chưa có lịch đặt cố định nào.
                        </p>
                    )}
                    {series.map((s) => (
                        <div key={s.uuid} className="flex items-center justify-between p-4">
                            <div className="space-y-1">
                                <div className="font-medium">
                                    {s.customer_name}
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        {s.customer_phone}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {s.court_name} &middot; {WEEKDAY_LABELS[s.weekday]}{' '}
                                    {s.start_local}&ndash;{s.end_local}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {s.start_date} → {s.end_date}
                                    <span className="ml-2">
                                        ({s.bookings_count}/{s.sessions_total} buổi)
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {vnd(s.price_per_session_snapshot)} / buổi
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={STATUS_VARIANTS[s.status]}>
                                    {STATUS_LABELS[s.status]}
                                </Badge>
                                {s.status === 'active' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => cancelSeries(s)}
                                    >
                                        Hủy
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Tạo đặt cố định</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
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
                            <div className="space-y-1.5">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
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
                            <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
                            <Label htmlFor="deposit_per_session">
                                Tiền cọc mỗi buổi <span className="text-muted-foreground">(để trống = mặc định)</span>
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
