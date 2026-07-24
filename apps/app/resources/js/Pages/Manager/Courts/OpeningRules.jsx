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
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Trash2, Plus, AlertCircle, Clock } from 'lucide-react';

const DAY_LABELS = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
const DAY_FULL = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ Nhật' };

export default function OpeningRules({ court, rules }) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const form = useForm({
        weekday: [],
        open_local: '06:00',
        close_local: '22:00',
        effective_from: '',
        effective_to: '',
    });

    const toggleDay = (day) => {
        const next = form.data.weekday.includes(day)
            ? form.data.weekday.filter((d) => d !== day)
            : [...form.data.weekday, day];
        form.setData('weekday', next);
    };

    const selectAllDays = () => {
        form.setData('weekday', [1, 2, 3, 4, 5, 6, 7]);
    };

    const openAdd = () => {
        form.reset();
        form.clearErrors();
        setEditingId(null);
        setOpen(true);
    };

    const openEdit = (rule) => {
        form.setData({
            weekday: rule.weekday,
            open_local: rule.open_local,
            close_local: rule.close_local,
            effective_from: rule.effective_from || '',
            effective_to: rule.effective_to || '',
        });
        form.clearErrors();
        setEditingId(rule.id);
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const url = editingId
            ? `/manager/courts/${court.uuid}/opening-rules/${editingId}`
            : `/manager/courts/${court.uuid}/opening-rules`;
        const method = editingId ? 'put' : 'post';

        form[method](url, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); form.reset(); setEditingId(null); },
        });
    };

    const remove = (id) => {
        if (confirm('Xóa giờ mở cửa này?')) {
            router.delete(`/manager/courts/${court.uuid}/opening-rules/${id}`, { preserveScroll: true });
        }
    };

    const dayLabel = (days) => days.map((d) => DAY_FULL[d]).join(', ');

    return (
        <ManagerLayout>
            <Head title={`Giờ mở cửa — ${court.name}`} />

            <PageContainer size="narrow">
                <PageHeader
                    title={`Giờ mở cửa — ${court.name}`}
                    backHref="/manager/courts"
                    backLabel="Danh sách sân"
                    description={`${rules.length} khung giờ mở cửa`}
                    actions={
                        <Button onClick={openAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm khung giờ
                        </Button>
                    }
                />

                {form.errors.open_local && (
                    <div className="flex items-start gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-medium">Trùng khung giờ</p>
                            <p>{form.errors.open_local}</p>
                        </div>
                    </div>
                )}

                <Card className="overflow-hidden">
                    {rules.length === 0 ? (
                        <EmptyState
                            icon={Clock}
                            title="Chưa có giờ mở cửa nào"
                            description="Thiết lập khung giờ mở cửa cho sân theo từng ngày trong tuần."
                            example="VD: T2–T6 mở 06:00–22:00, T7–CN mở 07:00–20:00"
                            action={
                                <Button onClick={openAdd} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Thêm khung giờ
                                </Button>
                            }
                        />
                    ) : (
                        <div className="divide-y">
                            {rules.map((r) => (
                                <div key={r.id} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="font-medium">{dayLabel(r.weekday)}</div>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {r.open_local} – {r.close_local}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {r.effective_from && <>Từ {r.effective_from}</>}
                                            {r.effective_to && <> · đến {r.effective_to}</>}
                                            {!r.effective_from && !r.effective_to && <span className="italic">Vô thời hạn</span>}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Sửa</Button>
                                        <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </PageContainer>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Sửa khung giờ' : 'Thêm khung giờ mở cửa'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Ngày trong tuần</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={selectAllDays} className="h-auto text-xs">
                                    Chọn tất cả
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => toggleDay(d)}
                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                            form.data.weekday.includes(d)
                                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                    >
                                        {DAY_LABELS[d]}
                                    </button>
                                ))}
                            </div>
                            {form.errors.weekday && <p className="text-sm text-destructive">{form.errors.weekday}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="open">Giờ mở</Label>
                                <Input id="open" type="time" value={form.data.open_local} onChange={(e) => form.setData('open_local', e.target.value)} />
                                {form.errors.open_local && <p className="text-sm text-destructive">{form.errors.open_local}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="close">Giờ đóng</Label>
                                <Input id="close" type="time" value={form.data.close_local} onChange={(e) => form.setData('close_local', e.target.value)} />
                                {form.errors.close_local && <p className="text-sm text-destructive">{form.errors.close_local}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="efrom">Hiệu lực từ</Label>
                                <Input id="efrom" type="date" value={form.data.effective_from} onChange={(e) => form.setData('effective_from', e.target.value)} />
                                {form.errors.effective_from && <p className="text-sm text-destructive">{form.errors.effective_from}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="eto">Đến (để trống = vô hạn)</Label>
                                <Input id="eto" type="date" value={form.data.effective_to} onChange={(e) => form.setData('effective_to', e.target.value)} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={form.processing}>
                                {editingId ? 'Cập nhật' : 'Thêm'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
