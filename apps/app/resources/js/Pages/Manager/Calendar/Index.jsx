import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatCard } from '@/Components/StatCard';
import { StatusBadge } from '@/Components/StatusBadge';
import { EmptyState } from '@/Components/EmptyState';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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
import { CalendarDays, Clock, User, Phone, Plus, ChevronLeft, ChevronRight, CircleCheck, CircleDollarSign, LayoutGrid } from 'lucide-react';

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function Index({ date, bookings, courts }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', phone: '', court_id: String(courts[0]?.id ?? ''), time: '18:00', duration: '60' });

    const changeDate = (d) => router.get('/manager/calendar', { date: d }, { preserveState: true, preserveScroll: true });

    const goToPrevDay = () => {
        const prev = new Date(date + 'T00:00:00');
        prev.setDate(prev.getDate() - 1);
        changeDate(prev.toISOString().slice(0, 10));
    };

    const goToNextDay = () => {
        const next = new Date(date + 'T00:00:00');
        next.setDate(next.getDate() + 1);
        changeDate(next.toISOString().slice(0, 10));
    };

    const goToToday = () => changeDate(new Date().toISOString().slice(0, 10));

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

    const dateObj = new Date(date + 'T00:00:00');
    const weekday = WEEKDAY_NAMES[dateObj.getDay()];
    const isToday = date === new Date().toISOString().slice(0, 10);

    // Stats
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const pendingCount = bookings.filter(b => b.status === 'pending_deposit').length;

    return (
        <ManagerLayout header={<h2 className="text-sm font-medium text-muted-foreground">Lịch đặt sân</h2>}>
            <Head title="Lịch đặt sân" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                <PageHeader
                    title="Lịch đặt sân"
                    description="Theo dõi và quản lý lịch đặt sân theo từng ngày."
                    actions={
                        <Button onClick={() => setOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Đặt hộ
                        </Button>
                    }
                />

                {/* Date navigation */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={goToPrevDay}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                    <span className="text-lg font-semibold">
                                        {dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <Badge variant={isToday ? 'default' : 'outline'}>{weekday}</Badge>
                                </div>
                                <Button variant="outline" size="icon" onClick={goToNextDay}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            {!isToday && (
                                <Button variant="outline" size="sm" onClick={goToToday}>
                                    Hôm nay
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Tổng đặt" value={bookings.length} icon={CalendarDays} accent="primary" />
                    <StatCard label="Đã xác nhận" value={confirmedCount} icon={CircleCheck} accent="emerald" />
                    <StatCard label="Chờ cọc" value={pendingCount} icon={CircleDollarSign} accent="amber" />
                    <StatCard label="Sân hoạt động" value={courts.length} icon={LayoutGrid} />
                </div>

                {/* Booking list grouped by court */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Danh sách đặt sân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bookings.length === 0 ? (
                            <EmptyState
                                icon={CalendarDays}
                                title="Chưa có lịch nào hôm nay"
                                description="Chưa có ai đặt sân trong ngày này. Bạn có thể đặt hộ cho khách vãng lai."
                                action={
                                    <Button variant="outline" onClick={() => setOpen(true)}>
                                        Đặt hộ khách vãng lai
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="divide-y">
                                {bookings.map((b, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {hhmm(b.start)}–{hhmm(b.end)} · {b.court}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    {b.customer}
                                                    <span className="text-border">·</span>
                                                    <Phone className="h-3 w-3" />
                                                    {b.phone}
                                                    <span className="text-border">·</span>
                                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{b.code}</code>
                                                </div>
                                            </div>
                                        </div>
                                        <StatusBadge type="booking" value={b.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Đặt hộ khách vãng lai</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Sân</Label>
                            <Select value={form.data.court_id} onValueChange={(v) => form.setData('court_id', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {courts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="time">Giờ bắt đầu</Label>
                                <Input id="time" type="time" value={form.data.time} onChange={(e) => form.setData('time', e.target.value)} />
                            </div>
                            <div className="space-y-2">
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
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên khách</Label>
                            <Input id="name" placeholder="Nguyễn Văn A" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                            {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input id="phone" type="tel" placeholder="0901 234 567" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                            {form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}
                        </div>
                        {(form.errors.start_at || form.errors.court_id) && (
                            <p className="text-sm text-destructive">{form.errors.start_at ?? form.errors.court_id}</p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing} className="w-full sm:w-auto">
                                Xác nhận đặt
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
