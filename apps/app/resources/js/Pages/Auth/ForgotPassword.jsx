import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Quên mật khẩu" />

            <div className="mb-4 text-sm text-ink-soft">
                Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi cho bạn liên kết
                để tạo mật khẩu mới.
            </div>

            {status && (
                <div className="mb-4 rounded-inner bg-turf-100 p-3 text-sm font-medium text-turf-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>
                        Gửi liên kết đặt lại mật khẩu
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
