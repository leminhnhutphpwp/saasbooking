import { Head } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';

export default function Index() {
    return (
        <ManagerLayout header={<h2 className="text-xl font-semibold">Báo cáo</h2>}>
            <Head title="Báo cáo" />
            <div className="mx-auto max-w-4xl p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">Báo cáo sẽ được hiển thị tại đây.</p>
            </div>
        </ManagerLayout>
    );
}
