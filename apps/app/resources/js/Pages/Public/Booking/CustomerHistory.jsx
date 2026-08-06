import { Head, router } from '@inertiajs/react';
import { formatVND } from '@/lib/format';
import { CalendarDays, MapPin, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import PublicBookingLayout from '@/Layouts/PublicBookingLayout';

const STATUS_MAP = {
    pending_deposit: { label: 'Chờ thanh toán', icon: Clock, color: 'text-warning' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, color: 'text-success' },
    cancelled: { label: 'Đã hủy', icon: XCircle, color: 'text-destructive' },
    expired: { label: 'Hết hạn', icon: XCircle, color: 'text-muted-foreground' },
    no_show: { label: 'Không đến', icon: XCircle, color: 'text-destructive' },
    completed: { label: 'Hoàn thành', icon: CheckCircle, color: 'text-success' },
};

export default function CustomerHistory({ tenant, customer, bookings }) {
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || 'hsl(16 100% 60%)';

    return (
        <PublicBookingLayout>
            <Head title={`Lịch sử đặt sân — ${customer.name}`} />

            <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.visit(`/book/${tenant.slug}`)}
                        aria-label="Quay lại đặt sân"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="truncate text-lg font-bold text-foreground">{tenant.name}</h1>
                        <p className="text-xs text-muted-foreground">Lịch sử đặt sân của {customer.name}</p>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
                <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${pc}12` }}>
                            <span className="text-sm font-bold" style={{ color: pc }}>{customer.name?.charAt(0)}</span>
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-xs text-muted-foreground">Mã khách hàng</p>
                            <p className="font-mono text-sm font-bold" style={{ color: pc }}>{customer.code}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarDays className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground">Chưa có lịch sử đặt sân</p>
                        </div>
                    ) : (
                        bookings.map((booking) => {
                            const status = STATUS_MAP[booking.status] || STATUS_MAP.pending_deposit;
                            const Icon = status.icon;
                            return (
                                <div key={booking.code} className="rounded-xl border bg-card p-4 shadow-sm">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`h-5 w-5 ${status.color}`} />
                                            <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                                        </div>
                                        <span className="font-mono text-xs text-muted-foreground">{booking.code}</span>
                                    </div>
                                    {booking.slots?.map((slot, i) => (
                                        <div key={i} className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-muted-foreground">
                                            <MapPin className="h-4 w-4 shrink-0" />
                                            <span>{slot.court_name}</span>
                                            <span aria-hidden="true">•</span>
                                            <span>{new Date(slot.start_at).toLocaleDateString('vi-VN')}</span>
                                            <span aria-hidden="true">•</span>
                                            <span>{slot.start_at?.slice(11, 16)} - {slot.end_at?.slice(11, 16)}</span>
                                        </div>
                                    ))}
                                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                                        <span className="text-sm text-muted-foreground">Tổng cộng</span>
                                        <span className="font-bold" style={{ color: pc }}>{formatVND(booking.total)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </PublicBookingLayout>
    );
}
