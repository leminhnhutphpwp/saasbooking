import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Card } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { formatVND } from '@/lib/format';
import { CheckCircle2, GitBranch, Search } from 'lucide-react';

function formatSlotSummary(slots) {
    if (!slots || slots.length === 0) return '';
    const s = slots[0];
    const start = new Date(s.start_at);
    const end = new Date(s.end_at);
    if (Number.isNaN(start.getTime())) return '';
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const wd = weekdays[start.getDay()];
    const day = String(start.getDate()).padStart(2, '0');
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const startH = String(start.getHours()).padStart(2, '0');
    const startM = String(start.getMinutes()).padStart(2, '0');
    const endH = String(end.getHours()).padStart(2, '0');
    const endM = String(end.getMinutes()).padStart(2, '0');
    return `${wd} ${day}/${month} · ${startH}:${startM}-${endH}:${endM}`;
}

function TransactionTable({ transactions, onMatch, onDismiss }) {
    return (
        <Card className="p-3 sm:p-6">
            <table className="w-full text-sm" aria-label="Giao dịch ngân hàng cần đối soát">
                <thead className="hidden sm:table-header-group">
                    <tr>
                        <th scope="col" className="text-left">Nội dung chuyển khoản</th>
                        <th scope="col" className="text-left">Thời gian nhận</th>
                        <th scope="col" className="text-right">Số tiền</th>
                        <th scope="col"><span className="sr-only">Thao tác</span></th>
                    </tr>
                </thead>
                <tbody className="block sm:table-row-group">
                    {transactions.map((transaction) => (
                        <tr key={transaction.id} className="mb-3 block rounded-inner bg-sunk p-4 last:mb-0 sm:mb-0 sm:table-row sm:rounded-none sm:bg-transparent sm:p-0">
                            <td className="block px-0 py-0 sm:table-cell sm:px-3 sm:py-4">
                                <p className="break-words font-medium text-foreground">{transaction.memo}</p>
                                {transaction.note && <Badge variant="secondary" className="mt-2">{transaction.note}</Badge>}
                            </td>
                            <td className="mt-2 block px-0 py-0 text-muted-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4">{transaction.received_at}</td>
                            <td className="num mt-3 flex items-center justify-between px-0 py-0 font-semibold text-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4 sm:text-right">
                                <span className="manager-label text-muted-foreground sm:hidden">Số tiền</span>
                                {formatVND(transaction.amount)}
                            </td>
                            <td className="mt-3 flex flex-wrap gap-2 px-0 py-0 sm:mt-0 sm:table-cell sm:px-3 sm:py-4 sm:text-right">
                                <Button variant="outline" size="sm" onClick={() => onMatch(transaction)}>Đối soát</Button>
                                <Button variant="ghost" size="sm" onClick={() => onDismiss(transaction)}>Bỏ qua</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}

export default function Unmatched({ txns, candidates }) {
    const [matchTxn, setMatchTxn] = useState(null);
    const [dismissTarget, setDismissTarget] = useState(null);
    const [dismissProcessing, setDismissProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const form = useForm({ booking_uuid: '' });

    const filteredCandidates = useMemo(() => {
        if (!searchQuery.trim()) return candidates;
        const q = searchQuery.toLowerCase();
        return candidates.filter((c) =>
            c.code?.toLowerCase().includes(q) ||
            c.customer_name?.toLowerCase().includes(q) ||
            c.customer_phone?.includes(q)
        );
    }, [candidates, searchQuery]);

    const openMatch = (txn) => {
        form.reset();
        form.clearErrors();
        setSearchQuery('');
        setSelectedCandidate(null);
        setMatchTxn(txn);
    };
    const selectCandidate = (candidate) => {
        setSelectedCandidate(candidate);
        form.setData('booking_uuid', candidate.uuid);
    };
    const submitMatch = (event) => {
        event.preventDefault();
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
    const unmatched = txns.filter((transaction) => transaction.note);
    const fresh = txns.filter((transaction) => !transaction.note);

    return (
        <ManagerLayout>
            <Head title="Đối soát tay" />
            <PageContainer>
                <PageHeader title="Đối soát tay" description={`${txns.length} giao dịch cần xử lý · Ghép giao dịch ngân hàng với đơn đặt sân`} />
                {txns.length === 0 ? (
                    <Card>
                        <EmptyState variant="first-use" icon={CheckCircle2} title="Không có giao dịch cần đối soát" description="Tất cả giao dịch ngân hàng đã được khớp tự động hoặc không có giao dịch mới." />
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {unmatched.length > 0 && (
                            <section aria-labelledby="unmatched-heading" className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                                    <h2 id="unmatched-heading" className="text-sm font-semibold text-foreground">Cần đối soát</h2>
                                    <Badge variant="secondary">{unmatched.length}</Badge>
                                </div>
                                <TransactionTable transactions={unmatched} onMatch={openMatch} onDismiss={setDismissTarget} />
                            </section>
                        )}
                        {fresh.length > 0 && (
                            <section aria-labelledby="fresh-heading" className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                                    <h2 id="fresh-heading" className="text-sm font-semibold text-foreground">Chờ xử lý</h2>
                                    <Badge variant="secondary">{fresh.length}</Badge>
                                </div>
                                <TransactionTable transactions={fresh} onMatch={openMatch} onDismiss={setDismissTarget} />
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
                description={dismissTarget ? `Giao dịch ${formatVND(dismissTarget.amount)} với nội dung "${dismissTarget.memo}" sẽ được loại khỏi danh sách cần đối soát. Chỉ thực hiện khi bạn chắc chắn giao dịch này không thuộc đơn đặt sân nào.` : ''}
                confirmLabel="Bỏ qua giao dịch"
                processingLabel="Đang bỏ qua..."
                processing={dismissProcessing}
            />
            <Dialog open={matchTxn !== null} onOpenChange={(open) => !open && setMatchTxn(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Đối soát giao dịch</DialogTitle>
                    </DialogHeader>
                    {matchTxn && (
                        <form onSubmit={submitMatch} className="space-y-4">
                            <dl className="manager-well space-y-2 p-4 text-sm">
                                <div>
                                    <dt className="inline text-muted-foreground">Số tiền: </dt>
                                    <dd className="inline font-semibold tabular-nums text-foreground">{formatVND(matchTxn.amount)}</dd>
                                </div>
                                <div>
                                    <dt className="inline text-muted-foreground">Nội dung: </dt>
                                    <dd className="inline break-all font-mono text-foreground">{matchTxn.memo}</dd>
                                </div>
                                <div>
                                    <dt className="inline text-muted-foreground">Ngày: </dt>
                                    <dd className="inline text-foreground">{matchTxn.received_at}</dd>
                                </div>
                                {matchTxn.note && (
                                    <div>
                                        <dt className="inline text-muted-foreground">Ghi chú: </dt>
                                        <dd className="inline text-foreground">{matchTxn.note}</dd>
                                    </div>
                                )}
                            </dl>
                            {candidates.length === 0 ? (
                                <p className="manager-well p-3 text-sm text-muted-foreground">
                                    Không có booking nào chờ cọc. Tất cả đơn đặt sân đã được xác nhận hoặc chưa có cọc.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm theo mã đơn, tên hoặc số điện thoại..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <div className="max-h-60 space-y-2 overflow-y-auto">
                                        {filteredCandidates.length === 0 ? (
                                            <p className="py-4 text-center text-sm text-muted-foreground">
                                                Không tìm thấy booking phù hợp.
                                            </p>
                                        ) : (
                                            filteredCandidates.map((candidate) => (
                                                <button
                                                    key={candidate.uuid}
                                                    type="button"
                                                    onClick={() => selectCandidate(candidate)}
                                                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${selectedCandidate?.uuid === candidate.uuid ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-foreground">{candidate.code}</span>
                                                        <span className="num font-semibold text-foreground">{formatVND(candidate.expected_deposit)}</span>
                                                    </div>
                                                    <div className="mt-1 text-muted-foreground">
                                                        <span>{candidate.customer_name ?? 'Khách vãng lai'}</span>
                                                        {candidate.customer_phone && <span> · {candidate.customer_phone}</span>}
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">{formatSlotSummary(candidate.slot_summary)}</p>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            {selectedCandidate && (
                                <div className="manager-well p-3 text-sm">
                                    <p className="text-muted-foreground">
                                        Khớp giao dịch <span className="font-semibold text-foreground">{formatVND(matchTxn.amount)}</span> với booking <span className="font-semibold text-foreground">{selectedCandidate.code}</span>?
                                    </p>
                                </div>
                            )}
                            {form.errors.booking_uuid && <p className="text-sm text-destructive">{form.errors.booking_uuid}</p>}
                            <DialogFooter>
                                <Button type="submit" disabled={form.processing || !selectedCandidate}>
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
