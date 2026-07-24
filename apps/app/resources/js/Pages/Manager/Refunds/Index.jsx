import { Head, router } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
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
        <ManagerLayout>
            <Head title="Hoàn cọc" />

            <PageContainer>
                <PageHeader
                    title="Hoàn cọc chờ xử lý"
                    description={`${refunds.length} khoản chờ chuyển khoản trả khách.`}
                />

                <Card className="overflow-hidden">
                    {refunds.length === 0 ? (
                        <EmptyState
                            icon={PartyPopper}
                            title="Không có hoàn cọc nào chờ xử lý"
                            description="Tất cả các khoản hoàn cọc đã được xử lý xong."
                        />
                    ) : (
                        <div className="divide-y">
                            {refunds.map((r) => (
                                <div key={r.uuid} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                                            <Banknote className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{formatVND(r.amount)}</span>
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
                            ))}
                        </div>
                    )}
                </Card>
            </PageContainer>
        </ManagerLayout>
    );
}
