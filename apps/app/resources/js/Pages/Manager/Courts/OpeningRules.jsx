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

export default function OpeningRules({ court, rules }) {
    const [open, setOpen] = useState(false);
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

    const submit = (e) => {
        e.preventDefault();
        form.post(`/manager/courts/${court.uuid}/opening-rules`, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); form.reset(); },
        });
    };

    const remove = (id) => {
        if (confirm('Xóa giờ mở cửa này?')) {
            router.delete(`/manager/courts/${court.uuid}/opening-rules/${id}`, { preserveScroll: true });
        }
    };

    const dayLabel = (days) => days.map((d) => DAY_LABELS[d]).join(', ');

    return (
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Giờ mở cửa — {court.name}</h2>}
        >
            <Head title={`Giờ mở cửa — ${court.name}`} />

            <div className="mx-auto max-w-3xl p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{rules.length} khung giờ</p>
                    <Button onClick={() => { form.reset(); form.clearErrors(); setOpen(true); }}>
                        + Thêm khung giờ
                    </Button>
                </div>

                <div className="divide-y rounded-lg border bg-card">
                    {rules.length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">Chưa có giờ mở cửa nào.</p>
                    )}
                    {rules.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-medium">{dayLabel(r.weekday)}</div>
                                <div className="text-sm text-muted-foreground">
                                    {r.open_local} – {r.close_local}
                                    {r.effective_from && <> · từ {r.effective_from}</>}
                                    {r.effective_to && <> · đến {r.effective_to}</>}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>Xóa</Button>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Thêm khung giờ mở cửa</DialogTitle></DialogHeader>
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
                                <Label htmlFor="eto">Đến</Label>
                                <Input id="eto" type="date" value={form.data.effective_to} onChange={(e) => form.setData('effective_to', e.target.value)} />
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
