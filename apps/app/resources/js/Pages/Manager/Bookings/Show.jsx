import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { ConfirmActionDialog } from '@/Components/ConfirmActionDialog';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { formatDateTime, formatVND } from '@/lib/format';
import { CalendarDays, CreditCard, UserRound } from 'lucide-react';

const actions = {
    pending_deposit: [['check_in', 'Nhận khách'], ['cancel', 'Hủy đơn']],
    confirmed: [['check_in', 'Nhận khách'], ['complete', 'Hoàn tất'], ['no_show', 'Báo bom sân'], ['cancel', 'Hủy đơn']],
};
const actionLabels = { check_in: 'Nhận khách', complete: 'Hoàn tất đơn', no_show: 'Báo khách bom sân', cancel: 'Hủy đơn' };

export default function Show({ booking }) {
    const [target, setTarget] = useState(null);
    const [processing, setProcessing] = useState(false);
    const submitStatus = () => {
        if (!target) return;
        setProcessing(true);
        router.patch(route('manager.bookings.status', booking.uuid), { action: target }, { preserveScroll: true, onSuccess: () => setTarget(null), onFinish: () => setProcessing(false) });
    };
    const bookingActions = actions[booking.status] ?? [];

    return <ManagerLayout>
        <Head title={`Đơn ${booking.code}`} />
        <PageContainer>
            <PageHeader backHref={route('manager.bookings.index')} backLabel="Danh sách đơn" title={`Đơn ${booking.code}`} description={`Tạo lúc ${formatDateTime(booking.created_at)}`} actions={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">{bookingActions.map(([value, label]) => <Button key={value} className="h-11 w-full sm:h-auto sm:w-auto" variant={value === 'cancel' || value === 'no_show' ? 'outline' : 'default'} onClick={() => setTarget(value)}>{label}</Button>)}</div>} />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-muted-foreground" />Lịch đặt <StatusBadge type="booking" value={booking.status} /></CardTitle></CardHeader><CardContent className="space-y-3">{booking.slots?.map((slot) => <div key={slot.id} className="manager-well p-4"><p className="font-semibold">{slot.court?.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatDateTime(slot.start_at)} - {formatDateTime(slot.end_at).split(' · ')[0]}</p></div>)}</CardContent></Card>
                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-muted-foreground" />Thanh toán</CardTitle></CardHeader><CardContent className="space-y-4"><div className="manager-well grid grid-cols-2 gap-3 p-4"><div><p className="text-sm text-muted-foreground">Tổng tiền</p><p className="manager-metric">{formatVND(booking.total_amount)}</p></div><div><p className="text-sm text-muted-foreground">Tiền cọc</p><p className="manager-metric">{formatVND(booking.deposit_amount)}</p></div></div>{booking.payments?.length ? <><div className="hidden overflow-x-auto sm:block"><Table aria-label="Lịch sử thanh toán"><TableHeader><TableRow><TableHead>Phương thức</TableHead><TableHead>Mã tham chiếu</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Số tiền</TableHead></TableRow></TableHeader><TableBody>{booking.payments.map((payment) => <TableRow key={payment.uuid}><TableCell className="font-medium text-foreground">{payment.method}</TableCell><TableCell className="text-muted-foreground">{payment.memo_ref || 'Không có mã tham chiếu'}</TableCell><TableCell><StatusBadge type="payment" value={payment.status} /></TableCell><TableCell className="num text-right font-semibold text-foreground">{formatVND(payment.amount)}</TableCell></TableRow>)}</TableBody></Table></div><dl className="space-y-3 sm:hidden">{booking.payments.map((payment) => <div key={payment.uuid} className="manager-well p-4"><div className="flex items-start justify-between gap-3"><div><dt className="font-medium text-foreground">{payment.method}</dt><dd className="mt-1 text-xs text-muted-foreground">{payment.memo_ref || 'Không có mã tham chiếu'}</dd></div><dd className="num font-semibold text-foreground">{formatVND(payment.amount)}</dd></div><div className="mt-3"><StatusBadge type="payment" value={payment.status} /></div></div>)}</dl></> : <p className="text-sm text-muted-foreground">Chưa có giao dịch thanh toán.</p>}</CardContent></Card>
                </div>
                <Card className="h-fit"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-muted-foreground" />Khách hàng</CardTitle></CardHeader><CardContent className="space-y-2"><p className="font-semibold">{booking.customer?.name || 'Khách chưa đặt tên'}</p><p className="text-sm text-muted-foreground">{booking.customer?.phone}</p>{booking.customer?.email && <p className="text-sm text-muted-foreground">{booking.customer.email}</p>} {booking.customer?.uuid && <Button asChild variant="outline" className="mt-3 w-full"><Link href={route('manager.customers.show', booking.customer.uuid)}>Xem hồ sơ khách</Link></Button>}</CardContent></Card>
            </div>
        </PageContainer>
        <ConfirmActionDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)} onConfirm={submitStatus} title={target ? actionLabels[target] : ''} description={target ? `Xác nhận ${actionLabels[target].toLowerCase()} cho đơn ${booking.code}.` : ''} confirmLabel={target ? actionLabels[target] : 'Xác nhận'} processing={processing} variant={target === 'cancel' || target === 'no_show' ? 'destructive' : 'default'} />
    </ManagerLayout>;
}
