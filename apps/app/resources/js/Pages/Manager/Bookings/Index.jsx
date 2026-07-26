import { Head, router } from '@inertiajs/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/Components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/Components/ui/table';
import { Search, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { formatVND, formatDate, formatTime } from '@/lib/format';

const STATUS_MAP = {
    confirmed: { label: 'Đã xác nhận', variant: 'default' },
    pending_deposit: { label: 'Chờ cọc', variant: 'secondary' },
    cancelled: { label: 'Đã hủy', variant: 'outline' },
    expired: { label: 'Hết hạn', variant: 'outline' },
    completed: { label: 'Hoàn thành', variant: 'default' },
    no_show: { label: 'Bom sân', variant: 'destructive' },
};

function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function Index({ bookings, courts, filters }) {
    const data = bookings.data ?? [];
    const pagination = {
        current_page: bookings.current_page ?? 1,
        last_page: bookings.last_page ?? 1,
        total: bookings.total ?? 0,
    };

    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters?.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters?.date_to ?? '');
    const debouncedSearch = useDebounce(search, 300);
    const isInitial = useRef(true);

    const navigate = useCallback((overrides = {}) => {
        const params = {};
        const s = overrides.search !== undefined ? overrides.search : search;
        const st = overrides.status !== undefined ? overrides.status : status;
        const df = overrides.date_from !== undefined ? overrides.date_from : dateFrom;
        const dt = overrides.date_to !== undefined ? overrides.date_to : dateTo;
        if (s) params.search = s;
        if (st && st !== 'all') params.status = st;
        if (df) params.date_from = df;
        if (dt) params.date_to = dt;
        router.get(route('manager.bookings.index'), params, { preserveState: true, preserveScroll: true });
    }, [search, status, dateFrom, dateTo]);

    useEffect(() => {
        if (isInitial.current) { isInitial.current = false; return; }
        navigate({ search: debouncedSearch });
    }, [debouncedSearch]);

    return (
        <ManagerLayout>
            <Head title="Đặt sân" />
            <PageContainer>
                <PageHeader title="Đặt sân" description="Quản lý tất cả đặt sân" />

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm mã đặt, tên, SĐT..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Select value={status} onValueChange={(v) => { setStatus(v); navigate({ status: v }); }}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
                    <span className="text-muted-foreground">→</span>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
                    <Button size="sm" onClick={() => navigate()}>Lọc</Button>
                </div>

                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">Không có đặt sân nào.</p>
                ) : (
                    <>
                        <div className="rounded-lg border border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã</TableHead>
                                        <TableHead>Khách hàng</TableHead>
                                        <TableHead>Sân</TableHead>
                                        <TableHead>Thời gian</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Tổng tiền</TableHead>
                                        <TableHead className="w-[50px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((b) => {
                                        const status = STATUS_MAP[b.status] ?? { label: b.status, variant: 'secondary' };
                                        const slot = b.slots?.[0];
                                        return (
                                            <TableRow key={b.id}>
                                                <TableCell className="font-mono text-sm font-semibold">{b.code}</TableCell>
                                                <TableCell>{b.customer?.name || b.customer?.phone || '—'}</TableCell>
                                                <TableCell>{slot?.court?.name || '—'}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {slot ? `${formatDate(slot.start_at)} ${formatTime(slot.start_at)}–${formatTime(slot.end_at)}` : '—'}
                                                </TableCell>
                                                <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                                                <TableCell className="text-right font-medium">{formatVND(b.total_amount)}</TableCell>
                                                <TableCell>
                                                    <a href={route('manager.bookings.show', b.uuid)} className="text-muted-foreground hover:text-foreground">
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {pagination.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <span>Trang {pagination.current_page}/{pagination.last_page} · {pagination.total} đặt sân</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={pagination.current_page <= 1}
                                        onClick={() => router.get(route('manager.bookings.index'), { ...filters, page: pagination.current_page - 1 }, { preserveState: true, preserveScroll: true })}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page}
                                        onClick={() => router.get(route('manager.bookings.index'), { ...filters, page: pagination.current_page + 1 }, { preserveState: true, preserveScroll: true })}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </PageContainer>
        </ManagerLayout>
    );
}
