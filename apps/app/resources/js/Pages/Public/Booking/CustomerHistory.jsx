import { Head, router } from '@inertiajs/react';
import { formatVND } from '@/lib/format';
import { CalendarDays, MapPin, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const STATUS_MAP = {
    pending_deposit: { label: 'Chờ thanh toán', icon: Clock, color: '#f59e0b' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, color: '#22c55e' },
    cancelled: { label: 'Đã hủy', icon: XCircle, color: '#ef4444' },
    expired: { label: 'Hết hạn', icon: XCircle, color: '#9ca3af' },
    no_show: { label: 'Không đến', icon: XCircle, color: '#ef4444' },
    completed: { label: 'Hoàn thành', icon: CheckCircle, color: '#22c55e' },
};

export default function CustomerHistory({ tenant, customer, bookings }) {
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f4f3f0' }}>
            <Head title={`Lịch sử đặt sân — ${customer.name}`} />
            <style>{`:root { --brand: ${pc}; }`}</style>

            {/* Header */}
            <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
                    <button
                        onClick={() => router.visit(`/book/${tenant.slug}`)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{tenant.name}</h1>
                        <p className="text-xs text-gray-500">Lịch sử đặt sân của {customer.name}</p>
                    </div>
                </div>
            </div>

            {/* Customer info */}
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${pc}12` }}>
                            <span className="text-sm font-bold" style={{ color: pc }}>{customer.name?.charAt(0)}</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-xs text-gray-400">Mã khách hàng</p>
                            <p className="font-mono text-sm font-bold" style={{ color: pc }}>{customer.code}</p>
                        </div>
                    </div>
                </div>

                {/* Bookings list */}
                <div className="space-y-3">
                    {bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Chưa có lịch sử đặt sân</p>
                        </div>
                    ) : (
                        bookings.map((booking) => {
                            const status = STATUS_MAP[booking.status] || STATUS_MAP.pending_deposit;
                            const Icon = status.icon;
                            return (
                                <div key={booking.code} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-5 h-5" style={{ color: status.color }} />
                                            <span className="font-medium text-sm" style={{ color: status.color }}>{status.label}</span>
                                        </div>
                                        <span className="font-mono text-xs text-gray-400">{booking.code}</span>
                                    </div>
                                    {booking.slots?.map((slot, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{slot.court_name}</span>
                                            <span className="text-gray-400">•</span>
                                            <span>{new Date(slot.start_at).toLocaleDateString('vi-VN')}</span>
                                            <span className="text-gray-400">•</span>
                                            <span>{slot.start_at?.slice(11, 16)} - {slot.end_at?.slice(11, 16)}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                        <span className="text-sm text-gray-500">Tổng cộng</span>
                                        <span className="font-bold" style={{ color: pc }}>{formatVND(booking.total)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
