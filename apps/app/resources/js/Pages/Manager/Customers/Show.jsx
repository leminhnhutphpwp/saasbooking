import { Head, Link, router, useForm } from '@inertiajs/react';
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
import { formatDate, formatTime, formatVND } from '@/lib/format';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Phone, UserRound } from 'lucide-react';

const SHORT_WEEKDAYS = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };

function slotSummary(slots) {
    if (!slots?.length) return '';
    const s = slots[0];
    const d = new Date(s.start_at);
    const wd = SHORT_WEEKDAYS[d.getDay()] ?? '';
    return `${wd} ${formatDate(s.start_at)} · ${formatTime(s.start_at)}-${formatTime(s.end_at)}`;
}

export default function Show({ customer, stats, bookings = [], pagination }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({ name: customer.name ?? '', phone: customer.phone ?? '', email: customer.email ?? '' });
    const update = (event) => { event.preventDefault(); form.put(route('manager.customers.update', customer.uuid), { preserveScroll: true, onSuccess: () => setEditing(false) }); };
    const goPage = (page) => router.get(route('manager.customers.show', customer.uuid), { page }, { preserveScroll: true, preserveState: true });

    return <ManagerLayout><Head title={customer.name || customer.phone} /><PageContainer>
        <PageHeader backHref={route('manager.customers.index')} backLabel="Khách hàng" title={customer.name || 'Khách chưa đặt tên'} description={customer.phone} actions={<Button variant="outline" onClick={() => setEditing(true)}><Pencil />Chỉnh sửa</Button>} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Tổng lượt đặt" value={stats.total_bookings} icon={CalendarDays} /><StatCard label="Sắp tới" value={stats.upcoming} icon={CalendarDays} /><StatCard label="Đã hủy" value={stats.cancelled} icon={CalendarDays} /><StatCard label="Bom sân" value={stats.no_shows} icon={CalendarDays} /></div>
        <div className="grid gap-6 lg:grid-cols-3"><Card className="h-fit lg:col-span-1"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-muted-foreground" />Thông tin liên hệ</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="break-all">{customer.phone}</span></div>{customer.email && <p className="break-all text-sm text-muted-foreground">{customer.email}</p>}</CardContent></Card>
            <Card className="lg:col-span-2"><CardHeader><CardTitle>Lịch sử đặt sân</CardTitle></CardHeader>{bookings.length === 0 ? <EmptyState icon={CalendarDays} title="Chưa có lịch sử đặt sân" description="Các đơn đặt của khách sẽ xuất hiện tại đây." /> : <><CardContent className="pt-0"><table className="w-full text-sm" aria-label="Lịch sử đặt sân"><thead className="hidden sm:table-header-group"><tr><th scope="col" className="text-left">Đơn đặt</th><th scope="col" className="text-left">Sân và giờ chơi</th><th scope="col" className="text-left">Trạng thái</th><th scope="col" className="text-right">Tổng tiền</th></tr></thead><tbody className="block sm:table-row-group">{bookings.map((booking) => <tr key={booking.uuid} className="mb-3 block rounded-inner bg-sunk p-4 last:mb-0 sm:mb-0 sm:table-row sm:rounded-none sm:bg-transparent sm:p-0"><td className="block px-0 py-0 sm:table-cell sm:px-3 sm:py-4"><Link href={route('manager.bookings.show', booking.uuid)} className="font-semibold text-foreground hover:text-primary">{booking.code}</Link></td><td className="mt-2 block px-0 py-0 text-muted-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4">{booking.slots?.map((slot, index) => <p key={`${slot.court_name}-${index}`} className={index ? 'mt-1' : ''}>{slot.court_name} · {formatDate(slot.start_at)} {formatTime(slot.start_at)}-{formatTime(slot.end_at)}</p>)}</td><td className="mt-3 block px-0 py-0 sm:mt-0 sm:table-cell sm:px-3 sm:py-4"><StatusBadge type="booking" value={booking.status} /></td><td className="num mt-3 flex items-center justify-between px-0 py-0 font-semibold text-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4 sm:text-right"><span className="manager-label text-muted-foreground sm:hidden">Tổng tiền</span>{formatVND(booking.total_amount)}</td></tr>)}</tbody></table></CardContent>{pagination && pagination.last_page > 1 && <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} đơn</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => goPage(pagination.current_page - 1)}><ChevronLeft />Trước</Button><Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => goPage(pagination.current_page + 1)}>Sau<ChevronRight /></Button></div></div>}</>}</Card></div>
    </PageContainer><Dialog open={editing} onOpenChange={setEditing}><DialogContent><DialogHeader><DialogTitle>Chỉnh sửa khách hàng</DialogTitle></DialogHeader><form onSubmit={update} className="space-y-4"><div className="space-y-2"><Label htmlFor="customer-name">Tên khách</Label><Input id="customer-name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />{form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}</div><div className="space-y-2"><Label htmlFor="customer-phone">Số điện thoại</Label><Input id="customer-phone" type="tel" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} required />{form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}</div><div className="space-y-2"><Label htmlFor="customer-email">Email</Label><Input id="customer-email" type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />{form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}</div><DialogFooter><Button type="submit" disabled={form.processing}>Lưu thay đổi</Button></DialogFooter></form></DialogContent></Dialog></ManagerLayout>;
}
