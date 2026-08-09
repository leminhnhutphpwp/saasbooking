import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { StatCard } from '@/Components/StatCard';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { formatDate, formatDateTime, formatVND } from '@/lib/format';
import { CalendarDays, CircleDollarSign, Clock, Mail, MapPin, Pencil, Phone, Plus, UserRound } from 'lucide-react';

const FILTER_TABS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'upcoming', label: 'Sắp tới' },
    { key: 'completed', label: 'Hoàn tất' },
    { key: 'cancelled', label: 'Đã hủy' },
    { key: 'no_show', label: 'Bom sân' },
];

export default function Show({ customer, stats, bookings = [] }) {
    const [editing, setEditing] = useState(false);
    const [filter, setFilter] = useState('all');
    const form = useForm({ name: customer.name ?? '', phone: customer.phone ?? '', email: customer.email ?? '' });
    const update = (event) => { event.preventDefault(); form.put(route('manager.customers.update', customer.uuid), { preserveScroll: true, onSuccess: () => setEditing(false) }); };

    const filteredBookings = bookings.filter((b) => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return b.status === 'confirmed' && b.slots?.some((s) => new Date(s.start_at) > new Date());
        return b.status === filter;
    });

    const initials = (customer.name || customer.phone || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    return <ManagerLayout>
        <Head title={customer.name || customer.phone} />
        <PageContainer>
            <PageHeader backHref={route('manager.customers.index')} backLabel="Khách hàng" title={customer.name || 'Khách chưa đặt tên'} description={customer.phone} actions={<div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)} className="gap-2"><Pencil className="h-4 w-4" />Chỉnh sửa</Button><Button asChild className="gap-2"><Link href={route('manager.calendar.index')}><Plus className="h-4 w-4" />Đặt hộ</Link></Button></div>} />

            {/* Hero Section */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">{initials}</div>
                        <div className="flex-1 space-y-2">
                            <h2 className="text-2xl font-bold text-foreground">{customer.name || 'Khách chưa đặt tên'}</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-foreground"><Phone className="h-4 w-4" />{customer.phone}</a>
                                {customer.email && <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-foreground"><Mail className="h-4 w-4" />{customer.email}</a>}
                                {customer.created_at && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />Tham gia {formatDate(customer.created_at)}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Tổng lượt đặt" value={stats.total_bookings} icon={CalendarDays} />
                <StatCard label="Sắp tới" value={stats.upcoming} icon={CalendarDays} accent="primary" />
                <StatCard label="Đã hủy" value={stats.cancelled} icon={CalendarDays} accent="warning" />
                <StatCard label="Bom sân" value={stats.no_shows} icon={CalendarDays} accent="destructive" />
                <StatCard label="Tổng chi" value={formatVND(stats.total_spent)} icon={CircleDollarSign} accent="success" />
                <StatCard label="Lần gần nhất" value={stats.last_visit ? formatDate(stats.last_visit) : '—'} icon={Clock} />
            </div>

            {/* Favorite Court */}
            {stats.favorite_court && (
                <Card>
                    <CardContent className="flex items-center gap-3 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Sân yêu thích</p>
                            <p className="font-semibold text-foreground">{stats.favorite_court}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Booking History */}
            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử đặt sân</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {FILTER_TABS.map((tab) => (
                            <Button key={tab.key} variant={filter === tab.key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(tab.key)}>
                                {tab.label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                {filteredBookings.length === 0 ? (
                    <EmptyState icon={CalendarDays} title="Không có đơn đặt" description={filter === 'all' ? 'Khách chưa có lịch sử đặt sân.' : `Không có đơn ${FILTER_TABS.find((t) => t.key === filter)?.label.toLowerCase()}.`} className="min-h-[220px]" />
                ) : (
                    <CardContent className="space-y-3">
                        {filteredBookings.map((booking) => (
                            <Link key={booking.uuid} href={route('manager.bookings.show', booking.uuid)} className="block rounded-xl border p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-mono text-sm font-semibold">{booking.code}</p>
                                        {booking.slots?.map((slot, index) => (
                                            <p key={`${slot.court_name}-${index}`} className="mt-1 text-sm text-muted-foreground">
                                                {slot.court_name} · {formatDateTime(slot.start_at)} - {formatDateTime(slot.end_at).split(' · ')[0]}
                                            </p>
                                        ))}
                                    </div>
                                    <div className="text-right">
                                        <StatusBadge type="booking" value={booking.status} />
                                        <p className="mt-1 text-sm font-medium">{formatVND(booking.total_amount)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                )}
            </Card>
        </PageContainer>

        <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
                </DialogHeader>
                <form onSubmit={update} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="customer-name">Tên khách</Label>
                        <Input id="customer-name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                        {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="customer-phone">Số điện thoại</Label>
                        <Input id="customer-phone" type="tel" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} required />
                        {form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="customer-email">Email</Label>
                        <Input id="customer-email" type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />
                        {form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>Lưu thay đổi</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </ManagerLayout>;
}
