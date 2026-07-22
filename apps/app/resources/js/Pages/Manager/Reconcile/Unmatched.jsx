import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Label } from '@/Components/ui/label';
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

const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function Unmatched({ txns, pendingBookings }) {
    const [matchTxn, setMatchTxn] = useState(null);

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

    const dismissTxn = (id) => {
        if (confirm('Bỏ qua giao dịch này?')) {
            router.post(`/manager/reconcile/${id}/dismiss`, {}, { preserveScroll: true });
        }
    };

    const unmatched = txns.filter((t) => t.note);
    const fresh = txns.filter((t) => !t.note);

    return (
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Đối soát tay</h2>}
        >
            <Head title="Đối soát tay" />

            <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
                {unmatched.length > 0 && (
                    <section>
                        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                            Cần đối soát ({unmatched.length})
                        </h3>
                        <div className="divide-y rounded-lg border bg-card">
                            {unmatched.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4">
                                    <div className="space-y-0.5">
                                        <div className="font-medium">
                                            {vnd(t.amount)} ·{' '}
                                            <span className="font-mono text-sm">{t.memo}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {t.received_at}
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {t.note}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openMatch(t)}
                                        >
                                            Đối soát
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => dismissTxn(t.id)}
                                        >
                                            Bỏ qua
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {fresh.length > 0 && (
                    <section>
                        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                            Chờ xử lý ({fresh.length})
                        </h3>
                        <div className="divide-y rounded-lg border bg-card">
                            {fresh.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4">
                                    <div className="space-y-0.5">
                                        <div className="font-medium">
                                            {vnd(t.amount)} ·{' '}
                                            <span className="font-mono text-sm">{t.memo}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {t.received_at}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openMatch(t)}
                                        >
                                            Đối soát
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => dismissTxn(t.id)}
                                        >
                                            Bỏ qua
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {txns.length === 0 && (
                    <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
                        Không có giao dịch nào cần đối soát.
                    </div>
                )}
            </div>

            <Dialog open={matchTxn !== null} onOpenChange={(o) => !o && setMatchTxn(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Đối soát giao dịch</DialogTitle>
                    </DialogHeader>

                    {matchTxn && (
                        <form onSubmit={submitMatch} className="space-y-4">
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <p>
                                    <span className="font-medium">Số tiền:</span> {vnd(matchTxn.amount)}
                                </p>
                                <p>
                                    <span className="font-medium">Nội dung:</span> {matchTxn.memo}
                                </p>
                                <p>
                                    <span className="font-medium">Ngày:</span> {matchTxn.received_at}
                                </p>
                                {matchTxn.note && (
                                    <p>
                                        <span className="font-medium">Ghi chú:</span> {matchTxn.note}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
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
                                                {vnd(b.deposit_amount)}
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
                                <p className="text-sm text-muted-foreground">
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
