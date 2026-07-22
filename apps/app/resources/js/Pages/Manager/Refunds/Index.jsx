import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';

const REASON = {
    customer_cancel: 'Khách hủy',
    race_lost: 'Mất slot (đã trả tiền)',
    owner_cancel: 'Chủ sân hủy',
    no_show_policy: 'Bom sân',
};

export default function Index({ refunds }) {
    const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

    const markDone = (uuid, code) => {
        if (confirm(`Đã chuyển khoản hoàn cọc cho ${code}?`)) {
            router.post(`/manager/refunds/${uuid}/done`, {}, { preserveScroll: true });
        }
    };

    const ago = (iso) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '');

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Hoàn cọc chờ xử lý</h2>}>
            <Head title="Hoàn cọc" />

            <div className="mx-auto max-w-3xl p-4 sm:p-6">
                <p className="mb-4 text-sm text-muted-foreground">
                    {refunds.length} khoản chờ chuyển khoản trả khách.
                </p>

                <div className="divide-y rounded-lg border bg-card">
                    {refunds.length === 0 && (
                        <p className="p-6 text-center text-sm text-muted-foreground">Không có hoàn cọc nào chờ xử lý. 🎉</p>
                    )}
                    {refunds.map((r) => (
                        <div key={r.uuid} className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-medium">{vnd(r.amount)} · <span className="font-mono">{r.code}</span></div>
                                <div className="text-sm text-muted-foreground">
                                    {r.phone} · {REASON[r.reason] ?? r.reason} · {ago(r.requested_at)}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => markDone(r.uuid, r.code)}>
                                Đã chuyển khoản
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
