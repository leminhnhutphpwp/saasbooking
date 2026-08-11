import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
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

function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getToday() { return toISODate(new Date()); }

function getTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISODate(d);
}

function formatShortDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const wd = weekdays[d.getDay()];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${wd} ${day}/${month}`;
}

export default function Index({ bookings, courts, filters = {} }) {
    const data = bookings?.data ?? [];
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [courtId, setCourtId] = useState(filters.court_id ? String(filters.court_id) : 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const today = getToday();
    const tomorrow = getTomorrow();

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
    const isToday = dateFrom === today && dateTo === today;
    const isTomorrow = dateFrom === tomorrow && dateTo === tomorrow;

    const setQuickDate = (iso) => {
        setDateFrom(iso);
        setDateTo(iso);
        navigate(1, { dateFrom: iso, dateTo: iso });
    };

    const filterSummary = useMemo(() => {
        if (!hasFilters) return null;
        const parts = [];
        if (courtId !== 'all') {
            const court = courts.find((c) => String(c.id) === courtId);
            if (court) parts.push(court.name);
        }
        if (status !== 'all') {
            const found = statuses.find(([v]) => v === status);
            if (found) parts.push(found[1]);
        }
        if (dateFrom || dateTo) {
            if (dateFrom === dateTo) {
                if (dateFrom === today) parts.push('Hôm nay');
                else if (dateFrom === tomorrow) parts.push('Ngày mai');
                else parts.push(formatShortDate(dateFrom));
            } else {
                parts.push(`${formatShortDate(dateFrom)} – ${formatShortDate(dateTo)}`);
            }
        }
        if (search) parts.push(`"${search}"`);
        return parts.length ? `Đang lọc: ${parts.join(' · ')}` : null;
    }, [hasFilters, courtId, status, dateFrom, dateTo, search, courts, today, tomorrow]);

    return (
        <ManagerLayout>
            <Head title="Đơn đặt sân" />
            <PageContainer>
                <PageHeader title="Đơn đặt sân" description={`${bookings?.total ?? 0} đơn trong hệ thống`} />

                <div className="flex flex-wrap gap-2 px-6 pt-4">
                    <button type="button" onClick={() => setQuickDate(today)} className={`rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${isToday ? 'bg-turf-600 text-white' : 'bg-sunk text-ink hover:bg-turf-100'}`}>Hôm nay</button>
                    <button type="button" onClick={() => setQuickDate(tomorrow)} className={`rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${isTomorrow ? 'bg-turf-600 text-white' : 'bg-sunk text-ink hover:bg-turf-100'}`}>Ngày mai</button>
                    {hasFilters && <button type="button" onClick={clearFilters} className="rounded-full bg-sunk px-4 py-2 text-sm text-ink transition-colors hover:bg-turf-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Xóa bộ lọc</button>}
                </div>

                <form onSubmit={(event) => { event.preventDefault(); navigate(); }} className="manager-panel grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-5">
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

                {filterSummary && <p className="px-6 pb-2 text-sm text-ink-soft">{filterSummary}</p>}

                {data.length === 0 ? (
                    <Card><EmptyState icon={CalendarDays} title="Chưa có đơn đặt sân" description={hasFilters ? 'Không có đơn nào phù hợp với bộ lọc hiện tại.' : 'Đơn từ trang đặt sân và nhân viên tạo sẽ xuất hiện tại đây.'} action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button> : <Button asChild><Link href={route('manager.calendar.index')}>Mở lịch đặt</Link></Button>} /></Card>
                ) : (
                    <Card>
                        <div className="hidden overflow-x-auto p-3 md:block">
                            <Table aria-label="Danh sách đơn đặt sân">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Đơn đặt sân</TableHead>
                                        <TableHead>Khách hàng</TableHead>
                                        <TableHead>Lịch đặt</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Tổng tiền</TableHead>
                                        <TableHead className="text-right">Tiền cọc</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((booking) => {
                                        const slot = firstSlot(booking);
                                        return <TableRow key={booking.uuid}>
                                            <TableCell><Link href={route('manager.bookings.show', booking.uuid)} className="font-mono font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{booking.code}</Link></TableCell>
                                            <TableCell><p className="font-semibold text-foreground">{booking.customer?.name || 'Khách chưa đặt tên'}</p><p className="text-xs text-muted-foreground">{booking.customer?.phone}</p></TableCell>
                                            <TableCell>{slot ? <><p className="font-medium text-foreground">{slot.court?.name}</p><p className="text-xs text-muted-foreground">{formatDateTime(slot.start_at)}-{formatDateTime(slot.end_at).split(' · ')[0]}</p></> : 'Chưa có lịch'}</TableCell>
                                            <TableCell><StatusBadge type="booking" value={booking.status} /></TableCell>
                                            <TableCell className="num text-right font-semibold text-foreground">{formatVND(booking.total_amount)}</TableCell>
                                            <TableCell className="num text-right font-semibold text-foreground">{formatVND(booking.deposit_amount)}</TableCell>
                                        </TableRow>;
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="divide-y md:hidden">
                            {data.map((booking) => {
                                const slot = firstSlot(booking);
                                return <Link key={booking.uuid} href={route('manager.bookings.show', booking.uuid)} className="block p-5 transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold">{booking.code}</span><StatusBadge type="booking" value={booking.status} /></div>
                                            <p className="font-medium">{booking.customer?.name || 'Khách chưa đặt tên'} <span className="font-normal text-muted-foreground">· {booking.customer?.phone}</span></p>
                                            {slot && <p className="text-sm text-muted-foreground">{slot.court?.name} · {formatDateTime(slot.start_at)}-{formatDateTime(slot.end_at).split(' · ')[0]}</p>}
                                        </div>
                                        <div className="text-left sm:text-right"><p className="num font-semibold">{formatVND(booking.total_amount)}</p><p className="num text-sm text-muted-foreground">Cọc {formatVND(booking.deposit_amount)}</p></div>
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
