import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { StatusBadge } from '@/Components/StatusBadge';
import { EmptyState } from '@/Components/EmptyState';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatVND, formatDate } from '@/lib/format';
import { Banknote, Eye, MoreHorizontal, PartyPopper, Search, SlidersHorizontal, X } from 'lucide-react';

const REASON = {
    customer_cancel: 'Khách hủy',
    race_lost: 'Mất slot (đã trả tiền)',
    owner_cancel: 'Chủ sân hủy',
    no_show_policy: 'Bom sân',
};

const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'done', label: 'Đã xử lý' },
];

export default function Index({ refunds }) {
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(new Set());

    const filtered = refunds.filter((r) => {
        const q = search.toLowerCase();
        const matchSearch = !q || r.code?.toLowerCase().includes(q) || r.phone?.toLowerCase().includes(q);
        return matchSearch;
    });

    const hasFilters = search || statusFilter !== 'all';

    const markDone = () => {
        if (!confirmTarget) return;

        setProcessing(true);
        router.post(`/manager/refunds/${confirmTarget.uuid}/done`, {}, {
            preserveScroll: true,
            onSuccess: () => setConfirmTarget(null),
            onFinish: () => setProcessing(false),
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map((r) => r.uuid)));
    };

    const toggleSelect = (uuid) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    };

    const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.uuid));
    const someSelected = filtered.some((r) => selected.has(r.uuid)) && !allVisibleSelected;

    return (
        <ManagerLayout>
            <Head title="Hoàn cọc" />

            <PageContainer>
                <PageHeader
                    title="Hoàn cọc chờ xử lý"
                    description={`${refunds.length} khoản chờ chuyển khoản trả khách.`}
                />

                {/* ── Filter Bar ────────────────────────────────────────── */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="grid size-8 place-items-center rounded-lg bg-primary/10"><SlidersHorizontal className="size-4 text-primary" /></div>
                            <div>
                                <p className="text-sm font-bold text-foreground">Tìm & lọc hoàn cọc</p>
                                <p className="text-xs text-muted-foreground">Theo mã đơn hoặc SĐT khách</p>
                            </div>
                        </div>
                        {hasFilters && (
                            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                                <X className="size-4" />Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm mã đơn hoặc SĐT"
                                className="h-10 rounded-xl pl-9"
                                aria-label="Tìm khoản hoàn cọc"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-10 min-w-[160px] rounded-xl" aria-label="Lọc theo trạng thái">
                                <SelectValue>{STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {refunds.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={PartyPopper}
                            title="Không có hoàn cọc nào chờ xử lý"
                            description="Tất cả các khoản hoàn cọc đã được xử lý xong."
                        />
                    </Card>
                ) : filtered.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={Search}
                            title="Không tìm thấy khoản hoàn cọc"
                            description="Thử lại với mã đơn hoặc SĐT khác."
                            action={
                                <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                                    Xóa bộ lọc
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <button onClick={toggleSelectAll} className="flex size-4 items-center justify-center rounded border transition-colors hover:border-primary/60" aria-label="Chọn tất cả">
                                            {allVisibleSelected && <div className="size-2.5 rounded-sm bg-primary" />}
                                            {!allVisibleSelected && someSelected && <div className="size-2.5 rounded-sm bg-primary/50" />}
                                        </button>
                                    </TableHead>
                                    <TableHead>Mã đơn</TableHead>
                                    <TableHead>Số tiền</TableHead>
                                    <TableHead>Khách</TableHead>
                                    <TableHead>Lý do</TableHead>
                                    <TableHead>Ngày yêu cầu</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((r) => (
                                    <TableRow key={r.uuid} data-state={selected.has(r.uuid) ? 'selected' : undefined}>
                                        <TableCell>
                                            <button onClick={() => toggleSelect(r.uuid)} className="flex size-4 items-center justify-center rounded border transition-colors hover:border-primary/60" aria-label={`Chọn ${r.code}`}>
                                                {selected.has(r.uuid) && <div className="size-2.5 rounded-sm bg-primary" />}
                                            </button>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{r.code}</TableCell>
                                        <TableCell className="font-semibold">{formatVND(r.amount)}</TableCell>
                                        <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                                        <TableCell className="text-muted-foreground">{REASON[r.reason] ?? r.reason}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(r.requested_at)}</TableCell>
                                        <TableCell><StatusBadge type="refund" value="requested" /></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmTarget(r)}>
                                                                <Banknote className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Đã chuyển khoản</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setConfirmTarget(r)}>
                                                            <Banknote className="mr-2 h-4 w-4" />Đã chuyển khoản
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </PageContainer>

            <ConfirmActionDialog
                open={confirmTarget !== null}
                onOpenChange={(nextOpen) => !nextOpen && setConfirmTarget(null)}
                onConfirm={markDone}
                title="Xác nhận đã hoàn cọc"
                description={confirmTarget ? `Xác nhận bạn đã chuyển ${formatVND(confirmTarget.amount)} hoàn cọc cho đơn ${confirmTarget.code}. Hệ thống sẽ đánh dấu khoản này là đã xử lý.` : ''}
                confirmLabel="Đã chuyển khoản"
                processingLabel="Đang xác nhận…"
                processing={processing}
                variant="default"
            />
        </ManagerLayout>
    );
}
