import { Toaster } from 'sonner';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute left-1/2 top-1/3 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md space-y-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-500 shadow-lg shadow-primary/20">
                        <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <path d="M3 9h18" />
                            <path d="M9 3v18" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">SÂN</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Nền tảng đặt sân &amp; quản lý sân thể thao</p>
                </div>

                <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5">
                    {children}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} SÂN &middot; Giải pháp quản lý sân toàn diện
                </p>
            </div>

            <Toaster richColors position="top-right" />
        </div>
    );
}
