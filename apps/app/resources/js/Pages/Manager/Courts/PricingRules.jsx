import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';

const DAY_LABELS = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'CN' };
const VND = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function PricingRules({ court, rules }) {
    const [open, setOpen] = useState(false);
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

    const submit = (e) => {
        e.preventDefault();
        form.post(`/manager/courts/${court.uuid}/pricing-rules`, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); form.reset(); },
        });
    };

    const remove = (id) => {
        if (confirm('Xóa bảng giá này?')) {
            router.delete(`/manager/courts/${court.uuid}/pricing-rules/${id}`, { preserveScroll: true });
        }
    };

    const dayLabel = (days) => days.map((d) => DAY_LABELS[d]).join(', ');

    return (
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Bảng giá — {court.name}</h2>}
        >
            <Head title={`Bảng giá — ${court.name}`} />

            <div className="mx-auto max-w-3xl p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{rules.length} mức giá</p>
                    <Button onClick={() => { form.reset(); form.clearErrors(); setOpen(true); }}>
                        + Thêm giá
                    </Button>
                </div>

                <div className="divide-y rounded-lg border bg-card">
                    {rules.length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">Chưa có bảng giá nào.</p>
                    )}
                    {rules.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-medium">{dayLabel(r.weekday)} · {r.start_local}–{r.end_local}</div>
                                <div className="text-sm text-muted-foreground">
                                    {VND(r.price_per_hour)} / giờ · ưu tiên {r.priority}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>Xóa</Button>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Thêm bảng giá</DialogTitle></DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Ngày trong tuần</Label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                    <label key={d} className="flex items-center gap-1.5 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.data.weekday.includes(d)}
                                            onChange={() => toggleDay(d)}
                                            className="rounded"
                                        />
                                        {DAY_LABELS[d]}
                                    </label>
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
                                <Input id="price" type="number" min="0" value={form.data.price_per_hour} onChange={(e) => form.setData('price_per_hour', e.target.value)} placeholder="100000" />
                                {form.errors.price_per_hour && <p className="text-sm text-destructive">{form.errors.price_per_hour}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="priority">Ưu tiên</Label>
                                <Input id="priority" type="number" min="0" value={form.data.priority} onChange={(e) => form.setData('priority', e.target.value)} placeholder="0" />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>Thêm</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
