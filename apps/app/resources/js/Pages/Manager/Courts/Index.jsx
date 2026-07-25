import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancelButton,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Archive,
    Clock,
    DollarSign,
    EllipsisVertical,
    MapPin,
    Pencil,
    Plus,
    Search,
    X,
} from 'lucide-react';

const ALL = 'all';

/**
 * Normalize Vietnamese text for accent-insensitive search.
 * Strips combining marks and normalizes đ/Đ.
 */
function normalizeVietnamese(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

export default function Index({ courts, courtTypes, courtStatuses }) {
    const allCourts = courts ?? [];

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState(ALL);
    const [statusFilter, setStatusFilter] = useState(ALL);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [archiveTarget, setArchiveTarget] = useState(null);

    const form = useForm({
        name: '',
        court_type: courtTypes[0]?.value ?? 'pickleball',
        status: 'active',
    });

    // Client-side filtering
    const filteredCourts = useMemo(() => {
        const q = normalizeVietnamese(search);

        return allCourts.filter((court) => {
            if (q && !normalizeVietnamese(court.name).includes(q)) return false;
            if (typeFilter !== ALL && court.court_type !== typeFilter) return false;
            if (statusFilter !== ALL && court.status !== statusFilter) return false;
            return true;
        });
    }, [allCourts, search, typeFilter, statusFilter]);

    const hasActiveFilters = search !== '' || typeFilter !== ALL || statusFilter !== ALL;

    const clearFilters = () => {
        setSearch('');
        setTypeFilter(ALL);
        setStatusFilter(ALL);
    };

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (court) => {
        form.setData({ name: court.name, court_type: court.court_type, status: court.status });
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

    const confirmArchive = () => {
        router.delete(`/manager/courts/${archiveTarget.uuid}`, {
            preserveScroll: true,
            onSuccess: () => setArchiveTarget(null),
        });
    };

    const statusVariant = (s) =>
        s === 'active' ? 'default' : s === 'maintenance' ? 'secondary' : 'outline';

    const statusRailColor = (s) =>
        s === 'active'
            ? 'bg-emerald-500'
            : s === 'maintenance'
              ? 'bg-amber-500'
              : 'bg-muted-foreground/40';

    const isEmpty = allCourts.length === 0;
    const isNoMatch = !isEmpty && filteredCourts.length === 0;

    return (
        <ManagerLayout>
            <Head title="Quản lý sân" />

            <PageContainer>
                <PageHeader
                    title="Quản lý sân"
                    description={`${allCourts.length} sân · Quản lý sân, giờ mở cửa và bảng giá`}
                    actions={
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm sân
                        </Button>
                    }
                />

                {/* Zero courts empty state */}
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

                {/* Table with filters */}
                {!isEmpty && (
                    <Card>
                        <CardContent className="p-0">
                            {/* Toolbar */}
                            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                                    {/* Search */}
                                    <div className="relative flex-1 sm:max-w-xs">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Tìm theo tên sân..."
                                            className="pl-9"
                                            aria-label="Tìm sân"
                                        />
                                    </div>

                                    {/* Type filter */}
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-full sm:w-40" aria-label="Lọc loại sân">
                                            <SelectValue placeholder="Tất cả loại" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL}>Tất cả loại</SelectItem>
                                            {courtTypes.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Status filter */}
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-40" aria-label="Lọc trạng thái">
                                            <SelectValue placeholder="Tất cả trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
                                            {(courtStatuses ?? []).map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Live count */}
                                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                                        Hiển thị {filteredCourts.length}/{allCourts.length} sân
                                    </span>

                                    {/* Clear filters */}
                                    {hasActiveFilters && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="gap-1.5 text-muted-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            Xóa bộ lọc
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* No-match state */}
                            {isNoMatch ? (
                                <EmptyState
                                    icon={Search}
                                    title="Không tìm thấy sân phù hợp"
                                    description="Thử đổi từ khóa hoặc bộ lọc để xem các sân khác."
                                    example="VD: xóa bộ lọc trạng thái để xem toàn bộ sân"
                                    action={
                                        <Button variant="outline" onClick={clearFilters}>
                                            Xóa bộ lọc
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[200px]">Tên sân</TableHead>
                                                <TableHead className="hidden md:table-cell">Loại sân</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead className="hidden text-right lg:table-cell">
                                                    Thiết lập
                                                </TableHead>
                                                <TableHead className="w-12 text-right">Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCourts.map((court) => (
                                                <TableRow key={court.uuid}>
                                                    {/* Identity cell with status rail */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`h-8 w-1 shrink-0 rounded-full ${statusRailColor(court.status)}`}
                                                                aria-hidden="true"
                                                            />
                                                            <div>
                                                                <span className="font-medium">{court.name}</span>
                                                                <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">
                                                                    {court.court_type_label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Type */}
                                                    <TableCell className="hidden text-muted-foreground md:table-cell">
                                                        {court.court_type_label}
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell>
                                                        <Badge variant={statusVariant(court.status)}>
                                                            {court.status_label}
                                                        </Badge>
                                                    </TableCell>

                                                    {/* Config buttons */}
                                                    <TableCell className="hidden text-right lg:table-cell">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/manager/courts/${court.uuid}/opening-rules`,
                                                                    )
                                                                }
                                                            >
                                                                <Clock className="h-3.5 w-3.5" />
                                                                Giờ mở cửa
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/manager/courts/${court.uuid}/pricing-rules`,
                                                                    )
                                                                }
                                                            >
                                                                <DollarSign className="h-3.5 w-3.5" />
                                                                Bảng giá
                                                            </Button>
                                                        </div>
                                                    </TableCell>

                                                    {/* Actions dropdown */}
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    aria-label={`Thao tác với ${court.name}`}
                                                                >
                                                                    <EllipsisVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEdit(court)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Sửa sân
                                                                </DropdownMenuItem>
                                                                {court.status !== 'archived' && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            className="text-destructive focus:text-destructive"
                                                                            onClick={() => setArchiveTarget(court)}
                                                                        >
                                                                            <Archive className="mr-2 h-4 w-4" />
                                                                            Lưu trữ sân
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </PageContainer>

            {/* Create/Edit Dialog */}
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
                                        {(courtStatuses ?? []).map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
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

            {/* Archive Confirmation */}
            <AlertDialog
                open={Boolean(archiveTarget)}
                onOpenChange={(v) => !v && setArchiveTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lưu trữ sân?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sân &ldquo;{archiveTarget?.name}&rdquo; sẽ không còn nhận lịch đặt mới.
                            Bạn vẫn có thể xem các lịch đặt trước đây.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancelButton>Hủy</AlertDialogCancelButton>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmArchive}
                        >
                            Lưu trữ sân
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ManagerLayout>
    );
}
