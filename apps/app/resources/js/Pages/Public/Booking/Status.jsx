import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { formatVND } from '@/lib/format';
import { CheckCircle, Clock, Copy, XCircle, Loader2, Check } from 'lucide-react';

const STATUS_CONFIG = {
    pending_deposit: { label: 'Chờ chuyển cọc', icon: Clock, variant: 'secondary', desc: 'Chuyển khoản đúng số tiền + nội dung để giữ sân.' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, variant: 'default', desc: 'Sân đã được giữ cho bạn.' },
    cancelled: { label: 'Đã hủy', icon: XCircle, variant: 'destructive', desc: 'Đơn đặt sân đã bị hủy.' },
    expired: { label: 'Hết hạn', icon: XCircle, variant: 'outline', desc: 'Thời gian giữ chỗ đã hết hạn.' },
    no_show: { label: 'Không đến', icon: XCircle, variant: 'destructive', desc: 'Bạn không đến chơi.' },
};

export default function Status({ tenant, booking, qr, account }) {
    const [copied, setCopied] = useState(null);
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    useEffect(() => {
        if (booking.status !== 'pending_deposit') return;
        const t = setInterval(() => router.reload({ only: ['booking'] }), 5000);
        return () => clearInterval(t);
    }, [booking.status]);

    const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending_deposit;
    const Icon = config.icon;

    const copy = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Mã đặt ${booking.code}`} />

            <style>{`:root { --brand: ${pc}; }`}</style>

            <div className="border-b bg-white" style={{ borderTopColor: pc, borderTopWidth: '3px' }}>
                <div className="mx-auto flex max-w-md items-center gap-3 p-4">
                    {brand.logo_path && (
                        <img src={`/storage/${brand.logo_path}`} alt={tenant.name} className="h-10 w-auto rounded object-contain" />
                    )}
                    <h1 className="text-lg font-bold" style={{ color: pc }}>{tenant.name}</h1>
                </div>
            </div>

            <div className="mx-auto max-w-md space-y-4 p-4">
                <Card>
                    <CardContent className="p-5 text-center">
                        <div className="mb-3">
                            <p className="text-xs text-muted-foreground">Mã đặt sân</p>
                            <div className="mt-1 flex items-center justify-center gap-2">
                                <code className="rounded-lg bg-muted px-3 py-1.5 font-mono text-lg font-bold">
                                    {booking.code}
                                </code>
                                <button
                                    onClick={() => copy(booking.code, 'code')}
                                    className="rounded p-1 text-muted-foreground hover:bg-accent"
                                    title="Sao chép"
                                >
                                    {copied === 'code' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Badge variant={config.variant} className="gap-1.5 px-3 py-1">
                            <Icon className="h-3.5 w-3.5" />
                            {config.label}
                        </Badge>
                        <p className="mt-2 text-xs text-muted-foreground">{config.desc}</p>
                    </CardContent>
                </Card>

                {booking.status === 'pending_deposit' && qr && (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="mx-auto w-fit rounded-xl border bg-white p-4 shadow-sm">
                                <QRCodeSVG value={qr} size={200} className="mx-auto" />
                            </div>

                            <div className="mt-4">
                                <div className="text-2xl font-bold" style={{ color: pc }}>
                                    {formatVND(booking.deposit)}
                                </div>
                                <p className="text-xs text-muted-foreground">Số tiền cọc</p>
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="rounded-lg bg-muted p-3">
                                    <p className="text-xs text-muted-foreground">Nội dung chuyển khoản</p>
                                    <div className="mt-0.5 flex items-center justify-center gap-2">
                                        <code className="font-mono text-sm font-bold">{booking.code}</code>
                                        <button
                                            onClick={() => copy(booking.code, 'memo')}
                                            className="rounded p-1 text-muted-foreground hover:bg-accent"
                                        >
                                            {copied === 'memo' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                {account && (
                                    <div className="rounded-lg bg-muted p-3">
                                        <p className="text-xs text-muted-foreground">Tài khoản nhận</p>
                                        <p className="font-medium">{account.name}</p>
                                        <p className="font-mono text-sm">{account.number}</p>
                                    </div>
                                )}
                            </div>

                            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Đang chờ thanh toán — tự động cập nhật
                            </p>
                        </CardContent>
                    </Card>
                )}

                {booking.status === 'confirmed' && (
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="p-6 text-center">
                            <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
                            <p className="mt-3 text-lg font-bold text-emerald-700">Đã giữ sân thành công!</p>
                            <p className="mt-1 text-sm text-emerald-600">Bạn sẽ nhận thông báo xác nhận qua Zalo.</p>
                        </CardContent>
                    </Card>
                )}

                {['cancelled', 'expired', 'no_show'].includes(booking.status) && (
                    <Card className="border-rose-200 bg-rose-50">
                        <CardContent className="p-6 text-center">
                            <XCircle className="mx-auto h-14 w-14 text-rose-400" />
                            <p className="mt-3 text-lg font-bold text-rose-700">{config.label}</p>
                            <p className="mt-1 text-sm text-rose-600">Vui lòng đặt sân lại nếu muốn tiếp tục.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => router.visit(`/book/${tenant.slug}`)}
                            >
                                Đặt lại
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
