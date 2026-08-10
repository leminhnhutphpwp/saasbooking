import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, CheckCircle, Clock, Copy, MapPin, XCircle } from 'lucide-react';
import { formatTime, formatVND } from '@/lib/format';

const STATUS_MAP = {
    pending_deposit: { label: 'Chờ chuyển khoản', icon: Clock, text: 'text-amber-800', box: 'border-amber-200 bg-amber-50' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, text: 'text-emerald-800', box: 'border-emerald-200 bg-emerald-50' },
    cancelled: { label: 'Đã hủy', icon: XCircle, text: 'text-rose-800', box: 'border-rose-200 bg-rose-50' },
    expired: { label: 'Hết hạn giữ chỗ', icon: XCircle, text: 'text-gray-700', box: 'border-gray-200 bg-gray-50' },
    no_show: { label: 'Không đến', icon: XCircle, text: 'text-rose-800', box: 'border-rose-200 bg-rose-50' },
    completed: { label: 'Đã hoàn thành', icon: CheckCircle, text: 'text-emerald-800', box: 'border-emerald-200 bg-emerald-50' },
};

const hhmm = (iso) => formatTime(iso);
const dateStr = (iso) => iso
    ? new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

function CopyField({ label, value, copied, onCopy, prominent = false }) {
    return (
        <div className={`rounded-lg border p-3 ${prominent ? 'border-gray-300 bg-white' : 'border-gray-100 bg-gray-50'}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">{label}</p>
            <div className="mt-1 flex items-center justify-between gap-3">
                <span className={`min-w-0 break-all font-mono font-bold text-gray-900 ${prominent ? 'text-base' : 'text-sm'}`}>{value}</span>
                <button type="button" onClick={onCopy} aria-label={`Sao chép ${label}`} className="shrink-0 rounded p-1.5 text-gray-500 hover:bg-gray-100">
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}

export default function Status({ tenant, booking, qr, account, token }) {
    const [copied, setCopied] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [now, setNow] = useState(Date.now());
    const brand = tenant.settings?.branding ?? {};
    const brandColor = brand.primary_color ?? null;
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
        <div className="min-h-screen bg-plane text-ink">
            <Head title={`Thanh toán - ${booking.code}`} />

            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
                    <button type="button" onClick={() => router.visit(`/book/${tenant.slug}`)} aria-label="Quay lại đặt sân" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-950">{tenant.name}</p>
                        <p className="text-xs text-gray-500">Mã đặt sân {booking.code}</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
                <div className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 ${status.box}`}>
                    <StatusIcon className={`h-5 w-5 shrink-0 ${status.text}`} />
                    <div>
                        <p className={`text-sm font-bold ${status.text}`}>{status.label}</p>
                        <p className="text-xs text-gray-600">
                            {booking.status === 'pending_deposit'
                                ? 'Quét mã hoặc chuyển đúng thông tin bên dưới để giữ lịch.'
                                : booking.status === 'expired'
                                    ? 'Không chuyển khoản cho đơn đã hết hạn.'
                                    : 'Thông tin đặt sân của bạn.'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-5">
                    <section className="order-2 space-y-4 lg:order-1 lg:col-span-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Lịch đã chọn</p>
                                <button type="button" onClick={() => copy(booking.code, 'code')} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-950">
                                    {copied === 'code' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    {booking.code}
                                </button>
                            </div>
                            <div className="mt-3 space-y-3">
                                {booking.slots?.map((slot, index) => (
                                    <div key={index} className="flex items-start justify-between gap-3 border-l-2 pl-3" style={{ borderColor: brandColor }}>
                                        <div>
                                            <p className="font-bold text-gray-950">{slot.court_name}</p>
                                            <p className="mt-0.5 text-sm text-gray-600">{dateStr(slot.start_at)}</p>
                                            <p className="text-sm font-medium text-gray-700">{hhmm(slot.start_at)} - {hhmm(slot.end_at)}</p>
                                        </div>
                                        <p className="shrink-0 font-bold text-gray-900">{formatVND(slot.price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Tại sân</p>
                            <div className="mt-3 flex gap-3">
                                <MapPin className="h-5 w-5 shrink-0" style={{ color: brandColor }} />
                                <div>
                                    <p className="font-medium text-gray-900">{tenant.address || tenant.name}</p>
                                    {tenant.phone && <a href={`tel:${tenant.phone}`} className="mt-1 block text-sm text-gray-600">{tenant.phone}</a>}
                                </div>
                            </div>
                        </div>

                        {['pending_deposit', 'confirmed'].includes(booking.status) && booking.cancel_policy && (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-600">
                                <p className="font-bold text-gray-800">Chính sách hủy tại thời điểm đặt</p>
                                <p className="mt-1">Hủy trước {booking.cancel_policy.refund_before_hours} giờ: hoàn {booking.cancel_policy.refund_pct}% tiền cọc. Kết quả được tính khi xác nhận hủy.</p>
                            </div>
                        )}
                    </section>

                    <aside className="order-1 space-y-4 lg:order-2 lg:col-span-2">
                        {booking.status === 'pending_deposit' && qr && (
                            <>
                                <div className="rounded-xl border-2 bg-white p-5 text-center" style={{ borderColor: brandColor }}>
                                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: brandColor }}>Quét VietQR để chuyển cọc</p>
                                    <p className="mt-2 text-4xl font-bold tracking-tight text-gray-950">{formatVND(booking.deposit)}</p>
                                    <p className="mt-1 text-xs text-gray-500">Đúng số tiền này, trước khi hết hạn giữ chỗ.</p>
                                    <div className="mx-auto mt-5 w-fit rounded-xl border border-gray-200 bg-white p-3">
                                        <QRCodeSVG value={qr} size={220} aria-label={`Mã VietQR chuyển ${formatVND(booking.deposit)}`} />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-amber-600" />
                                        <p className="text-sm font-bold text-gray-900">Giữ chỗ đến {holdExpiry ? holdExpiry.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'khi được xác nhận'}</p>
                                    </div>
                                    {countdown !== null && <p className="mt-1 text-xs text-gray-600">Còn {countdown}. Trạng thái được cập nhật tự động.</p>}
                                </div>

                                {account && (
                                    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Hoặc chuyển khoản thủ công</p>
                                        <CopyField label="Số tiền cọc" value={formatVND(booking.deposit)} copied={copied === 'amount'} onCopy={() => copy(String(booking.deposit), 'amount')} prominent />
                                        <CopyField label="Tài khoản nhận" value={account.number} copied={copied === 'account'} onCopy={() => copy(account.number, 'account')} />
                                        <p className="px-1 text-xs text-gray-600">{account.name}{account.bank ? ` · ${account.bank}` : ''}</p>
                                        <CopyField label="Nội dung chuyển khoản" value={booking.code} copied={copied === 'memo'} onCopy={() => copy(booking.code, 'memo')} />
                                    </div>
                                )}

                                <button type="button" onClick={cancel} disabled={cancelling} className="w-full rounded-lg border border-rose-200 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                                    {cancelling ? 'Đang hủy...' : 'Hủy đơn đặt sân'}
                                </button>
                            </>
                        )}

                        {booking.status === 'pending_deposit' && !qr && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
                                <div className="flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>Chưa có thông tin nhận tiền cho đơn này. Vui lòng liên hệ sân và cung cấp mã đặt sân trước khi thanh toán.</p>
                                </div>
                            </div>
                        )}

                        {booking.status === 'confirmed' && (
                            <div className="rounded-xl border border-emerald-200 bg-white p-5 text-center">
                                <CheckCircle className="mx-auto h-10 w-10 text-emerald-600" />
                                <p className="mt-3 text-lg font-bold">Đặt sân thành công</p>
                                <p className="mt-1 text-sm text-gray-600">Sân đã nhận cọc cho mã {booking.code}.</p>
                                <button type="button" onClick={cancel} disabled={cancelling} className="mt-5 w-full rounded-lg border border-rose-200 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50">
                                    {cancelling ? 'Đang hủy...' : 'Hủy đơn đặt sân'}
                                </button>
                            </div>
                        )}

                        {!['pending_deposit', 'confirmed'].includes(booking.status) && (
                            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
                                <XCircle className="mx-auto h-10 w-10 text-ink-mute" />
                                <p className="mt-3 text-lg font-bold">{status.label}</p>
                                <p className="mt-1 text-sm text-gray-600">{refundMessage}</p>
                                <button type="button" onClick={() => router.visit(`/book/${tenant.slug}`)} className="mt-5 w-full rounded-lg py-2.5 text-sm font-bold text-white" style={{ backgroundColor: brandColor }}>
                                    Đặt lại
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}
