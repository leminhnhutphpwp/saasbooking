import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDateTime, formatVND } from '@/lib/format';
import { CalendarDays, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

const statuses = [
    ['pending_deposit', 'Chờ cọc'],
    ['confirmed', 'Đã xác nhận'],
    ['completed', 'Đã hoàn tất'],
    ['no_show', 'Bom sân'],
    ['cancelled', 'Đã hủy'],
    ['expired', 'Hết hạn'],
];

function firstSlot(booking) {
    return booking.slots?.[0];
}

export default function Index({ bookings, courts, filters = {} }) {
    const data = bookings?.data ?? [];
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [courtId, setCourtId] = useState(filters.court_id ? String(filters.court_id) : 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const navigate = (page = 1, overrides = {}) => {
        const params = {
            search: overrides.search ?? search,
            date_from: overrides.dateFrom ?? dateFrom,
            date_to: overrides.dateTo ?? dateTo,
            court_id: overrides.courtId ?? courtId,
            status: overrides.status ?? status,
            page,
        };
        Object.keys(params).forEach((key) => {
            if (!params[key] || params[key] === 'all' || (key === 'page' && params[key] === 1)) delete params[key];
        });
        router.get(route('manager.bookings.index'), params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setSearch(''); setDateFrom(''); setDateTo(''); setCourtId('all'); setStatus('all');
        navigate(1, { search: '', dateFrom: '', dateTo: '', courtId: 'all', status: 'all' });
    };
    const hasFilters = search || dateFrom || dateTo || courtId !== 'all' || status !== 'all';

    return (
        <ManagerLayout>
            <Head title="Đơn đặt sân" />
            <PageContainer>
                <PageHeader title="Đơn đặt sân" description={`${bookings?.total ?? 0} đơn trong hệ thống`} />

                <form onSubmit={(event) => { event.preventDefault(); navigate(); }} className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã đơn, tên hoặc số điện thoại" className="pl-9" aria-label="Tìm đơn đặt sân" />
                    </div>
                    <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Từ ngày" />
                    <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Đến ngày" />
                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Lọc</Button>
                        {hasFilters && <Button type="button" variant="outline" size="icon" onClick={clearFilters} aria-label="Xóa bộ lọc"><X className="h-4 w-4" /></Button>}
                    </div>
                    <Select value={courtId} onValueChange={setCourtId}>
                        <SelectTrigger aria-label="Lọc theo sân"><SelectValue placeholder="Tất cả sân" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Tất cả sân</SelectItem>{courts.map((court) => <SelectItem key={court.id} value={String(court.id)}>{court.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger aria-label="Lọc theo trạng thái"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                </form>

                {data.length === 0 ? (
                    <Card><EmptyState icon={CalendarDays} title="Chưa có đơn đặt sân" description={hasFilters ? 'Không có đơn nào phù hợp với bộ lọc hiện tại.' : 'Đơn từ trang đặt sân và nhân viên tạo sẽ xuất hiện tại đây.'} action={hasFilters && <Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>} /></Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="divide-y">
                            {data.map((booking) => {
                                const slot = firstSlot(booking);
                                return <Link key={booking.uuid} href={route('manager.bookings.show', booking.uuid)} className="block p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold">{booking.code}</span><StatusBadge type="booking" value={booking.status} /></div>
                                            <p className="font-medium">{booking.customer?.name || 'Khách chưa đặt tên'} <span className="font-normal text-muted-foreground">· {booking.customer?.phone}</span></p>
                                            {slot && <p className="text-sm text-muted-foreground">{slot.court?.name} · {formatDateTime(slot.start_at)}-{formatDateTime(slot.end_at).split(' · ')[0]}</p>}
                                        </div>
                                        <div className="text-left sm:text-right"><p className="font-semibold">{formatVND(booking.total_amount)}</p><p className="text-sm text-muted-foreground">Cọc {formatVND(booking.deposit_amount)}</p></div>
                                    </div>
                                </Link>;
                            })}
                        </div>
                    </Card>
                )}

                {(bookings?.last_page ?? 1) > 1 && <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Trang {bookings.current_page} / {bookings.last_page}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={bookings.current_page <= 1} onClick={() => navigate(bookings.current_page - 1)}><ChevronLeft className="h-4 w-4" />Trước</Button><Button variant="outline" size="sm" disabled={bookings.current_page >= bookings.last_page} onClick={() => navigate(bookings.current_page + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button></div></div>}
            </PageContainer>
        </ManagerLayout>
    );
}
