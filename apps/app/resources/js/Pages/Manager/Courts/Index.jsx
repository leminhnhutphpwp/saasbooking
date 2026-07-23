import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
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
        if (confirm(`Lưu trữ sân “${court.name}”?`)) {
            router.delete(`/manager/courts/${court.uuid}`, { preserveScroll: true });
        }
    };

    const statusVariant = (s) =>
        s === 'active' ? 'default' : s === 'maintenance' ? 'secondary' : 'outline';

    const statusColor = (s) =>
        s === 'active' ? 'bg-success/10 text-success' : s === 'maintenance' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground';

    return (
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Quản lý sân</h2>}
        >
            <Head title="Quản lý sân" />

            <div className="p-4 sm:p-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{courts.length} sân</p>
                    <Button onClick={openCreate}>+ Thêm sân</Button>
                </div>

                <div className="divide-y rounded-lg border bg-card">
                    {courts.length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                            Chưa có sân nào. Bấm “Thêm sân” để tạo.
                        </p>
                    )}
                    {courts.map((court) => (
                        <div key={court.uuid} className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-medium">{court.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {court.court_type_label}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge className={statusColor(court.status)}>
                                    {court.status_label}
                                </Badge>
                                <div className="flex items-center">
                                <Button variant="outline" size="sm" onClick={() => router.visit(`/manager/courts/${court.uuid}/opening-rules`)}>
                                    Giờ
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => router.visit(`/manager/courts/${court.uuid}/pricing-rules`)}>
                                    Giá
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openEdit(court)}>
                                    Sửa
                                </Button>
                                {court.status !== 'archived' && (
                                    <Button variant="ghost" size="sm" onClick={() => archive(court)}>
                                        Lưu trữ
                                    </Button>
                                )}
                            </div>
                        </div>
                            </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Sửa sân' : 'Thêm sân'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
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
                            <div className="space-y-1.5">
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
