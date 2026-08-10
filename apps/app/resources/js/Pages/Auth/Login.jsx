import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Đăng nhập" />

            <div className="space-y-1 text-center">
                <h2 className="text-lg font-semibold text-ink">Đăng nhập</h2>
                <p className="text-sm text-ink-soft">Chào mừng bạn quay trở lại</p>
            </div>

            {status && (
                <div className="rounded-inner bg-turf-100 p-3 text-sm text-turf-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <InputLabel htmlFor="email" value="Email" />
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="pl-9"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <InputLabel htmlFor="password" value="Mật khẩu" />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-medium text-turf-700 underline-offset-4 hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="pl-9"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />
                    </div>
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div className="flex items-center">
                    <Checkbox
                        name="remember"
                        id="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                    />
                    <label htmlFor="remember" className="ms-2 cursor-pointer select-none text-sm text-ink-soft">
                        Ghi nhớ đăng nhập
                    </label>
                </div>

                <PrimaryButton type="submit" disabled={processing} className="w-full">
                    {processing ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
