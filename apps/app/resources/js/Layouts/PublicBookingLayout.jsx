import { Toaster } from 'sonner';

export default function PublicBookingLayout({ children, className = '' }) {
    return (
        <div className={`min-h-screen bg-background text-foreground ${className}`}>
            {children}
            <Toaster richColors position="top-center" />
        </div>
    );
}
