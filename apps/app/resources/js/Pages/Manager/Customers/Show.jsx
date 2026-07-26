import { Head, Link } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { formatVND, formatDate, formatTime } from '@/lib/format';
import { ArrowLeft, Phone, Mail, CalendarDays, TrendingUp, XCircle, Clock } from 'lucide-react';

const STATUS_MAP = {
    confirmed: { label: 'Đã xác nhận', variant: 'default' },
    pending_deposit: { label: 'Chờ cọc', variant: 'secondary' },
    cancelled: { label: 'Đã hủy', variant: 'outline' },
    expired: { label: 'Hết hạn', variant: 'outline' },
    completed: { label: 'Hoàn thành', variant: 'default' },
    no_show: { label: 'Bom sân', variant: 'destructive' },
};

export default function Show({ customer, stats, bookings }) {
    return (
        <ManagerLayout>
            <Head title={`${customer.name || customer.phone} — Khách hàng`} />

            <PageContainer>
                <div className="mb-4">
                    <Link
                        href={route('manager.customers.index')}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách
                    </Link>
                </div>

                <PageHeader
                    title={customer.name || 'Chưa cập nhật tên'}
                    description={`Mã KH: ${customer.uuid}`}
                />

                {/* Contact info */}
                <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {customer.phone}
                    </span>
                    {customer.email && (
                        <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            {customer.email}
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Tổng đặt sân</div>
                            <div className="mt-1 text-2xl font-bold">{stats.total_bookings}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Sắp tới</div>
                            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.upcoming}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Đã xác nhận</div>
                            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completed}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-xs text-muted-foreground">Bom sân</div>
                            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.no_shows}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Booking history */}
                <h3 className="mb-3 text-lg font-semibold">Lịch sử đặt sân</h3>
                {bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có đặt sân nào.</p>
                ) : (
                    <div className="space-y-3">
                        {bookings.map((b) => {
                            const status = STATUS_MAP[b.status] || { label: b.status, variant: 'secondary' };
                            const firstSlot = b.slots?.[0];
                            return (
                                <div
                                    key={b.id}
                                    className="flex items-center justify-between rounded-lg border border-border p-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-semibold">{b.code}</span>
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                        {firstSlot && (
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {formatDate(firstSlot.start_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatTime(firstSlot.start_at)} – {formatTime(firstSlot.end_at)}
                                                </span>
                                                {firstSlot.court_name && (
                                                    <span>· {firstSlot.court_name}</span>
                                                )}
                                            </div>
                                        )}
                                        {b.slots?.length > 1 && (
                                            <div className="text-xs text-muted-foreground">
                                                +{b.slots.length - 1} slot khác
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">{formatVND(b.total_amount)}</div>
                                        {b.deposit_amount > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                Cọc: {formatVND(b.deposit_amount)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </PageContainer>
        </ManagerLayout>
    );
}
