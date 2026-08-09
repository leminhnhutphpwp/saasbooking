import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/Components/ui/tooltip';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
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
import {
    MapPin,
    Clock,
    DollarSign,
    Plus,
    Archive,
    Pencil,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

// ── Debounce hook ──────────────────────────────────────────────────────────────
function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Index({ courts, filters, courtTypes, courtStatuses }) {
    // courts is a Laravel paginator: { data, current_page, last_page, per_page, total, links }
    const courtData = courts.data ?? [];
    const pagination = {
        current_page: courts.current_page ?? 1,
        last_page: courts.last_page ?? 1,
        total: courts.total ?? 0,
        per_page: courts.per_page ?? 10,
    };

    // ── Filter state ────────────────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState(filters?.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters?.type ?? 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const debouncedSearch = useDebounce(searchInput, 300);
    const isInitialMount = useRef(true);

    // Navigate with filters via Inertia
    const navigateWithFilters = useCallback(
        (overrides = {}) => {
            const params = {};
            const search = overrides.search !== undefined ? overrides.search : debouncedSearch;
            const type = overrides.type !== undefined ? overrides.type : typeFilter;
            const status = overrides.status !== undefined ? overrides.status : statusFilter;
            const page = overrides.page ?? 1;

            if (search) params.search = search;
            if (type && type !== 'all') params.type = type;
            if (status && status !== 'all') params.status = status;
            if (page > 1) params.page = page;

            router.get('/manager/courts', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [debouncedSearch, typeFilter, statusFilter],
    );

    // Debounced search triggers navigation (skip initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        navigateWithFilters({ search: debouncedSearch, page: 1 });
    }, [debouncedSearch]);

    // Filter changes reset to page 1
    const handleTypeChange = (value) => {
        setTypeFilter(value);
        navigateWithFilters({ type: value, page: 1 });
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        navigateWithFilters({ status: value, page: 1 });
    };

    const clearFilters = () => {
        setSearchInput('');
        setTypeFilter('all');
        setStatusFilter('all');
        navigateWithFilters({ search: '', type: 'all', status: 'all', page: 1 });
    };

    const hasActiveFilters =
        (filters?.search ?? '') !== '' ||
        (filters?.type ?? 'all') !== 'all' ||
        (filters?.status ?? 'all') !== 'all';

    // ── Selection state ─────────────────────────────────────────────────────────
    const [selected, setSelected] = useState(new Set());

    // Clear selection on page/filter change
    useEffect(() => {
        setSelected(new Set());
    }, [pagination.current_page, filters?.search, filters?.type, filters?.status]);

    const allVisibleSelected =
        courtData.length > 0 && courtData.every((c) => selected.has(c.uuid));
    const someSelected = courtData.some((c) => selected.has(c.uuid)) && !allVisibleSelected;

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(courtData.map((c) => c.uuid)));
        }
    };

    const toggleSelect = (uuid) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    };

    // ── Bulk status change ──────────────────────────────────────────────────────
    const [bulkTargetStatus, setBulkTargetStatus] = useState('');
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const handleBulkStatus = () => {
        if (!bulkTargetStatus || selected.size === 0) return;
        setBulkConfirmOpen(true);
    };

    const confirmBulkStatus = () => {
        setBulkProcessing(true);
        router.patch(
            '/manager/courts/status',
            {
                court_uuids: Array.from(selected),
                status: bulkTargetStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelected(new Set());
                    setBulkTargetStatus('');
                    setBulkConfirmOpen(false);
                },
                onFinish: () => setBulkProcessing(false),
            },
        );
    };

    // ── Archive dialog ──────────────────────────────────────────────────────────
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [archiveProcessing, setArchiveProcessing] = useState(false);

    const openArchiveDialog = (court) => setArchiveTarget(court);

    const confirmArchive = () => {
        if (!archiveTarget) return;
        setArchiveProcessing(true);
        router.delete(`/manager/courts/${archiveTarget.uuid}`, {
            preserveScroll: true,
            onSuccess: () => setArchiveTarget(null),
            onFinish: () => setArchiveProcessing(false),
        });
    };

    // ── Create/Edit dialog ──────────────────────────────────────────────────────
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const form = useForm({
        name: '',
        court_type: courtTypes[0]?.value ?? 'pickleball',
        status: 'active',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (court) => {
        form.setData({
            name: court.name,
            court_type: court.court_type,
            status: court.status,
        });
        form.clearErrors();
        setEditing(court);
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => setOpen(false) };
        editing
            ? form.put(`/manager/courts/${editing.uuid}`, opts)
            : form.post('/manager/courts', opts);
    };

    // ── Status helpers ──────────────────────────────────────────────────────────
    const statusVariant = (s) =>
        s === 'active' ? 'default' : s === 'maintenance' ? 'secondary' : 'outline';

    const bulkStatusLabels = {
        active: 'Đang hoạt động',
        maintenance: 'Bảo trì',
        archived: 'Đã lưu trữ',
    };

    const bulkTargetLabel = bulkTargetStatus
        ? bulkStatusLabels[bulkTargetStatus] ?? bulkTargetStatus
        : '';

    // ── Render ──────────────────────────────────────────────────────────────────
    const isEmpty = pagination.total === 0;
    const isNoMatch = !isEmpty && courtData.length === 0;

    return (
        <ManagerLayout>
            <Head title="Quản lý sân" />

            <PageContainer>
                <PageHeader
                    title="Quản lý sân"
                    description={`${pagination.total} sân · Quản lý sân, giờ mở cửa và bảng giá`}
                    actions={
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm sân
                        </Button>
                    }
                />

                {/* ── Filters ──────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm tên sân…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                            aria-label="Tìm kiếm sân"
                        />
                    </div>

                    <Select value={typeFilter} onValueChange={handleTypeChange}>
                        <SelectTrigger className="w-full sm:w-[160px]" aria-label="Lọc theo loại sân">
                            <SelectValue placeholder="Loại sân" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả loại</SelectItem>
                            {courtTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full sm:w-[160px]" aria-label="Lọc theo trạng thái">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            {courtStatuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground"
                            onClick={clearFilters}
                        >
                            <X className="h-3.5 w-3.5" />
                            Xoá bộ lọc
                        </Button>
                    )}
                </div>

                {/* ── Selection toolbar ─────────────────────────────────────── */}
                {selected.size > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
                        <span className="text-sm font-medium">
                            Đã chọn {selected.size} sân
                        </span>

                        <Select value={bulkTargetStatus} onValueChange={setBulkTargetStatus}>
                            <SelectTrigger className="w-[180px]" aria-label="Chuyển trạng thái thành">
                                <SelectValue placeholder="Chuyển thành…" />
                            </SelectTrigger>
                            <SelectContent>
                                {courtStatuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            size="sm"
                            disabled={!bulkTargetStatus}
                            onClick={handleBulkStatus}
                        >
                            Áp dụng
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground"
                            onClick={() => setSelected(new Set())}
                        >
                            <X className="h-3.5 w-3.5" />
                            Bỏ chọn
                        </Button>
                    </div>
                )}

                {/* ── Empty states ─────────────────────────────────────────── */}
                {isEmpty && (
                    <EmptyState
                        icon={MapPin}
                        title="Chưa có sân nào"
                        description="Tạo sân đầu tiên để bắt đầu nhận lịch đặt. Mỗi sân có thể thiết lập giờ mở cửa và bảng giá riêng."
                        example="VD: Sân A1 (Pickleball), Sân 1 (Cầu lông)"
                        action={
                            <Button onClick={openCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Thêm sân đầu tiên
                            </Button>
                        }
                    />
                )}

                {isNoMatch && (
                    <EmptyState
                        icon={Search}
                        title="Không tìm thấy sân"
                        description="Không có sân nào khớp với bộ lọc hiện tại."
                        action={
                            <Button variant="outline" onClick={clearFilters}>
                                Xoá bộ lọc
                            </Button>
                        }
                    />
                )}

                {/* ── Table ────────────────────────────────────────────────── */}
                {!isEmpty && !isNoMatch && (
                    <TooltipProvider>
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={
                                                    allVisibleSelected
                                                        ? true
                                                        : someSelected
                                                          ? 'indeterminate'
                                                          : false
                                                }
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Chọn tất cả sân trên trang"
                                            />
                                        </TableHead>
                                        <TableHead>Tên sân</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courtData.map((court) => (
                                        <TableRow
                                            key={court.uuid}
                                            data-state={selected.has(court.uuid) ? 'selected' : undefined}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selected.has(court.uuid)}
                                                    onCheckedChange={() => toggleSelect(court.uuid)}
                                                    aria-label={`Chọn sân ${court.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {court.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {court.court_type_label}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant(court.status)}>
                                                    {court.status_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Giờ mở cửa */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/manager/courts/${court.uuid}/opening-rules`,
                                                                    )
                                                                }
                                                                aria-label={`Giờ mở cửa sân ${court.name}`}
                                                            >
                                                                <Clock className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Giờ mở cửa</TooltipContent>
                                                    </Tooltip>

                                                    {/* Bảng giá */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/manager/courts/${court.uuid}/pricing-rules`,
                                                                    )
                                                                }
                                                                aria-label={`Bảng giá sân ${court.name}`}
                                                            >
                                                                <DollarSign className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Bảng giá</TooltipContent>
                                                    </Tooltip>

                                                    {/* Sửa */}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => openEdit(court)}
                                                                aria-label={`Sửa sân ${court.name}`}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Sửa</TooltipContent>
                                                    </Tooltip>

                                                    {/* Lưu trữ */}
                                                    {court.status !== 'archived' && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                    onClick={() =>
                                                                        openArchiveDialog(court)
                                                                    }
                                                                    aria-label={`Lưu trữ sân ${court.name}`}
                                                                >
                                                                    <Archive className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Lưu trữ</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* ── Pagination ────────────────────────────────────── */}
                        {pagination.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Trang {pagination.current_page} / {pagination.last_page}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.current_page <= 1}
                                        onClick={() =>
                                            navigateWithFilters({
                                                page: pagination.current_page - 1,
                                            })
                                        }
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Trước
                                    </Button>

                                    {/* Numbered page buttons */}
                                    {Array.from(
                                        { length: Math.min(pagination.last_page, 5) },
                                        (_, i) => {
                                            let page;
                                            if (pagination.last_page <= 5) {
                                                page = i + 1;
                                            } else if (pagination.current_page <= 3) {
                                                page = i + 1;
                                            } else if (
                                                pagination.current_page >=
                                                pagination.last_page - 2
                                            ) {
                                                page = pagination.last_page - 4 + i;
                                            } else {
                                                page = pagination.current_page - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page === pagination.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    className="h-9 w-9 p-0"
                                                    onClick={() =>
                                                        navigateWithFilters({ page })
                                                    }
                                                    aria-label={`Trang ${page}`}
                                                    aria-current={
                                                        page === pagination.current_page
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        },
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            pagination.current_page >= pagination.last_page
                                        }
                                        onClick={() =>
                                            navigateWithFilters({
                                                page: pagination.current_page + 1,
                                            })
                                        }
                                        className="gap-1"
                                    >
                                        Sau
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TooltipProvider>
                )}
            </PageContainer>

            <ConfirmActionDialog
                open={!!archiveTarget}
                onOpenChange={(open) => {
                    if (!open) setArchiveTarget(null);
                }}
                onConfirm={confirmArchive}
                title="Lưu trữ sân"
                description={archiveTarget ? `Sân “${archiveTarget.name}” sẽ ngừng hiển thị trên lịch đặt, nhưng toàn bộ dữ liệu và lịch sử hiện tại vẫn được giữ lại.` : ''}
                confirmLabel="Lưu trữ sân"
                processingLabel="Đang lưu trữ…"
                processing={archiveProcessing}
            />

            <ConfirmActionDialog
                open={bulkConfirmOpen}
                onOpenChange={setBulkConfirmOpen}
                onConfirm={confirmBulkStatus}
                title="Xác nhận thay đổi trạng thái"
                description={`Chuyển ${selected.size} sân sang trạng thái “${bulkTargetLabel}”. Thay đổi sẽ áp dụng đồng thời cho tất cả sân đã chọn.`}
                confirmLabel="Áp dụng thay đổi"
                processingLabel="Đang xử lý…"
                processing={bulkProcessing}
                variant="default"
            />

            {/* ── Create / Edit Dialog ────────────────────────────────────── */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Sửa sân' : 'Thêm sân'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên sân</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Sân 1"
                            />
                            {form.errors.name && (
                                <p className="text-sm text-destructive">{form.errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Loại sân</Label>
                            <Select
                                value={form.data.court_type}
                                onValueChange={(v) => form.setData('court_type', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {courtTypes.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {editing && (
                            <div className="space-y-2">
                                <Label>Trạng thái</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(v) => form.setData('status', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Đang hoạt động</SelectItem>
                                        <SelectItem value="maintenance">Bảo trì</SelectItem>
                                        <SelectItem value="archived">Đã lưu trữ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                {editing ? 'Lưu' : 'Tạo'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
