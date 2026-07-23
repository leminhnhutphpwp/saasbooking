import { useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';

export default function Dashboard() {
    const { auth } = usePage().props;

    useEffect(() => {
        if (auth.user?.tenant_id) {
            router.replace(route('manager.home'));
        }
    }, []);

    if (auth.user?.tenant_id) return null;

    return (
        <ManagerLayout header={<h2 className="text-xl font-semibold">Dashboard</h2>}>
            <Head title="Dashboard" />
            <div className="mx-auto max-w-4xl p-4 sm:p-6">
                <div className="rounded-lg border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Bạn chưa được gắn với sân nào. Liên hệ quản trị viên để được cấp quyền.
                    </p>
                </div>
            </div>
        </ManagerLayout>
    );
}
