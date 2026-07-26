import { Head, Link, router } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { formatVND, formatDate, formatTime } from '@/lib/format';
import { ArrowLeft, User, Phone, CalendarDays, Clock, MapPin, CreditCard } from 'lucide-react';

const STATUS_MAP = {
    confirmed: { label: 'Đã xác nhận', variant: 'default' },
    pending_deposit: { label: 'Chờ cọc', variant: 'secondary' },
    cancelled: { label: 'Đã hủy', variant: 'outline' },
    expired: { label: 'Hết hạn', variant: 'outline' },
    completed: { label: 'Hoàn thành', variant: 'default' },
    no_show: { label: 'Bom sân', variant: 'destructive' },
};

const ACTIONS = {
    pending_deposit: [
        { action: 'check_in', label: 'Check-in', variant: 'default' },
        { action: 'cancel', label: 'Hủy', variant: 'destructive' },
    ],
    confirmed: [
        { action: 'complete', label: 'Hoàn thành', variant: 'default' },
        { action: 'no_show', label: 'Bom sân', variant: 'destructive' },
        { action: 'cancel', label: 'Hủy', variant: 'outline' },
    ],
};

export default function Show({ booking }) {
    const status = STATUS_MAP[booking.status] ?? { label: booking.status, variant: 'secondary' };
    const actions = ACTIONS[booking.status] ?? [];

    const handleAction = (action) => {
        if (!confirm(`Xác nhận "${action}" cho đặt sân ${booking.code}?`)) return;
        router.patch(route('manager.bookings.status', booking.uuid), { action }, { preserveScroll: true });
    };

    return (
        <ManagerLayout>
            <Head title={`${booking.code} — Đặt sân`} />
            <PageContainer>
                <div className="mb-4">
                    <Link href={route('manager.bookings.index')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
                    </Link>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <PageHeader title={`Đặt sân ${booking.code}`} description="" />
                    <Badge variant={status.variant} className="text-sm">{status.label}</Badge>
                </div>

                {actions.length > 0 && (
                    <div className="mb-6 flex gap-2">
                        {actions.map((a) => (
                            <Button
                                key={a.action}
                                variant={a.variant}
                                size="sm"
                                onClick={() => handleAction(a.action)}
                            >
                                {a.label}
                            </Button>
                        ))}
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Customer info */}
                    <Card>
                        <CardContent className="p-5">
                            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Khách hàng</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{booking.customer?.name || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{booking.customer?.phone}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment info */}
                    <Card>
                        <CardContent className="p-5">
                            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Thanh toán</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Tổng tiền</span>
                                    <span className="font-semibold">{formatVND(booking.total_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cọc</span>
                                    <span>{formatVND(booking.deposit_amount)}</span>
                                </div>
                                {booking.payments?.length > 0 && (
                                    <div className="mt-2 border-t border-border pt-2">
                                        {booking.payments.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    {p.method} · {p.status}
                                                </span>
                                                <span>{formatVND(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Slots */}
                <h3 className="mb-3 mt-6 text-lg font-semibold">Lịch hẹn</h3>
                <div className="space-y-3">
                    {booking.slots?.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{s.court?.name || '—'}</div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {formatDate(s.start_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatTime(s.start_at)} – {formatTime(s.end_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageContainer>
        </ManagerLayout>
    );
}
