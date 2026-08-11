import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Trash2, Plus, AlertCircle, CalendarDays, Info } from 'lucide-react';

const DAY_LABELS = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
const DAY_FULL = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ Nhật' };

export default function OpeningRules({ court, rules }) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
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

    const validate = () => {
        const errors = {};
        if (form.data.weekday.length === 0) {
            errors.weekday = 'Chọn ít nhất một ngày trong tuần.';
        }
        if (form.data.open_local && form.data.close_local && form.data.open_local >= form.data.close_local) {
            errors.close_local = 'Giờ đóng phải sau giờ mở.';
        }
        if (form.data.effective_from && form.data.effective_to && form.data.effective_to < form.data.effective_from) {
            errors.effective_to = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.';
        }
        return errors;
    };

    const submit = (e) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            Object.entries(errors).forEach(([key, msg]) => form.setError(key, msg));
            return;
        }

        const url = editingId
            ? route('manager.courts.opening-rules.update', [court.uuid, editingId])
            : route('manager.courts.opening-rules.store', court.uuid);
        const method = editingId ? 'put' : 'post';

        form[method](url, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); form.reset(); setEditingId(null); },
        });
    };

    const remove = () => {
        if (!deleteTarget) return;

        setDeleteProcessing(true);
        router.delete(route('manager.courts.opening-rules.destroy', [court.uuid, deleteTarget.id]), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleteProcessing(false),
        });
    };

    const dayLabel = (days) => days.map((d) => DAY_FULL[d]).join(', ');
    const sortedRules = [...rules].sort((a, b) => a.open_local.localeCompare(b.open_local));
    const coveredDays = new Set(rules.flatMap((rule) => rule.weekday)).size;
    const earliestOpen = sortedRules[0]?.open_local ?? null;
    const latestClose = rules.length > 0
        ? [...rules].sort((a, b) => b.close_local.localeCompare(a.close_local))[0].close_local
        : null;
    const permanentRules = rules.filter((rule) => !rule.effective_to).length;
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    const rulesByDay = Object.fromEntries(
        [1, 2, 3, 4, 5, 6, 7].map((day) => [
            day,
            sortedRules.filter((rule) => rule.weekday.includes(day)),
        ]),
    );

    return (
        <ManagerLayout>
            <Head title={`Giờ mở cửa — ${court.name}`} />

            <PageContainer>
                <PageHeader
                    title={`Giờ mở cửa — ${court.name}`}
                    backHref="/manager/courts"
                    backLabel="Danh sách sân"
                    description="Thiết lập thời gian nhận đặt sân theo ngày và khoảng hiệu lực"
                    actions={
                        <Button onClick={openAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm khung giờ
                        </Button>
                    }
                />

                {form.errors.open_local && (
                    <div className="manager-alert items-start p-3 text-sm">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-medium">Trùng khung giờ</p>
                            <p>{form.errors.open_local}</p>
                        </div>
                    </div>
                )}

                {rules.length === 0 ? (
                    <Card>
                        <EmptyState
                            title="Thiết lập giờ mở cửa cho sân theo từng ngày trong tuần."
                            action={
                                <Button onClick={openAdd} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Thêm khung giờ
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <>
                        <div className="manager-panel grid grid-cols-2 overflow-hidden sm:grid-cols-4">
                            {[
                                ['Mở sớm nhất', earliestOpen ?? '—'],
                                ['Đóng muộn nhất', latestClose ?? '—'],
                                ['Ngày hoạt động', `${coveredDays}/7`],
                                ['Khung dài hạn', permanentRules],
                            ].map(([label, value], index) => (
                                <div key={label} className={`px-5 py-4 ${index % 2 ? 'border-l' : ''} ${index > 1 ? 'border-t sm:border-t-0' : ''} sm:border-l sm:first:border-l-0`}>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                                    <p className="mt-1 font-mono text-xl font-bold text-foreground">{value}</p>
                                </div>
                            ))}
                        </div>

                        <Card className="overflow-hidden" aria-label="Lịch giờ mở cửa theo từng ngày trong tuần. Mỗi thanh hiển thị khoảng thời gian sân nhận đặt.">
                            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                                        <h2 className="font-semibold text-foreground">Nhịp vận hành trong tuần</h2>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">Mỗi thanh biểu diễn thời gian sân nhận đặt trong một ngày.</p>
                                </div>
                            </div>

                            <div className="divide-y">
                                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                    <div key={day} className="flex gap-3 px-4 py-3 sm:px-5">
                                        <div className="w-20 shrink-0 pt-1 sm:w-24">
                                            <p className="text-sm font-semibold text-foreground">{DAY_FULL[day]}</p>
                                            <p className="text-xs text-muted-foreground">{rulesByDay[day].length > 0 ? `${rulesByDay[day].length} khung` : 'Đóng cửa'}</p>
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            {rulesByDay[day].length === 0 ? (
                                                <div className="mt-1 h-8 rounded-slot border border-dashed bg-muted" />
                                            ) : rulesByDay[day].map((rule) => {
                                                const left = (toMinutes(rule.open_local) / 1440) * 100;
                                                const width = ((toMinutes(rule.close_local) - toMinutes(rule.open_local)) / 1440) * 100;
                                                return (
                                                    <div key={rule.id} className="relative h-8 overflow-hidden rounded-slot bg-muted">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => openEdit(rule)}
                                                            className="absolute inset-y-0 min-w-16 rounded-slot px-2 font-num text-xs shadow-flat sm:min-w-20"
                                                            style={{ left: `${left}%`, width: `${width}%` }}
                                                            aria-label={`Sửa khung giờ ${rule.open_local} đến ${rule.close_local} vào ${DAY_FULL[day]}`}
                                                        >
                                                            {rule.open_local}–{rule.close_local}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <section>
                            <div className="mb-3 flex items-end justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-foreground">Giai đoạn hiệu lực</h2>
                                    <p className="text-sm text-muted-foreground">Quản lý lịch dài hạn, lịch mùa vụ hoặc lịch tạm thời.</p>
                                </div>
                                <Badge variant="secondary">{rules.length} quy tắc</Badge>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {sortedRules.map((rule) => (
                                    <Card key={rule.id} className="group p-6 transition-colors hover:bg-muted">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-mono text-lg font-bold text-foreground">{rule.open_local}–{rule.close_local}</p>
                                                <p className="mt-1 truncate text-sm font-medium text-foreground">{dayLabel(rule.weekday)}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>Sửa</Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(rule)} aria-label="Xóa khung giờ">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                            {rule.effective_from && <>Từ {rule.effective_from}</>}
                                            {rule.effective_to && <> đến {rule.effective_to}</>}
                                            {!rule.effective_from && !rule.effective_to && 'Áp dụng vô thời hạn'}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </PageContainer>

            <ConfirmActionDialog
                open={deleteTarget !== null}
                onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}
                onConfirm={remove}
                title="Xóa khung giờ mở cửa"
                description={deleteTarget ? `Khung giờ ${deleteTarget.open_local}–${deleteTarget.close_local} (${dayLabel(deleteTarget.weekday)}) sẽ bị xóa. Lịch trống có thể thay đổi ngay sau thao tác này.` : ''}
                confirmLabel="Xóa khung giờ"
                processingLabel="Đang xóa…"
                processing={deleteProcessing}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Sửa khung giờ' : 'Thêm khung giờ mở cửa'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">Ngày trong tuần</legend>
                            <div className="flex justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={selectAllDays} className="h-auto text-xs">
                                    Chọn tất cả
                                </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                    <div key={d} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`weekday-${d}`}
                                            checked={form.data.weekday.includes(d)}
                                            onCheckedChange={() => toggleDay(d)}
                                        />
                                        <Label htmlFor={`weekday-${d}`}>{DAY_LABELS[d]}</Label>
                                    </div>
                                ))}
                            </div>
                            {form.errors.weekday && <p className="text-sm text-destructive">{form.errors.weekday}</p>}
                        </fieldset>

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
                                {form.errors.effective_to && <p className="text-sm text-destructive">{form.errors.effective_to}</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
