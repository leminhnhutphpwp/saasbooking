import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
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
import { MapPin, Clock, DollarSign, Plus, Settings2, Archive } from 'lucide-react';

export default function Index({ courts, courtTypes }) {
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

    const archive = (court) => {
        if (confirm(`Lưu trữ sân "${court.name}"?`)) {
            router.delete(`/manager/courts/${court.uuid}`, { preserveScroll: true });
        }
    };

    const statusVariant = (s) =>
        s === 'active' ? 'default' : s === 'maintenance' ? 'secondary' : 'outline';

    return (
        <ManagerLayout>
            <Head title="Quản lý sân" />

            <PageContainer>
                <PageHeader
                    title="Quản lý sân"
                    description={`${courts.length} sân · Quản lý sân, giờ mở cửa và bảng giá`}
                    actions={
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm sân
                        </Button>
                    }
                />

                {courts.length === 0 ? (
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
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {courts.map((court) => (
                            <Card key={court.uuid} className="overflow-hidden transition-shadow hover:shadow-md">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{court.name}</h3>
                                                <p className="text-sm text-muted-foreground">{court.court_type_label}</p>
                                            </div>
                                        </div>
                                        <Badge variant={statusVariant(court.status)}>
                                            {court.status_label}
                                        </Badge>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => router.visit(`/manager/courts/${court.uuid}/opening-rules`)}
                                        >
                                            <Clock className="h-3.5 w-3.5" />
                                            Giờ mở cửa
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => router.visit(`/manager/courts/${court.uuid}/pricing-rules`)}
                                        >
                                            <DollarSign className="h-3.5 w-3.5" />
                                            Bảng giá
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => openEdit(court)}
                                        >
                                            <Settings2 className="h-3.5 w-3.5" />
                                            Sửa
                                        </Button>
                                        {court.status !== 'archived' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-muted-foreground hover:text-destructive"
                                                onClick={() => archive(court)}
                                            >
                                                <Archive className="h-3.5 w-3.5" />
                                                Lưu trữ
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContainer>

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
