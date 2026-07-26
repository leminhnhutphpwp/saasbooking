import { Toaster } from 'sonner';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-40 -top-40 h-[440px] w-[440px] rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-48 -right-40 h-[480px] w-[480px] rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
                        <svg className="h-6 w-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <path d="M3 9h18" />
                            <path d="M9 3v18" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">SÂN</h1>
                            <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                Quản lý sân
                            </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            Lịch đặt, khách hàng và vận hành trong một nơi
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border bg-card p-6 shadow-lg shadow-black/5">
                    {children}
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                    &copy; {new Date().getFullYear()} SÂN &middot; Vận hành sân gọn hơn mỗi ngày
                </p>
            </div>

            <Toaster richColors position="top-right" />
        </div>
    );
}
