import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { formatVND } from '@/lib/format';
import { CheckCircle, Clock, Copy, XCircle, Loader2, Check, ArrowLeft } from 'lucide-react';

const STATUS_CONFIG = {
    pending_deposit: { label: 'Chờ chuyển cọc', icon: Clock, variant: 'secondary', desc: 'Chuyển khoản đúng số tiền + nội dung để giữ sân.' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, variant: 'default', desc: 'Sân đã được giữ cho bạn. Cảm ơn!' },
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

            {/* Hero */}
            <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${pc}dd 0%, ${pc} 100%)` }}>
                <div className="mx-auto flex max-w-md items-center gap-4 px-4 py-5">
                    <button
                        onClick={() => router.visit(`/book/${tenant.slug}`)}
                        className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="text-white">
                        <h1 className="text-lg font-bold">{tenant.name}</h1>
                        <p className="text-xs text-white/70">Trạng thái đơn đặt sân</p>
                    </div>
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
                                    className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                                    title="Sao chép"
                                >
                                    {copied === 'code' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Badge variant={config.variant} className="gap-1.5 px-3 py-1 text-sm">
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
                                <QRCodeSVG value={qr} size={220} className="mx-auto" />
                            </div>

                            <div className="mt-5">
                                <div className="text-3xl font-bold" style={{ color: pc }}>
                                    {formatVND(booking.deposit)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Số tiền cọc</p>
                            </div>

                            <div className="mt-5 space-y-2.5">
                                <div className="rounded-lg bg-muted p-3 text-left">
                                    <p className="text-xs text-muted-foreground mb-1">Nội dung chuyển khoản</p>
                                    <div className="flex items-center justify-between">
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
                                    <div className="rounded-lg bg-muted p-3 text-left">
                                        <p className="text-xs text-muted-foreground mb-1">Tài khoản nhận</p>
                                        <p className="font-medium text-sm">{account.name}</p>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <code className="font-mono text-sm">{account.number}</code>
                                            <button
                                                onClick={() => copy(account.number, 'account')}
                                                className="rounded p-1 text-muted-foreground hover:bg-accent"
                                            >
                                                {copied === 'account' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" style={{ color: pc }} />
                                Đang chờ thanh toán — tự động cập nhật
                            </p>
                        </CardContent>
                    </Card>
                )}

                {booking.status === 'confirmed' && (
                    <Card style={{ borderColor: pc, borderWidth: '2px' }} className="bg-emerald-50/50">
                        <CardContent className="p-6 text-center">
                            <CheckCircle className="mx-auto h-14 w-14" style={{ color: pc }} />
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
                                className="mt-5"
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