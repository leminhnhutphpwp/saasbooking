import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
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

const STATUS = {
    confirmed: { label: 'Đã xác nhận', variant: 'default' },
    pending_deposit: { label: 'Chờ cọc', variant: 'secondary' },
    cancelled: { label: 'Đã hủy', variant: 'outline' },
    expired: { label: 'Hết hạn', variant: 'outline' },
    no_show: { label: 'Bom', variant: 'destructive' },
};

export default function Index({ date, bookings, courts }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', phone: '', court_id: String(courts[0]?.id ?? ''), time: '18:00', duration: '60' });

    const changeDate = (d) => router.get('/manager/calendar', { date: d }, { preserveState: true, preserveScroll: true });
    const hhmm = (iso) => iso.slice(11, 16);

    const submit = (e) => {
        e.preventDefault();
        const [h, m] = form.data.time.split(':').map(Number);
        const endMin = h * 60 + m + Number(form.data.duration);
        const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
        form.transform((d) => ({
            name: d.name, phone: d.phone, court_id: d.court_id,
            start_at: `${date} ${d.time}:00`, end_at: `${date} ${end}:00`,
        })).post('/manager/calendar/walk-in', { onSuccess: () => { setOpen(false); form.reset(); } });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Lịch đặt sân</h2>}>
            <Head title="Lịch đặt sân" />

            <div className="mx-auto max-w-3xl p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} className="rounded-lg border p-2" />
                    <Button onClick={() => setOpen(true)}>+ Đặt hộ (tiền mặt)</Button>
                </div>

                <div className="divide-y rounded-lg border bg-card">
                    {bookings.length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">Chưa có lịch nào hôm nay.</p>
                    )}
                    {bookings.map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-medium">{hhmm(b.start)}–{hhmm(b.end)} · {b.court}</div>
                                <div className="text-sm text-muted-foreground">
                                    {b.customer} · {b.phone} · <span className="font-mono">{b.code}</span>
                                </div>
                            </div>
                            <Badge variant={STATUS[b.status]?.variant ?? 'outline'}>
                                {STATUS[b.status]?.label ?? b.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Đặt hộ khách vãng lai (tiền mặt)</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>Sân</Label>
                            <Select value={form.data.court_id} onValueChange={(v) => form.setData('court_id', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {courts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="time">Giờ bắt đầu</Label>
                                <Input id="time" type="time" value={form.data.time} onChange={(e) => form.setData('time', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Thời lượng</Label>
                                <Select value={form.data.duration} onValueChange={(v) => form.setData('duration', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="60">60 phút</SelectItem>
                                        <SelectItem value="90">90 phút</SelectItem>
                                        <SelectItem value="120">120 phút</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Tên khách</Label>
                            <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input id="phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                            {form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}
                        </div>
                        {(form.errors.start_at || form.errors.court_id) && (
                            <p className="text-sm text-destructive">{form.errors.start_at ?? form.errors.court_id}</p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>Xác nhận đặt</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
