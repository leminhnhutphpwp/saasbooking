import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
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
                <h2 className="text-lg font-semibold text-foreground">Đăng nhập</h2>
                <p className="text-sm text-muted-foreground">Chào mừng bạn quay trở lại</p>
            </div>

            {status && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <InputLabel htmlFor="email" value="Email" />
                    <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="h-10 w-full pl-9"
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
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="h-10 w-full pl-9"
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
                    <label htmlFor="remember" className="ms-2 cursor-pointer select-none text-sm text-muted-foreground">
                        Ghi nhớ đăng nhập
                    </label>
                </div>

                <Button type="submit" disabled={processing} className="h-10 w-full font-medium">
                    {processing ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>
        </GuestLayout>
    );
}
