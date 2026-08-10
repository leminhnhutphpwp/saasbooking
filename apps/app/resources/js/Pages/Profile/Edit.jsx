import { Head } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <ManagerLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-ink">
                    Hồ sơ
                </h2>
            }
        >
            <Head title="Hồ sơ" />

            <div className="mx-auto max-w-4xl space-y-6 p-3 sm:p-6">
                <div className="rounded-card bg-surface p-6 shadow-card">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="rounded-card bg-surface p-6 shadow-card">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="rounded-card bg-surface p-6 shadow-card">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </ManagerLayout>
    );
}
