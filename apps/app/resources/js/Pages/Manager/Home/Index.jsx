import { Head } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';

export default function Index() {
    return (
        <ManagerLayout header={<h2 className="text-xl font-semibold">Trang chủ</h2>}>
            <Head title="Trang chủ" />
            <div className="mx-auto max-w-4xl p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">Tổng quan sẽ được hiển thị tại đây.</p>
            </div>
        </ManagerLayout>
    );
}
