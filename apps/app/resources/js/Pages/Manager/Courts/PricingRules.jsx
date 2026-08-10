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
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { formatVND } from '@/lib/format';
import { Trash2, Plus, AlertCircle, DollarSign, Info, CalendarDays, Clock3 } from 'lucide-react';

const DAY_LABELS = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };

function getTierLabel(rule) {
    const days = [...rule.weekday].sort((a, b) => a - b);
    const isWeekend = days.length === 2 && days[0] === 6 && days[1] === 7;
    const isWeekday = days.length === 5 && days[0] === 1 && days[4] === 5;
    const isAllDays = days.length === 7 && days[0] === 1 && days[6] === 7;

    if (isAllDays) return 'Tất cả';
    if (isWeekend) return 'Cuối tuần';
    if (isWeekday) return 'Ngày thường';
    return rule.weekday.map((d) => DAY_LABELS[d]).join(', ');
}

function getTierVariant(rule) {
    const days = [...rule.weekday].sort((a, b) => a - b);
    const isWeekend = days.length === 2 && days[0] === 6 && days[1] === 7;
    return isWeekend ? 'secondary' : 'outline';
}

export default function PricingRules({ court, rules, venueRules = [], defaultPricePerHour = null }) {
    const [scope, setScope] = useState('court');
    const [formScope, setFormScope] = useState('court');
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
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
        setFormScope(scope);
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
        setFormScope(scope);
        setEditingId(rule.id);
        setOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (form.data.start_local >= form.data.end_local) return;
        const baseUrl = formScope === 'venue'
            ? '/manager/pricing-rules'
            : `/manager/courts/${court.uuid}/pricing-rules`;
        const url = editingId ? `${baseUrl}/${editingId}` : baseUrl;
        const method = editingId ? 'put' : 'post';

        form[method](url, {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); form.reset(); setEditingId(null); },
        });
    };

    const remove = () => {
        if (!deleteTarget) return;

        setDeleteProcessing(true);
        const baseUrl = deleteTarget.scope === 'venue'
            ? '/manager/pricing-rules'
            : `/manager/courts/${court.uuid}/pricing-rules`;
        router.delete(`${baseUrl}/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleteProcessing(false),
        });
    };

    const activeRules = scope === 'venue' ? venueRules : rules;
    const sortedRules = [...activeRules].sort((a, b) => {
        const aStart = a.start_local.localeCompare(b.start_local);
        if (aStart !== 0) return aStart;
        return (b.priority ?? 0) - (a.priority ?? 0);
    });
    const prices = activeRules.map((rule) => rule.price_per_hour);
    const coveredDays = new Set(activeRules.flatMap((rule) => rule.weekday)).size;
    const earliestStart = sortedRules[0]?.start_local ?? null;
    const latestEnd = activeRules.length > 0
        ? [...activeRules].sort((a, b) => b.end_local.localeCompare(a.end_local))[0].end_local
        : null;
    const timeError = form.data.start_local && form.data.end_local && form.data.start_local >= form.data.end_local
        ? 'Giờ kết thúc phải sau giờ bắt đầu.'
        : null;

    return (
        <ManagerLayout>
            <Head title={`Bảng giá — ${court.name}`} />

            <PageContainer>
                <PageHeader
                    title={`Bảng giá — ${court.name}`}
                    backHref="/manager/courts"
                    backLabel="Danh sách sân"
                    description="Dùng giá chung cho phần lớn sân, chỉ tạo giá riêng khi cần ngoại lệ"
                    actions={
                        <Button onClick={openAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm giá
                        </Button>
                    }
                />

                {(form.errors.start_local || form.errors.end_local) && (
                    <div className="manager-alert items-start p-3 text-sm">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                            <p className="font-medium">Không thể lưu bảng giá</p>
                            <p>{form.errors.start_local ?? form.errors.end_local}</p>
                        </div>
                    </div>
                )}

                <div className="manager-segment">
                    <Button type="button" size="sm" variant={scope === 'venue' ? 'default' : 'ghost'} onClick={() => setScope('venue')}>
                        Giá chung toàn cơ sở
                    </Button>
                    <Button type="button" size="sm" variant={scope === 'court' ? 'default' : 'ghost'} onClick={() => setScope('court')}>
                        Giá riêng — {court.name}
                    </Button>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-3">
                    <Card className="overflow-hidden xl:col-span-2">
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                            <div>
                                <h2 className="font-semibold text-foreground">Các mức giá đang áp dụng</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {activeRules.length > 0 ? `${activeRules.length} quy tắc được sắp theo giờ bắt đầu` : 'Chưa có quy tắc giá'}
                                </p>
                            </div>
                            {activeRules.length > 0 && <Badge variant="secondary">{activeRules.length} mức</Badge>}
                        </div>

                        {activeRules.length === 0 ? (
                            <EmptyState
                                title={scope === 'venue' ? 'Thiết lập giá chung để áp dụng cho tất cả sân.' : 'Thêm mức giá riêng khi sân này cần một ngoại lệ.'}
                                description={scope === 'venue' ? 'Thiết lập một lần để áp dụng cho tất cả sân.' : 'Chỉ thêm mức giá khác với giá chung toàn cơ sở.'}
                                action={
                                    <Button onClick={openAdd} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Thêm giá
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="divide-y">
                                {sortedRules.map((r) => (
                                    <div key={r.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant={getTierVariant(r)}>
                                                    {getTierLabel(r)}
                                                </Badge>
                                                {r.priority > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Ưu tiên {r.priority}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                                <div className="font-display text-xl font-bold tracking-tight text-foreground tabular-nums">
                                                    {formatVND(r.price_per_hour)}
                                                    <span className="ml-1 text-xs font-normal text-muted-foreground">/ giờ</span>
                                                </div>
                                                <div className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                                                    <Clock3 className="h-4 w-4" />
                                                    {r.start_local} – {r.end_local}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(r)}>Sửa</Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ ...r, scope })} aria-label="Xóa mức giá">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <aside className="space-y-4 xl:sticky xl:top-20">
                        <Card className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-inner bg-muted p-2.5 text-muted-foreground">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-foreground">Tổng quan giá</h2>
                                    <p className="text-xs text-muted-foreground">{scope === 'venue' ? 'Áp dụng cho mọi sân' : `Ngoại lệ cho ${court.name}`}</p>
                                </div>
                            </div>

                            <dl className="mt-5 grid grid-cols-2 gap-3">
                                <div className="manager-well p-3">
                                    <dt className="text-xs text-muted-foreground">Thấp nhất</dt>
                                    <dd className="mt-1 font-num text-sm font-bold text-foreground">
                                        {prices.length > 0 ? formatVND(Math.min(...prices)) : '—'}
                                    </dd>
                                </div>
                                <div className="manager-well p-3">
                                    <dt className="text-xs text-muted-foreground">Cao nhất</dt>
                                    <dd className="mt-1 font-num text-sm font-bold text-foreground">
                                        {prices.length > 0 ? formatVND(Math.max(...prices)) : '—'}
                                    </dd>
                                </div>
                                <div className="manager-well p-3">
                                    <dt className="text-xs text-muted-foreground">Ngày có giá</dt>
                                    <dd className="mt-1 flex items-center gap-1.5 font-num text-sm font-bold text-foreground">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        {coveredDays}/7 ngày
                                    </dd>
                                </div>
                                <div className="manager-well p-3">
                                    <dt className="text-xs text-muted-foreground">Khung giờ</dt>
                                    <dd className="mt-1 font-num text-sm font-bold text-foreground">
                                        {earliestStart && latestEnd ? `${earliestStart}–${latestEnd}` : '—'}
                                    </dd>
                                </div>
                            </dl>
                        </Card>

                        <Card className="p-5">
                            <div className="flex items-start gap-3">
                                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <div>
                                    <h2 className="font-semibold text-foreground">Cách hệ thống chọn giá</h2>
                                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                                        <li><strong className="text-foreground">1. Giá riêng:</strong> rule của {court.name} thắng giá chung.</li>
                                        <li><strong className="text-foreground">2. Giá chung:</strong> dùng cho mọi sân chưa có ngoại lệ.</li>
                                        <li><strong className="text-foreground">3. Giá mặc định:</strong> {defaultPricePerHour != null ? `${formatVND(defaultPricePerHour)} / giờ` : 'chưa thiết lập'}.</li>
                                        <li><strong className="text-foreground">Cùng phạm vi:</strong> priority lớn hơn dùng cho giờ cao điểm.</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </aside>
                </div>
            </PageContainer>

            <ConfirmActionDialog
                open={deleteTarget !== null}
                onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}
                onConfirm={remove}
                title="Xóa mức giá"
                description={deleteTarget ? `Mức giá ${formatVND(deleteTarget.price_per_hour)} từ ${deleteTarget.start_local} đến ${deleteTarget.end_local} sẽ bị xóa. Hành động này không thể hoàn tác.` : ''}
                confirmLabel="Xóa mức giá"
                processingLabel="Đang xóa…"
                processing={deleteProcessing}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Sửa bảng giá' : 'Thêm bảng giá'} · {formScope === 'venue' ? 'Toàn cơ sở' : court.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">Ngày trong tuần</legend>
                            <div className="flex justify-end">
                                <div className="flex gap-1">
                                    <Button type="button" variant="ghost" size="sm" onClick={selectAllDays} className="h-auto text-xs">
                                        Tất cả
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={selectWeekdays} className="h-auto text-xs">
                                        Ngày thường
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={selectWeekend} className="h-auto text-xs">
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
                                        aria-pressed={form.data.weekday.includes(d)}
                                        className={`rounded-pill px-3 py-2 text-sm font-medium transition-colors ${
                                            form.data.weekday.includes(d)
                                                ? 'bg-primary text-primary-foreground shadow-flat'
                                                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                    >
                                        {DAY_LABELS[d]}
                                    </button>
                                ))}
                            </div>
                            {form.errors.weekday && <p className="text-sm text-destructive">{form.errors.weekday}</p>}
                        </fieldset>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="start">Từ giờ</Label>
                                <Input id="start" type="time" value={form.data.start_local} onChange={(e) => form.setData('start_local', e.target.value)} />
                                {form.errors.start_local && <p className="text-sm text-destructive">{form.errors.start_local}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="end">Đến giờ</Label>
                                <Input id="end" type="time" value={form.data.end_local} onChange={(e) => form.setData('end_local', e.target.value)} />
                                {(timeError || form.errors.end_local) && <p className="text-sm text-destructive">{timeError || form.errors.end_local}</p>}
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
                                    <p className="font-display text-xs text-muted-foreground tabular-nums">
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
                            <Button type="submit" disabled={form.processing || Boolean(timeError) || form.data.weekday.length === 0}>
                                {editingId ? 'Cập nhật' : 'Thêm'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
