import { useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { EmptyState } from '@/Components/EmptyState';
import { Building2 } from 'lucide-react';

export default function Dashboard() {
    const { auth } = usePage().props;

    useEffect(() => {
        if (auth.user?.tenant_id) {
            router.replace(route('manager.home'));
        }
    }, []);

    if (auth.user?.tenant_id) return null;

    return (
        <ManagerLayout>
            <Head title="Dashboard" />
            <PageContainer size="narrow">
                <PageHeader title="Chưa có cơ sở" description="Tài khoản này chưa được phân quyền vận hành sân." />
                <EmptyState icon={Building2} title="Bạn chưa được gắn với sân nào" description="Liên hệ quản trị viên để được cấp quyền truy cập cơ sở của bạn." />
            </PageContainer>
        </ManagerLayout>
    );
}
