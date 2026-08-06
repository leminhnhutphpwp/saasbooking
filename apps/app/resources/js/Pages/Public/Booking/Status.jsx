import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, CheckCircle, Clock, Copy, MapPin, XCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import PublicBookingLayout from '@/Layouts/PublicBookingLayout';
import { formatVND } from '@/lib/format';

const STATUS_MAP = {
    pending_deposit: { label: 'Chờ chuyển khoản', icon: Clock, text: 'text-warning', box: 'border-warning/30 bg-warning/10' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, text: 'text-success', box: 'border-success/30 bg-success/10' },
    cancelled: { label: 'Đã hủy', icon: XCircle, text: 'text-destructive', box: 'border-destructive/30 bg-destructive/10' },
    expired: { label: 'Hết hạn giữ chỗ', icon: XCircle, text: 'text-muted-foreground', box: 'border-border bg-muted' },
    no_show: { label: 'Không đến', icon: XCircle, text: 'text-destructive', box: 'border-destructive/30 bg-destructive/10' },
    completed: { label: 'Đã hoàn thành', icon: CheckCircle, text: 'text-success', box: 'border-success/30 bg-success/10' },
};

const hhmm = (iso) => iso?.slice(11, 16) ?? '';
const dateStr = (iso) => iso
    ? new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

