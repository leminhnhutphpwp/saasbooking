import { Head, router } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/StatusBadge';
import { EmptyState } from '@/Components/EmptyState';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { formatVND, formatDate } from '@/lib/format';
import { Banknote, PartyPopper } from 'lucide-react';

const REASON = {
    customer_cancel: 'Khách hủy',
    race_lost: 'Mất slot (đã trả tiền)',
    owner_cancel: 'Chủ sân hủy',
    no_show_policy: 'Bom sân',
};

export default function Index({ refunds }) {
    const markDone = (uuid, code) => {
        if (confirm(`Đã chuyển khoản hoàn cọc cho ${code}?`)) {
            router.post(`/manager/refunds/${uuid}/done`, {}, { preserveScroll: true });
        }
    };

    return (
        <ManagerLayout header={<h2 className="text-sm font-medium text-muted-foreground">Hoàn cọc</h2>}>
            <Head title="Hoàn cọc" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                <PageHeader
                    title="Hoàn cọc chờ xử lý"
                    description={`${refunds.length} khoản chờ chuyển khoản trả khách.`}
                />

                <Card className="divide-y overflow-hidden">
                    {refunds.length === 0 ? (
                        <EmptyState
                            icon={PartyPopper}
                            title="Không có hoàn cọc nào chờ xử lý"
                            description="Tất cả các khoản hoàn cọc đã được xử lý xong."
                        />
                    ) : (
                        refunds.map((r) => (
                            <div key={r.uuid} className="flex items-center justify-between gap-4 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 font-medium">
                                            {formatVND(r.amount)}
                                            <span className="font-mono text-sm text-muted-foreground">{r.code}</span>
                                            <StatusBadge type="refund" value="requested" />
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {r.phone} · {REASON[r.reason] ?? r.reason} · {formatDate(r.requested_at)}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => markDone(r.uuid, r.code)}>
                                    Đã chuyển khoản
                                </Button>
                            </div>
                        ))
                    )}
                </Card>
            </div>
        </ManagerLayout>
    );
}
