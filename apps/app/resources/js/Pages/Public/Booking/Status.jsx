import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';

const STATUS_LABEL = {
    pending_deposit: 'Chờ chuyển cọc',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
    expired: 'Hết hạn',
    no_show: 'Không đến',
};

export default function Status({ tenant, booking, qr, account }) {
    // Poll for confirmation while awaiting the deposit.
    useEffect(() => {
        if (booking.status !== 'pending_deposit') return;
        const t = setInterval(() => router.reload({ only: ['booking'] }), 5000);
        return () => clearInterval(t);
    }, [booking.status]);

    const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Mã đặt ${booking.code}`} />

            <div className="mx-auto max-w-md p-4 text-center">
                <h1 className="text-xl font-bold">{tenant.name}</h1>
                <div className="mt-2 text-sm text-gray-600">
                    Mã đặt: <b className="font-mono">{booking.code}</b>
                </div>
                <div className="mt-1 text-sm">
                    Trạng thái: <b>{STATUS_LABEL[booking.status] ?? booking.status}</b>
                </div>

                {booking.status === 'pending_deposit' && qr && (
                    <div className="mt-4 rounded-xl border bg-white p-5">
                        <QRCodeSVG value={qr} size={220} className="mx-auto" />
                        <div className="mt-4 text-lg">
                            Cọc: <b>{vnd(booking.deposit)}</b>
                        </div>
                        <div className="text-sm text-gray-600">
                            Nội dung CK: <b className="font-mono">{booking.code}</b>
                        </div>
                        {account && (
                            <div className="mt-1 text-sm text-gray-600">
                                {account.name} · {account.number}
                            </div>
                        )}
                        <p className="mt-3 text-xs text-gray-400">
                            Chuyển đúng số tiền + nội dung. Trang tự cập nhật khi nhận được cọc.
                        </p>
                    </div>
                )}

                {booking.status === 'confirmed' && (
                    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 font-medium text-green-700">
                        Đã giữ sân thành công! 🎉
                    </div>
                )}
            </div>
        </div>
    );
}
