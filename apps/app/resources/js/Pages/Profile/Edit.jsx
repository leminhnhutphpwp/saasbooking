import { Head } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <ManagerLayout>
            <Head title="Hồ sơ" />

            <PageContainer size="narrow">
                <PageHeader title="Hồ sơ" description="Quản lý thông tin và bảo mật tài khoản của bạn." />
                <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </PageContainer>
        </ManagerLayout>
    );
}
