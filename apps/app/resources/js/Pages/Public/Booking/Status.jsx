import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { CheckCircle, Clock, Copy, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
    pending_deposit: { label: 'Chờ chuyển cọc', icon: Clock, variant: 'secondary' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, variant: 'default' },
    cancelled: { label: 'Đã hủy', icon: XCircle, variant: 'destructive' },
    expired: { label: 'Hết hạn', icon: XCircle, variant: 'outline' },
    no_show: { label: 'Không đến', icon: XCircle, variant: 'destructive' },
};

export default function Status({ tenant, booking, qr, account }) {
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    useEffect(() => {
        if (booking.status !== 'pending_deposit') return;
        const t = setInterval(() => router.reload({ only: ['booking'] }), 5000);
        return () => clearInterval(t);
    }, [booking.status]);

    const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending_deposit;
    const Icon = config.icon;

    const copyCode = () => {
        navigator.clipboard.writeText(booking.code);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Mã đặt ${booking.code}`} />

            {/* Header */}
            <div className="border-b bg-white" style={{ borderTopColor: pc, borderTopWidth: '3px' }}>
                <div className="mx-auto flex max-w-md items-center gap-3 p-4">
                    {brand.logo_path && (
                        <img src={`/storage/${brand.logo_path}`} alt={tenant.name} className="h-10 w-auto object-contain" />
                    )}
                    <h1 className="text-lg font-bold" style={{ color: pc }}>{tenant.name}</h1>
                </div>
            </div>

            <div className="mx-auto max-w-md p-4 text-center">
                {/* Booking code */}
                <div className="mb-4">
                    <p className="text-sm text-gray-500">Mã đặt sân</p>
                    <div className="mt-1 flex items-center justify-center gap-2">
                        <code className="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-lg font-bold">
                            {booking.code}
                        </code>
                        <button
                            onClick={copyCode}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Sao chép mã"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Status */}
                <Badge variant={config.variant} className="mb-4">
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                </Badge>

                {/* QR Code for deposit */}
                {booking.status === 'pending_deposit' && qr && (
                    <Card className="mt-4">
                        <CardContent className="p-5">
                            <QRCodeSVG value={qr} size={200} className="mx-auto" />

                            <div className="mt-4 space-y-2">
                                <div className="text-2xl font-bold" style={{ color: pc }}>
                                    {vnd(booking.deposit)}
                                </div>
                                <p className="text-sm text-gray-500">Số tiền cọc</p>
                            </div>

                            <div className="mt-4 rounded-lg bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">Nội dung chuyển khoản</p>
                                <p className="font-mono font-bold">{booking.code}</p>
                            </div>

                            {account && (
                                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                                    <p className="text-xs text-gray-500">Tài khoản nhận</p>
                                    <p className="font-medium">{account.name}</p>
                                    <p className="font-mono text-sm">{account.bank} — {account.number}</p>
                                </div>
                            )}

                            <p className="mt-4 text-xs text-gray-400">
                                Chuyển đúng số tiền + nội dung. Trang tự cập nhật khi nhận được cọc.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Confirmed state */}
                {booking.status === 'confirmed' && (
                    <Card className="mt-6 border-green-200 bg-green-50">
                        <CardContent className="p-5">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <p className="mt-2 text-lg font-bold text-green-700">Đã giữ sân thành công!</p>
                            <p className="mt-1 text-sm text-green-600">Bạn sẽ nhận thông báo xác nhận qua Zalo.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Cancelled/Expired/NoShow states */}
                {['cancelled', 'expired', 'no_show'].includes(booking.status) && (
                    <Card className="mt-6 border-red-200 bg-red-50">
                        <CardContent className="p-5">
                            <XCircle className="mx-auto h-12 w-12 text-red-400" />
                            <p className="mt-2 text-lg font-bold text-red-700">{config.label}</p>
                            <p className="mt-1 text-sm text-red-600">Vui lòng đặt sân lại nếu muốn tiếp tục.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
