import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { formatVND } from '@/lib/format';
import { Trash2, Plus, AlertCircle } from 'lucide-react';

const DAY_LABELS = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
const DAY_FULL = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ Nhật' };

function getTierLabel(rule) {
    const days = rule.weekday.sort((a, b) => a - b);
    const isWeekend = days.length === 2 && days[0] === 6 && days[1] === 7;
    const isWeekday = days.length === 5 && days[0] === 1 && days[4] === 5;
    const isAllDays = days.length === 7 && days[0] === 1 && days[6] === 7;

    if (isAllDays) return 'Tất cả';
    if (isWeekend) return 'Cuối tuần';
    if (isWeekday) return 'Ngày thường';
    return rule.weekday.map((d) => DAY_LABELS[d]).join(', ');
}

function getTierColor(rule) {
    const days = rule.weekday.sort((a, b) => a - b);
    const isWeekend = days.length === 2 && days[0] === 6 && days[1] === 7;
    if (isWeekend) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
}

export default function PricingRules({ court, rules }) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const form = useForm({
        weekday: [],
        start_local: '06:00',
        end_local: '08:00',
        price_per_hour: '',
        priority: '0',
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

    const selectWeekdays = () => {
        form.setData('weekday', [1, 2, 3, 4, 5]);
    };

    const selectWeekend = () => {
        form.setData('weekday', [6, 7]);
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
            start_local: rule.start_local,
            end_local: rule.end_local,
            price_per_hour: String(rule.price_per_hour),
            priority: String(rule.priority ?? 0),
        });
        form.clearErrors();
        setEditingId(rule.id);
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const url = editingId
            ? `/manager/courts/${court.uuid}/pricing-rules/${editingId}`
            : `/manager/courts/${court.uuid}/pricing-rules`;
        const method = editingId ? 'put' : 'post';

        form[method](url, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); form.reset(); setEditingId(null); },
        });
    };

    const remove = (id) => {
        if (confirm('Xóa bảng giá này?')) {
            router.delete(`/manager/courts/${court.uuid}/pricing-rules/${id}`, { preserveScroll: true });
        }
    };

    const sortedRules = [...rules].sort((a, b) => {
        const aStart = a.start_local.localeCompare(b.start_local);
        if (aStart !== 0) return aStart;
        return (b.priority ?? 0) - (a.priority ?? 0);
    });

    return (
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Bảng giá — {court.name}</h2>}
        >
            <Head title={`Bảng giá — ${court.name}`} />

            <div className="mx-auto max-w-4xl p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{rules.length} mức giá</p>
                    <Button onClick={openAdd} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm giá
                    </Button>
                </div>

                {form.errors.start_local && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-medium">Trùng khung giờ</p>
                            <p>{form.errors.start_local}</p>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border bg-card">
                    {rules.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-muted-foreground">Chưa có bảng giá nào.</p>
                            <p className="mt-1 text-xs text-muted-foreground/60">Bấm "Thêm giá" để bắt đầu.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {sortedRules.map((r) => (
                                <div key={r.id} className="flex items-center justify-between p-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className={getTierColor(r)}>
                                                {getTierLabel(r)}
                                            </Badge>
                                            <span className="font-mono text-sm">
                                                {r.start_local} – {r.end_local}
                                            </span>
                                            {r.priority > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Ưu tiên {r.priority}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-emerald-600">
                                            {formatVND(r.price_per_hour)} / giờ
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Sửa</Button>
                                        <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {rules.length > 0 && (
                    <div className="mt-4 rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
                        <p className="font-medium">Giải thích:</p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5">
                            <li><strong>Ngày thường</strong> (T2–T6): giá chuẩn</li>
                            <li><strong>Cuối tuần</strong> (T7–CN): giá cao hơn</li>
                            <li><strong>Ưu tiên</strong>: số càng cao, rule càng được ưu tiên khi trùng khung giờ</li>
                        </ul>
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Sửa bảng giá' : 'Thêm bảng giá'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Ngày trong tuần</Label>
                                <div className="flex gap-1">
                                    <Button type="button" variant="ghost" size="sm" onClick={selectAllDays} className="text-xs">
                                        Tất cả
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={selectWeekdays} className="text-xs">
                                        Ngày thường
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={selectWeekend} className="text-xs">
                                        Cuối tuần
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => toggleDay(d)}
                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                            form.data.weekday.includes(d)
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-card text-muted-foreground hover:bg-accent'
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
                                <Label htmlFor="start">Từ giờ</Label>
                                <Input id="start" type="time" value={form.data.start_local} onChange={(e) => form.setData('start_local', e.target.value)} />
                                {form.errors.start_local && <p className="text-sm text-destructive">{form.errors.start_local}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="end">Đến giờ</Label>
                                <Input id="end" type="time" value={form.data.end_local} onChange={(e) => form.setData('end_local', e.target.value)} />
                                {form.errors.end_local && <p className="text-sm text-destructive">{form.errors.end_local}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="price">Giá mỗi giờ (VNĐ)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={form.data.price_per_hour}
                                    onChange={(e) => form.setData('price_per_hour', e.target.value)}
                                    placeholder="100000"
                                />
                                {form.data.price_per_hour && (
                                    <p className="text-xs text-muted-foreground">
                                        = {formatVND(Number(form.data.price_per_hour))} / giờ
                                    </p>
                                )}
                                {form.errors.price_per_hour && <p className="text-sm text-destructive">{form.errors.price_per_hour}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="priority">Ưu tiên (cao hơn = ưu tiên hơn)</Label>
                                <Input id="priority" type="number" min="0" value={form.data.priority} onChange={(e) => form.setData('priority', e.target.value)} placeholder="0" />
                                <p className="text-xs text-muted-foreground">Mặc định: 0</p>
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
