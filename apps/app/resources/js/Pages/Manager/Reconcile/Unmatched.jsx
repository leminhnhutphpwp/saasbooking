import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Label } from '@/Components/ui/label';
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
import { formatVND } from '@/lib/format';
import { GitBranch, CheckCircle2 } from 'lucide-react';

export default function Unmatched({ txns, pendingBookings }) {
    const [matchTxn, setMatchTxn] = useState(null);
    const [dismissTarget, setDismissTarget] = useState(null);
    const [dismissProcessing, setDismissProcessing] = useState(false);

    const form = useForm({ booking_uuid: '' });

    const openMatch = (txn) => {
        form.reset();
        form.clearErrors();
        setMatchTxn(txn);
    };

    const submitMatch = (e) => {
        e.preventDefault();
        form.post('/manager/reconcile/match', {
            data: { txn_id: matchTxn.id, booking_uuid: form.data.booking_uuid },
            preserveScroll: true,
            onSuccess: () => setMatchTxn(null),
        });
    };

    const dismissTxn = () => {
        if (!dismissTarget) return;

        setDismissProcessing(true);
        router.post(`/manager/reconcile/${dismissTarget.id}/dismiss`, {}, {
            preserveScroll: true,
            onSuccess: () => setDismissTarget(null),
            onFinish: () => setDismissProcessing(false),
        });
    };

    const unmatched = txns.filter((t) => t.note);
    const fresh = txns.filter((t) => !t.note);

    return (
        <ManagerLayout>
            <Head title="Đối soát tay" />

            <PageContainer>
                <PageHeader
                    title="Đối soát tay"
                    description={`${txns.length} giao dịch cần xử lý · Ghép giao dịch ngân hàng với đơn đặt sân`}
                />

                {txns.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Không có giao dịch cần đối soát"
                        description="Tất cả giao dịch ngân hàng đã được khớp tự động hoặc không có giao dịch mới."
                    />
                ) : (
                    <div className="space-y-6">
                        {unmatched.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                                        <GitBranch className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Cần đối soát
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">{unmatched.length}</Badge>
                                </div>
                                <Card className="overflow-hidden">
                                    <div className="divide-y">
                                        {unmatched.map((t) => (
                                            <div key={t.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-bold text-primary">{formatVND(t.amount)}</span>
                                                        <span className="font-mono text-sm text-muted-foreground">{t.memo}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>{t.received_at}</span>
                                                        {t.note && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {t.note}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex w-full gap-2 sm:w-auto">
                                                    <Button className="flex-1 sm:flex-none" variant="outline" size="sm" onClick={() => openMatch(t)}>
                                                        Đối soát
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground sm:flex-none" onClick={() => setDismissTarget(t)}>
                                                        Bỏ qua
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </section>
                        )}

                        {fresh.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <GitBranch className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Chờ xử lý
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">{fresh.length}</Badge>
                                </div>
                                <Card className="overflow-hidden">
                                    <div className="divide-y">
                                        {fresh.map((t) => (
                                            <div key={t.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-bold text-foreground">{formatVND(t.amount)}</span>
                                                        <span className="font-mono text-sm text-muted-foreground">{t.memo}</span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {t.received_at}
                                                    </div>
                                                </div>
                                                <div className="flex w-full gap-2 sm:w-auto">
                                                    <Button className="flex-1 sm:flex-none" variant="outline" size="sm" onClick={() => openMatch(t)}>
                                                        Đối soát
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground sm:flex-none" onClick={() => setDismissTarget(t)}>
                                                        Bỏ qua
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </section>
                        )}
                    </div>
                )}
            </PageContainer>

            <ConfirmActionDialog
                open={dismissTarget !== null}
                onOpenChange={(nextOpen) => !nextOpen && setDismissTarget(null)}
                onConfirm={dismissTxn}
                title="Bỏ qua giao dịch"
                description={dismissTarget ? `Giao dịch ${formatVND(dismissTarget.amount)} với nội dung “${dismissTarget.memo}” sẽ được loại khỏi danh sách cần đối soát. Chỉ thực hiện khi bạn chắc chắn giao dịch này không thuộc đơn đặt sân nào.` : ''}
                confirmLabel="Bỏ qua giao dịch"
                processingLabel="Đang bỏ qua…"
                processing={dismissProcessing}
            />

            <Dialog open={matchTxn !== null} onOpenChange={(o) => !o && setMatchTxn(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Đối soát giao dịch</DialogTitle>
                    </DialogHeader>

                    {matchTxn && (
                        <form onSubmit={submitMatch} className="space-y-4">
                            <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                                <div className="space-y-1.5">
                                    <p>
                                        <span className="text-muted-foreground">Số tiền:</span>{' '}
                                        <strong className="text-primary">{formatVND(matchTxn.amount)}</strong>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">Nội dung:</span>{' '}
                                        <span className="font-mono">{matchTxn.memo}</span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">Ngày:</span> {matchTxn.received_at}
                                    </p>
                                    {matchTxn.note && (
                                        <p>
                                            <span className="text-muted-foreground">Ghi chú:</span> {matchTxn.note}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Chọn đơn đặt sân chờ cọc</Label>
                                <Select
                                    value={form.data.booking_uuid}
                                    onValueChange={(v) => form.setData('booking_uuid', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn đơn đặt sân..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pendingBookings.map((b) => (
                                            <SelectItem key={b.uuid} value={b.uuid}>
                                                {b.code} — {b.customer_name} ({b.customer_phone}) —{' '}
                                                {formatVND(b.deposit_amount)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.booking_uuid && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.booking_uuid}
                                    </p>
                                )}
                            </div>

                            {pendingBookings.length === 0 && (
                                <p className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                                    Không có đơn nào đang chờ cọc để đối soát.
                                </p>
                            )}

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={form.processing || pendingBookings.length === 0}
                                >
                                    Xác nhận đối soát
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </ManagerLayout>
    );
}
