import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { formatVND } from '@/lib/format';
import { CheckCircle, Clock, Copy, XCircle, Loader2, Check, ArrowLeft, MapPin, CalendarDays, User, Banknote, ShieldCheck, CircleDollarSign, Link2 } from 'lucide-react';

const STATUS_MAP = {
    pending_deposit: { label: 'Chờ thanh toán', icon: Clock, color: '#f59e0b', bg: '#fefce8', border: '#fde68a', desc: 'Vui lòng chuyển khoản đúng số tiền và nội dung bên dưới.' },
    confirmed: { label: 'Đã xác nhận', icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Sân đã được giữ cho bạn. Cảm ơn!' },
    cancelled: { label: 'Đã hủy', icon: XCircle, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', desc: 'Đơn đặt sân đã bị hủy.' },
    expired: { label: 'Hết hạn', icon: XCircle, color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', desc: 'Thời gian giữ chỗ đã hết hạn.' },
    no_show: { label: 'Không đến', icon: XCircle, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', desc: 'Bạn không đến chơi.' },
};

const hhmm = (iso) => iso?.slice(11, 16) ?? '';
const dateStr = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export default function Status({ tenant, booking, qr, account, token }) {
    const [copied, setCopied] = useState(null);
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    /** Current page URL including the security token — safe to share. */
    const secureUrl = typeof window !== 'undefined' ? window.location.href : '';

    useEffect(() => {
        if (booking.status !== 'pending_deposit') return;
        const t = setInterval(() => router.reload({ only: ['booking'] }), 5000);
        return () => clearInterval(t);
    }, [booking.status]);

    const status = STATUS_MAP[booking.status] || STATUS_MAP.pending_deposit;
    const Icon = status.icon;

    const copy = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            window.prompt('Không thể tự động sao chép. Vui lòng sao chép nội dung bên dưới:', text);
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f4f3f0' }}>
            <Head title={`Thanh toán — ${booking.code}`} />

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
                        <h1 className="text-sm font-bold text-gray-800 truncate">{tenant.name}</h1>
                        <p className="text-[11px] text-gray-400">Thanh toán đặt sân</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.color }} />
                        <span className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</span>
                    </div>
                </div>
            </div>

            {/* Status Banner */}
            <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4">
                <div
                    className="rounded-2xl border px-4 py-3 flex items-center gap-3"
                    style={{ backgroundColor: status.bg, borderColor: status.border }}
                >
                    <div className="rounded-full p-2" style={{ backgroundColor: `${status.color}18` }}>
                        <Icon className="h-5 w-5" style={{ color: status.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: status.color }}>{status.label}</p>
                        <p className="text-xs text-gray-500">{status.desc}</p>
                    </div>
                    {booking.status === 'pending_deposit' && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-300 shrink-0" />
                    )}
                </div>
            </div>

            {/* Main Content — Two Column */}
            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5">
                <div className="flex flex-col lg:flex-row gap-5">

                    {/* Left: Booking Details */}
                    <div className="flex-1 space-y-4 min-w-0">
                        {/* Code */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã đặt sân</p>
                                <span className="text-[10px] font-mono text-gray-300">{booking.created_at ? dateStr(booking.created_at) : ''}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <code className="text-2xl font-mono font-bold tracking-wider" style={{ color: pc }}>{booking.code}</code>
                                <button
                                    onClick={() => copy(booking.code, 'code')}
                                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                    title="Sao chép mã"
                                >
                                    {copied === 'code' ? <Check className="h-4 w-4" style={{ color: pc }} /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* Secure link */}
                            {token && (
                                <div className="mt-3 rounded-xl bg-gray-50 p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span className="text-[10px] text-gray-400 truncate">Liên kết an toàn</span>
                                        </div>
                                        <button
                                            onClick={() => copy(secureUrl, 'link')}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors shrink-0"
                                        >
                                            {copied === 'link' ? <Check className="h-3.5 w-3.5" style={{ color: pc }} /> : <Copy className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-300 mt-1">Liên kết này chứa mã bảo mật — an toàn để chia sẻ</p>
                                </div>
                            )}
                        </div>

                        {/* Slot Details */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chi tiết đặt sân</p>
                            <div className="space-y-3">
                                {booking.slots?.map((slot, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                                        <div className="rounded-lg p-2 bg-white shadow-sm">
                                            <CalendarDays className="h-4 w-4" style={{ color: pc }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800">{slot.court_name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{dateStr(slot.start_at)}</p>
                                            <p className="text-xs text-gray-500">{hhmm(slot.start_at)} – {hhmm(slot.end_at)}</p>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: pc }}>{formatVND(slot.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer Info */}
                        {booking.customer_name && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin khách</p>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg p-2 bg-gray-50">
                                        <User className="h-4 w-4" style={{ color: pc }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{booking.customer_name}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Venue Info */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Địa chỉ sân</p>
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg p-2 bg-gray-50 shrink-0">
                                    <MapPin className="h-4 w-4" style={{ color: pc }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-700">{tenant.address || tenant.name}</p>
                                    {tenant.phone && <p className="text-xs text-gray-400 mt-1">{tenant.phone}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment */}
                    <div className="w-full lg:w-[380px] shrink-0 space-y-4">
                        {booking.status === 'pending_deposit' && qr ? (
                            <>
                                {/* Amount */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3" style={{ backgroundColor: `${pc}12`, borderColor: `${pc}30`, borderWidth: 1 }}>
                                        <CircleDollarSign className="h-3.5 w-3.5" style={{ color: pc }} />
                                        <span className="text-[11px] font-bold" style={{ color: pc }}>TIỀN CỌC</span>
                                    </div>
                                    <div className="text-4xl font-bold tracking-tight" style={{ color: pc }}>{formatVND(booking.deposit)}</div>
                                    <p className="text-xs text-gray-400 mt-1">Số tiền cần chuyển khoản</p>
                                </div>

                                {/* QR Code */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quét mã VietQR</p>
                                    <div className="mx-auto w-fit rounded-2xl p-3 bg-white shadow-inner" style={{ borderColor: `${pc}25`, borderWidth: 2 }}>
                                        <QRCodeSVG value={qr} size={200} className="mx-auto" />
                                    </div>
                                    <p className="text-[10px] text-gray-300 mt-3">Mở app ngân hàng · Quét QR · Xác nhận</p>
                                </div>

                                {/* Bank Info */}
                                {account && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thông tin chuyển khoản</p>

                                        {/* Content */}
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[10px] text-gray-400 mb-1">Nội dung chuyển khoản (bắt buộc)</p>
                                            <div className="flex items-center justify-between">
                                                <code className="font-mono text-sm font-bold text-gray-800">{booking.code}</code>
                                                <button
                                                    onClick={() => copy(booking.code, 'memo')}
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                                                >
                                                    {copied === 'memo' ? <Check className="h-3.5 w-3.5" style={{ color: pc }} /> : <Copy className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Account */}
                                        <div className="rounded-xl bg-gray-50 p-3">
                                            <p className="text-[10px] text-gray-400 mb-1">Tài khoản nhận</p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{account.number}</p>
                                                    <p className="text-xs text-gray-500">{account.name}{account.bank ? ` · ${account.bank}` : ''}</p>
                                                </div>
                                                <button
                                                    onClick={() => copy(account.number, 'account')}
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                                                >
                                                    {copied === 'account' ? <Check className="h-3.5 w-3.5" style={{ color: pc }} /> : <Copy className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Trust */}
                                <div className="flex items-center justify-center gap-2 py-2">
                                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: `${pc}60` }} />
                                    <p className="text-[10px]" style={{ color: `${pc}60` }}>Thanh toán an toàn · Cập nhật tự động</p>
                                </div>
                            </>
                        ) : booking.status === 'confirmed' ? (
                            /* Confirmed */
                            <div className="bg-white rounded-2xl border-2 shadow-sm p-8 text-center" style={{ borderColor: `${pc}40` }}>
                                <div className="mx-auto rounded-full p-3 w-fit" style={{ backgroundColor: `${pc}12` }}>
                                    <CheckCircle className="h-12 w-12" style={{ color: pc }} />
                                </div>
                                <p className="mt-4 text-xl font-bold text-gray-800">Đặt sân thành công!</p>
                                <p className="mt-2 text-sm text-gray-500">Bạn sẽ nhận thông báo xác nhận qua Zalo.</p>
                                <div className="mt-5 p-4 rounded-xl border" style={{ backgroundColor: `${pc}08`, borderColor: `${pc}20` }}>
                                    <p className="text-xs font-semibold" style={{ color: pc }}>Mã đặt sân của bạn</p>
                                    <code className="text-lg font-mono font-bold" style={{ color: pc }}>{booking.code}</code>
                                </div>
                                <button
                                    onClick={() => router.visit(`/book/${tenant.slug}`)}
                                    className="mt-5 w-full h-10 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ backgroundColor: pc }}
                                >
                                    Đặt thêm sân
                                </button>
                            </div>
                        ) : (
                            /* Cancelled / Expired / No Show */
                            <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm p-8 text-center">
                                <div className="mx-auto rounded-full p-3 bg-rose-50 w-fit">
                                    <XCircle className="h-12 w-12 text-rose-400" />
                                </div>
                                <p className="mt-4 text-xl font-bold text-gray-800">{status.label}</p>
                                <p className="mt-2 text-sm text-gray-500">Vui lòng đặt sân lại nếu muốn tiếp tục.</p>
                                <button
                                    onClick={() => router.visit(`/book/${tenant.slug}`)}
                                    className="mt-5 w-full h-10 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ backgroundColor: pc }}
                                >
                                    Đặt lại
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
