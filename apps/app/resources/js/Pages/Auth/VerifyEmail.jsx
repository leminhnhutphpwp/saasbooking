import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="mb-4 text-sm text-ink-soft">
                Cảm ơn bạn đã đăng ký. Vui lòng mở liên kết chúng tôi vừa gửi
                đến email của bạn để xác minh tài khoản. Nếu chưa nhận được,
                bạn có thể yêu cầu gửi lại.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-inner bg-turf-100 p-3 text-sm font-medium text-turf-700">
                    Liên kết xác minh mới đã được gửi đến email bạn dùng khi
                    đăng ký.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <PrimaryButton disabled={processing}>
                        Gửi lại email xác minh
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="min-h-11 px-2 text-sm text-turf-700 underline underline-offset-4 hover:text-ink"
                    >
                        Đăng xuất
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
