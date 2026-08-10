import { Toaster } from 'sonner';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-plane px-3 py-6 sm:px-6">
            <div className="w-full max-w-md space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner bg-turf-600 shadow-flat">
                        <svg className="h-6 w-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <path d="M3 9h18" />
                            <path d="M9 3v18" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-ink">SÂN</h1>
                            <span className="rounded-full bg-turf-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-turf-700">
                                Quản lý sân
                            </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-ink-soft">
                            Lịch đặt, khách hàng và vận hành trong một nơi
                        </p>
                    </div>
                </div>

                <main className="rounded-card bg-surface p-6 shadow-card">
                    {children}
                </main>

                <p className="text-center text-xs text-ink-mute">
                    &copy; {new Date().getFullYear()} SÂN &middot; Vận hành sân gọn hơn mỗi ngày
                </p>
            </div>

            <Toaster richColors position="top-right" />
        </div>
    );
}
