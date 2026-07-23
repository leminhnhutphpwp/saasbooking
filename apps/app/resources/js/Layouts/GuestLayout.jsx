import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { Toaster } from 'sonner';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-background pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-primary" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden rounded-xl border bg-card px-6 py-4 text-card-foreground shadow-sm sm:max-w-md">
                {children}
            </div>

            <Toaster richColors position="top-right" />
        </div>
    );
}