function CopyField({ label, value, copied, onCopy, prominent = false }) {
    return (
        <div className={`rounded-lg border p-3 ${prominent ? 'border-border bg-card' : 'border-border bg-muted/50'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-1 flex items-center justify-between gap-3">
                <span className={`min-w-0 break-all font-mono font-bold text-foreground ${prominent ? 'text-base' : 'text-sm'}`}>{value}</span>
                <Button type="button" variant="ghost" size="icon" onClick={onCopy} aria-label={`Sao chép ${label}`} className="shrink-0">
                    {copied ? <Check className="text-success" /> : <Copy />}
                </Button>
            </div>
        </div>
    );
}

export default function Status({ tenant, booking, qr, account, token }) {
    const [copied, setCopied] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [now, setNow] = useState(Date.now());
    const brand = tenant.settings?.branding ?? {};
    const brandColor = brand.primary_color || 'hsl(16 100% 60%)';
    const status = STATUS_MAP[booking.status] || STATUS_MAP.pending_deposit;
    const StatusIcon = status.icon;
    const holdExpiry = booking.hold_expires_at ? new Date(booking.hold_expires_at) : null;
    const remainingSeconds = holdExpiry ? Math.max(0, Math.ceil((holdExpiry.getTime() - now) / 1000)) : null;
    const countdown = remainingSeconds === null
        ? null
        : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

    useEffect(() => {
        if (booking.status !== 'pending_deposit') return undefined;

        const interval = setInterval(() => router.reload({ only: ['booking'] }), 5000);

        return () => clearInterval(interval);
    }, [booking.status]);

    useEffect(() => {
        if (booking.status !== 'pending_deposit' || !holdExpiry) return undefined;

        const interval = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(interval);
    }, [booking.status, booking.hold_expires_at]);

    const copy = async (value, name) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(name);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            window.prompt('Sao chép nội dung:', value);
        }
    };

    const cancel = () => {
        if (!window.confirm('Bạn muốn hủy đơn đặt sân này?')) return;

        setCancelling(true);
        router.post(`/book/${tenant.slug}/status/${booking.code}/cancel?token=${encodeURIComponent(token)}`, {}, {
            preserveScroll: true,
            onFinish: () => setCancelling(false),
        });
    };

    const refundMessage = booking.refund
        ? booking.refund.status === 'done'
            ? `Khoản hoàn ${formatVND(booking.refund.amount)} đã được sân xử lý.`
            : `Yêu cầu hoàn ${formatVND(booking.refund.amount)} đang chờ sân chuyển khoản thủ công.`
        : 'Không có khoản hoàn cọc nào được tạo cho đơn này.';

    return (
        <PublicBookingLayout>
            <Head title={`Thanh toán - ${booking.code}`} />

            <header className="border-b bg-card">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
                    <Button type="button" variant="ghost" size="icon" onClick={() => router.visit(`/book/${tenant.slug}`)} aria-label="Quay lại đặt sân"><ArrowLeft className="h-5 w-5" /></Button>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">Mã đặt sân {booking.code}</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
                <div className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 ${status.box}`}>
                    <StatusIcon className={`h-5 w-5 shrink-0 ${status.text}`} />
                    <div>
                        <p className={`text-sm font-bold ${status.text}`}>{status.label}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            {booking.status === 'pending_deposit'
                                ? 'Quét mã hoặc chuyển đúng thông tin bên dưới để giữ lịch.'
                                : booking.status === 'expired'
                                    ? 'Không chuyển khoản cho đơn đã hết hạn.'
                                    : 'Thông tin đặt sân của bạn.'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
                    <section className="order-2 space-y-4 lg:order-1">
                        <div className="rounded-xl border bg-card p-4 sm:p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lịch đã chọn</p>
                                <Button type="button" variant="ghost" size="sm" onClick={() => copy(booking.code, 'code')} className="gap-1 px-2 text-muted-foreground hover:text-foreground">
                                    {copied === 'code' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                                    {booking.code}
                                </Button>
                            </div>
                            <div className="mt-3 space-y-3">
                                {booking.slots?.map((slot, index) => (
                                    <div key={index} className="flex items-start justify-between gap-3 border-l-2 pl-3" style={{ borderColor: brandColor }}>
                                        <div>
                                            <p className="font-bold text-foreground">{slot.court_name}</p>
                                            <p className="mt-0.5 text-sm text-muted-foreground">{dateStr(slot.start_at)}</p>
                                            <p className="text-sm font-medium text-foreground">{hhmm(slot.start_at)} - {hhmm(slot.end_at)}</p>
                                        </div>
                                        <p className="shrink-0 font-bold text-foreground">{formatVND(slot.price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-4 sm:p-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tại sân</p>
                            <div className="mt-3 flex gap-3">
                                <MapPin className="h-5 w-5 shrink-0" style={{ color: brandColor }} />
                                <div>
                                    <p className="font-medium text-foreground">{tenant.address || tenant.name}</p>
                                    {tenant.phone && <a href={`tel:${tenant.phone}`} className="mt-1 block text-sm text-muted-foreground hover:text-foreground">{tenant.phone}</a>}
                                </div>
                            </div>
                        </div>

                        {['pending_deposit', 'confirmed'].includes(booking.status) && booking.cancel_policy && (
                            <div className="rounded-xl border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
                                <p className="font-bold text-foreground">Chính sách hủy tại thời điểm đặt</p>
                                <p className="mt-1.5">Hủy trước {booking.cancel_policy.refund_before_hours} giờ: hoàn {booking.cancel_policy.refund_pct}% tiền cọc. Kết quả được tính khi xác nhận hủy.</p>
                            </div>
                        )}
                    </section>

                    <aside className="order-1 space-y-4 lg:order-2">
                        {booking.status === 'pending_deposit' && qr && (
                            <>
                                <div className="rounded-xl border-2 bg-card p-5 text-center" style={{ borderColor: brandColor }}>
                                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: brandColor }}>Quét VietQR để chuyển cọc</p>
                                    <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">{formatVND(booking.deposit)}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Đúng số tiền này, trước khi hết hạn giữ chỗ.</p>
                                    <div className="mx-auto mt-5 w-fit rounded-xl border bg-card p-3">
                                        <QRCodeSVG value={qr} size={220} aria-label={`Mã VietQR chuyển ${formatVND(booking.deposit)}`} />
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-card p-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-warning" />
                                        <p className="text-sm font-bold text-foreground">Giữ chỗ đến {holdExpiry ? holdExpiry.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'khi được xác nhận'}</p>
                                    </div>
                                    {countdown !== null && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Còn {countdown}. Trạng thái được cập nhật tự động.</p>}
                                </div>

                                {account && (
                                    <div className="space-y-2 rounded-xl border bg-card p-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hoặc chuyển khoản thủ công</p>
                                        <CopyField label="Số tiền cọc" value={formatVND(booking.deposit)} copied={copied === 'amount'} onCopy={() => copy(String(booking.deposit), 'amount')} prominent />
                                        <CopyField label="Tài khoản nhận" value={account.number} copied={copied === 'account'} onCopy={() => copy(account.number, 'account')} />
                                        <p className="px-1 text-xs leading-relaxed text-muted-foreground">{account.name}{account.bank ? ` · ${account.bank}` : ''}</p>
                                        <CopyField label="Nội dung chuyển khoản" value={booking.code} copied={copied === 'memo'} onCopy={() => copy(booking.code, 'memo')} />
                                    </div>
                                )}

                                <Button type="button" variant="outline" onClick={cancel} disabled={cancelling} className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    {cancelling ? 'Đang hủy...' : 'Hủy đơn đặt sân'}
                                </Button>
                            </>
                        )}

                        {booking.status === 'pending_deposit' && !qr && (
                            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed text-foreground" role="alert">
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>Chưa có thông tin nhận tiền cho đơn này. Vui lòng liên hệ sân và cung cấp mã đặt sân trước khi thanh toán.</p>
                                </div>
                            </div>
                        )}

                        {booking.status === 'confirmed' && (
                            <div className="rounded-xl border border-success/30 bg-card p-5 text-center">
                                <CheckCircle className="mx-auto h-10 w-10 text-success" />
                                <p className="mt-3 text-lg font-bold">Đặt sân thành công</p>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Sân đã nhận cọc cho mã {booking.code}.</p>
                                <Button type="button" variant="outline" onClick={cancel} disabled={cancelling} className="mt-5 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    {cancelling ? 'Đang hủy...' : 'Hủy đơn đặt sân'}
                                </Button>
                            </div>
                        )}

                        {!['pending_deposit', 'confirmed'].includes(booking.status) && (
                            <div className="rounded-xl border bg-card p-5 text-center">
                                <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                                <p className="mt-3 text-lg font-bold">{status.label}</p>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{refundMessage}</p>
                                <Button type="button" onClick={() => router.visit(`/book/${tenant.slug}`)} className="mt-5 w-full text-primary-foreground" style={{ backgroundColor: brandColor }}>
                                    Đặt lại
                                </Button>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </PublicBookingLayout>
    );
}
