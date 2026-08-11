import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { StatusBadge } from '@/Components/StatusBadge';
import { EmptyState } from '@/Components/EmptyState';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { formatVND, formatDate, formatTime } from '@/lib/format';
import { PartyPopper } from 'lucide-react';

const REASON = { customer_cancel: 'Khách hủy', race_lost: 'Mất slot (đã trả tiền)', owner_cancel: 'Chủ sân hủy', no_show_policy: 'Bom sân' };

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

export default function Index({ refunds }) {
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const markDone = () => { if (!confirmTarget) return; setProcessing(true); router.post(`/manager/refunds/${confirmTarget.uuid}/done`, {}, { preserveScroll: true, onSuccess: () => setConfirmTarget(null), onFinish: () => setProcessing(false) }); };

    return <ManagerLayout><Head title="Hoàn cọc" /><PageContainer><PageHeader title="Hoàn cọc chờ xử lý" description={`${refunds.length} khoản chờ chuyển khoản trả khách.`} />
        <Card className="p-3 sm:p-6">{refunds.length === 0 ? <EmptyState variant="first-use" icon={PartyPopper} title="Không có hoàn cọc nào chờ xử lý" description="Tất cả các khoản hoàn cọc đã được xử lý xong." /> : <table className="w-full text-sm" aria-label="Các khoản hoàn cọc chờ xử lý"><thead className="hidden sm:table-header-group"><tr><th scope="col" className="text-left">Đơn đặt</th><th scope="col" className="text-left">Khách hàng</th><th scope="col" className="text-left">Lý do</th><th scope="col" className="text-left">Yêu cầu lúc</th><th scope="col" className="text-right">Số tiền</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr></thead><tbody className="block sm:table-row-group">{refunds.map((refund) => <tr key={refund.uuid} className="mb-3 block rounded-inner bg-sunk p-4 last:mb-0 sm:mb-0 sm:table-row sm:rounded-none sm:bg-transparent sm:p-0"><td className="block px-0 py-0 sm:table-cell sm:px-3 sm:py-4"><button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => refund.booking_uuid && router.visit(`/manager/bookings/${refund.booking_uuid}`)}>{refund.booking_code}</button><p className="mt-1 text-xs text-muted-foreground">{formatSlotSummary(refund.slot_summary)}</p><div className="mt-1"><StatusBadge type="refund" value="requested" /></div></td><td className="mt-2 block px-0 py-0 sm:mt-0 sm:table-cell sm:px-3 sm:py-4"><p className="font-medium text-foreground">{refund.customer_name ?? 'Khách vãng lai'}</p>{refund.customer_phone && <p className="text-xs text-muted-foreground">{refund.customer_phone}</p>}</td><td className="mt-2 block px-0 py-0 text-muted-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4"><span className="manager-label sm:hidden">Lý do: </span>{REASON[refund.reason] ?? refund.reason}</td><td className="mt-2 block px-0 py-0 text-muted-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4"><p>{formatDate(refund.requested_at)}</p><p className="text-xs">{formatTime(refund.requested_at)}</p></td><td className="num mt-3 flex items-center justify-between px-0 py-0 font-semibold text-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4 sm:text-right"><span className="manager-label text-muted-foreground sm:hidden">Số tiền</span>{formatVND(refund.amount)}</td><td className="mt-3 block px-0 py-0 sm:mt-0 sm:table-cell sm:px-3 sm:py-4 sm:text-right"><Button variant="outline" size="sm" onClick={() => setConfirmTarget(refund)}>Đã chuyển khoản</Button></td></tr>)}</tbody></table>}</Card>
    </PageContainer><ConfirmActionDialog open={confirmTarget !== null} onOpenChange={(nextOpen) => !nextOpen && setConfirmTarget(null)} onConfirm={markDone} title="Xác nhận đã hoàn cọc" description={confirmTarget ? `Xác nhận bạn đã chuyển ${formatVND(confirmTarget.amount)} hoàn cọc cho đơn ${confirmTarget.booking_code}. Hệ thống sẽ đánh dấu khoản này là đã xử lý.` : ''} confirmLabel="Đã chuyển khoản" processingLabel="Đang xác nhận..." processing={processing} variant="default" /></ManagerLayout>;
}
