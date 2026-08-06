import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate, formatTime, formatVND } from '@/lib/format';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Search, SlidersHorizontal, X } from 'lucide-react';

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

function DateTile({ slot }) {
    if (!slot) return <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><CalendarDays className="size-5" /></div>;

    const [day = '', month = ''] = formatDate(slot.start_at).split('/');
    return <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><span className="text-base font-extrabold leading-none">{day}</span><span className="text-[10px] font-bold uppercase">T{month}</span></div>;
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
                <PageHeader title="Đơn đặt sân" description={`${bookings?.total ?? 0} đơn trong hệ thống`} actions={<Link href={route('manager.calendar.index')}><Button className="w-full rounded-xl sm:w-auto">Đặt hộ khách <ArrowRight className="size-4" /></Button></Link>} />

                <form onSubmit={(event) => { event.preventDefault(); navigate(); }} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-lg bg-primary/10"><SlidersHorizontal className="size-4 text-primary" /></div><div><p className="text-sm font-bold text-foreground">Tìm & lọc đơn</p><p className="text-xs text-muted-foreground">Theo khách, mã đơn, thời gian hoặc trạng thái</p></div></div>{hasFilters && <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={clearFilters}><X className="size-4" />Xóa bộ lọc</Button>}</div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,0.8fr))_auto]">
                        <div className="relative md:col-span-2 xl:col-span-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã đơn, tên hoặc số điện thoại" className="h-10 rounded-xl pl-9" aria-label="Tìm đơn đặt sân" /></div>
                        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-10 rounded-xl" aria-label="Từ ngày" />
                        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-10 rounded-xl" aria-label="Đến ngày" />
                        <Select value={courtId} onValueChange={setCourtId}><SelectTrigger className="h-10 rounded-xl" aria-label="Lọc theo sân"><SelectValue placeholder="Tất cả sân" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả sân</SelectItem>{courts.map((court) => <SelectItem key={court.id} value={String(court.id)}>{court.name}</SelectItem>)}</SelectContent></Select>
                        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-10 rounded-xl" aria-label="Lọc theo trạng thái"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
                        <Button type="submit" className="h-10 rounded-xl">Lọc</Button>
                    </div>
                </form>

                {data.length === 0 ? (
                    <div className="rounded-2xl border bg-card"><EmptyState icon={CalendarDays} title="Chưa có đơn đặt sân" description={hasFilters ? 'Không có đơn nào phù hợp với bộ lọc hiện tại.' : 'Đơn từ trang đặt sân và nhân viên tạo sẽ xuất hiện tại đây.'} action={hasFilters && <Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>} /></div>
                ) : (
                    <section className="space-y-3">{data.map((booking) => {
                        const slot = firstSlot(booking);
                        return <Link key={booking.uuid} href={route('manager.bookings.show', booking.uuid)} className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                            <div className="flex min-w-0 flex-1 gap-3 sm:items-center sm:gap-4"><DateTile slot={slot} /><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><span className="min-w-0 truncate font-mono text-sm font-bold text-foreground">{booking.code}</span><StatusBadge type="booking" value={booking.status} className="shrink-0 whitespace-nowrap" /></div><p className="mt-2 truncate text-sm font-bold text-foreground">{booking.customer?.name || 'Khách chưa đặt tên'} <span className="font-normal text-muted-foreground">· {booking.customer?.phone}</span></p>{slot && <p className="mt-1 text-sm text-muted-foreground">{slot.court?.name} · {formatTime(slot.start_at)}–{formatTime(slot.end_at)} · {formatDate(slot.start_at)}</p>}</div></div>
                            <div className="flex items-center justify-between border-t border-border/70 pt-3 sm:ml-auto sm:shrink-0 sm:border-0 sm:pt-0"><div className="sm:text-right"><p className="text-sm font-extrabold text-foreground">{formatVND(booking.total_amount)}</p><p className="text-xs text-muted-foreground">Cọc {formatVND(booking.deposit_amount)}</p></div><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></div>
                        </Link>;
                    })}</section>
                )}

                {(bookings?.last_page ?? 1) > 1 && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Trang {bookings.current_page} / {bookings.last_page}</p><div className="flex gap-2"><Button className="flex-1 sm:flex-none" variant="outline" size="sm" disabled={bookings.current_page <= 1} onClick={() => navigate(bookings.current_page - 1)}><ChevronLeft className="h-4 w-4" />Trước</Button><Button className="flex-1 sm:flex-none" variant="outline" size="sm" disabled={bookings.current_page >= bookings.last_page} onClick={() => navigate(bookings.current_page + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button></div></div>}
            </PageContainer>
        </ManagerLayout>
    );
}
