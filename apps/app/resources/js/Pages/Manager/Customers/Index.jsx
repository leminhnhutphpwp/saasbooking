import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, Trash2, Users, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function Index({ customers = [], pagination, query = '' }) {
    const [search, setSearch] = useState(query);
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selected, setSelected] = useState(new Set());
    const form = useForm({ name: '', phone: '', email: '' });

    const debouncedSearch = useDebounce(search, 300);

    const filteredCustomers = useMemo(() => {
        let result = [...customers];

        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(c =>
                (c.name || '').toLowerCase().includes(q) ||
                (c.phone || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q)
            );
        }

        if (filter === 'active') {
            result = result.filter(c => (c.bookings_count || 0) > 0);
        } else if (filter === 'inactive') {
            result = result.filter(c => (c.bookings_count || 0) === 0);
        }

        result.sort((a, b) => {
            let aVal = a[sortField] ?? '';
            let bVal = b[sortField] ?? '';
            if (sortField === 'bookings_count') { aVal = Number(aVal) || 0; bVal = Number(bVal) || 0; }
            if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
            if (sortOrder === 'asc') return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        });

        return result;
    }, [customers, debouncedSearch, filter, sortField, sortOrder]);

    const allVisibleSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selected.has(c.uuid));
    const someSelected = filteredCustomers.some(c => selected.has(c.uuid));

    const toggleSelectAll = () => {
        if (allVisibleSelected) setSelected(new Set());
        else setSelected(new Set(filteredCustomers.map(c => c.uuid)));
    };

    const toggleSelect = (uuid) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid); else next.add(uuid);
            return next;
        });
    };

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(route('manager.customers.index'), search ? { q: search } : {}, { preserveState: true, replace: true });
    };

    const create = (event) => {
        event.preventDefault();
        form.post(route('manager.customers.store'), {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); form.reset(); }
        });
    };

    const goPage = (page) => router.get(route('manager.customers.index'), { page }, { preserveState: true });

    const handleSort = (field) => {
        if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortOrder('asc'); }
    };

    const SortIcon = ({ field }) => (
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/40'} ${sortField === field && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
    );

    const activityBadge = (count) => {
        if (!count) return <Badge variant="outline" className="text-muted-foreground">Mới</Badge>;
        if (count >= 5) return <Badge variant="default">{count} lượt đặt</Badge>;
        return <Badge variant="secondary">{count} lượt đặt</Badge>;
    };

    const hasFilters = filter !== 'all' || debouncedSearch;

    return <ManagerLayout>
        <Head title="Khách hàng" />
        <PageContainer>
            <PageHeader
                title="Khách hàng"
                description={query ? `Kết quả cho "${query}"` : `${pagination?.total ?? customers.length} khách hàng`}
                actions={<Button onClick={() => { form.reset(); form.clearErrors(); setOpen(true); }} className="w-full gap-2 sm:w-auto"><Plus className="h-4 w-4" />Thêm khách</Button>}
            />

            {/* Search & Filter Bar */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="grid size-8 place-items-center rounded-lg bg-primary/10"><SlidersHorizontal className="size-4 text-primary" /></div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Tìm & lọc khách</p>
                            <p className="text-xs text-muted-foreground">Theo tên, SĐT hoặc trạng thái</p>
                        </div>
                    </div>
                    {hasFilters && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setFilter('all'); setSearch(''); router.get(route('manager.customers.index')); }}>
                            <X className="size-4" />Xóa bộ lọc
                        </Button>
                    )}
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <form onSubmit={submitSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, SĐT hoặc email" className="h-10 rounded-xl pl-9" aria-label="Tìm khách hàng" />
                    </form>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="h-10 min-w-[160px] rounded-xl" aria-label="Lọc theo trạng thái">
                            <SelectValue>{filter === 'all' ? 'Tất cả' : filter === 'active' ? 'Hoạt động' : 'Không hoạt động'}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="active">Hoạt động</SelectItem>
                            <SelectItem value="inactive">Không hoạt động</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selected.size > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <span className="text-sm font-medium text-primary">Đã chọn {selected.size} khách</span>
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setSelected(new Set())}>Bỏ chọn</Button>
                    <div className="ml-auto">
                        <Button variant="destructive" size="sm" className="gap-2" onClick={() => { if (confirm(`Xóa ${selected.size} khách hàng đã chọn?`)) router.post(route('manager.customers.bulk-delete'), { ids: Array.from(selected) }); }}>
                            <Trash2 className="h-3.5 w-3.5" />Xóa
                        </Button>
                    </div>
                </div>
            )}

            {/* Content */}
            {filteredCustomers.length === 0 ? (
                <Card>
                    <EmptyState icon={Users} title={query || debouncedSearch ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'} description={query || debouncedSearch ? 'Thử lại với tên hoặc số điện thoại khác.' : 'Khách đặt sân sẽ xuất hiện tại đây.'} action={(query || debouncedSearch) && <Button variant="outline" onClick={() => { setSearch(''); router.get(route('manager.customers.index')); }}>Xóa tìm kiếm</Button>} />
                </Card>
            ) : (
                <>
                    {/* Desktop Table */}
                    <Card className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-10">
                                        <button onClick={toggleSelectAll} className="flex size-4 items-center justify-center rounded border transition-colors hover:border-primary/60" aria-label="Chọn tất cả">
                                            {allVisibleSelected && <div className="size-2.5 rounded-sm bg-primary" />}
                                            {!allVisibleSelected && someSelected && <div className="size-2.5 rounded-sm bg-primary/50" />}
                                        </button>
                                    </TableHead>
                                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1.5">Tên khách <SortIcon field="name" /></div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('phone')}>
                                        <div className="flex items-center gap-1.5">Số điện thoại <SortIcon field="phone" /></div>
                                    </TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('bookings_count')}>
                                        <div className="flex items-center justify-end gap-1.5">Lượt đặt <SortIcon field="bookings_count" /></div>
                                    </TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.map((customer) => (
                                    <TableRow key={customer.uuid} data-state={selected.has(customer.uuid) ? 'selected' : undefined}>
                                        <TableCell>
                                            <button onClick={() => toggleSelect(customer.uuid)} className="flex size-4 items-center justify-center rounded border transition-colors hover:border-primary/60" aria-label={`Chọn ${customer.name}`}>
                                                {selected.has(customer.uuid) && <div className="size-2.5 rounded-sm bg-primary" />}
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={route('manager.customers.show', customer.uuid)} className="font-medium text-foreground hover:text-primary transition-colors">
                                                {customer.name || 'Khách chưa đặt tên'}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-muted-foreground">{customer.phone}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{customer.email || '—'}</TableCell>
                                        <TableCell className="text-right">{activityBadge(customer.bookings_count)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                <Link href={route('manager.customers.show', customer.uuid)}><Eye className="h-4 w-4" /></Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Xem chi tiết</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild><Link href={route('manager.customers.show', customer.uuid)}><Eye className="mr-2 h-4 w-4" />Xem</Link></DropdownMenuItem>
                                                        <DropdownMenuItem asChild><Link href={route('manager.customers.show', customer.uuid)}><Pencil className="mr-2 h-4 w-4" />Chỉnh sửa</Link></DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm('Xóa khách hàng này?')) router.delete(route('manager.customers.destroy', customer.uuid)); }}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredCustomers.map((customer) => (
                            <Card key={customer.uuid} className="p-4 transition-shadow hover:shadow-md">
                                <div className="flex items-start gap-3">
                                    <button onClick={() => toggleSelect(customer.uuid)} className="mt-1 flex size-4 shrink-0 items-center justify-center rounded border transition-colors hover:border-primary/60">
                                        {selected.has(customer.uuid) && <div className="size-2.5 rounded-sm bg-primary" />}
                                    </button>
                                    <Link href={route('manager.customers.show', customer.uuid)} className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{customer.name || 'Khách chưa đặt tên'}</p>
                                                <p className="mt-0.5 font-mono text-sm text-muted-foreground">{customer.phone}</p>
                                                {customer.email && <p className="text-sm text-muted-foreground truncate">{customer.email}</p>}
                                            </div>
                                            {activityBadge(customer.bookings_count)}
                                        </div>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Trang {pagination.current_page} / {pagination.last_page}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => goPage(pagination.current_page - 1)} className="gap-1"><ChevronLeft className="h-4 w-4" />Trước</Button>
                        <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => goPage(pagination.current_page + 1)} className="gap-1">Sau<ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}
        </PageContainer>

        {/* Create Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Thêm khách hàng</DialogTitle></DialogHeader>
                <form onSubmit={create} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên khách</Label>
                        <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Nguyễn Văn A" />
                        {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input id="phone" type="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} placeholder="0901 234 567" required />
                        {form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (không bắt buộc)</Label>
                        <Input id="email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} placeholder="khach@example.com" />
                        {form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>Lưu khách hàng</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </ManagerLayout>;
}
