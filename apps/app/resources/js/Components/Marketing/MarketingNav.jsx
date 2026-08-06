import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';

const links = [
    ['Tính năng', '/features'], ['Cách hoạt động', '/how-it-works'], ['Trải nghiệm', '/demo'], ['Bảng giá', '/pricing'],
];
const services = [
    { label: 'Sân Pickleball', href: '/for/pickleball', description: 'Lượt khách linh hoạt' },
    { label: 'Sân Cầu lông', href: '/for/badminton', description: 'Lịch giờ ổn định' },
];

export default function MarketingNav({ dark = false }) {
    const [open, setOpen] = useState(false);
    const { auth } = usePage().props;
    const primaryHref = auth?.user ? '/dashboard' : '/register';
    const text = dark ? 'text-background/75 hover:text-background' : 'text-muted-foreground hover:text-foreground';

    return (
        <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10" aria-label="Điều hướng chính">
            <Link href="/" className={`flex items-center gap-2.5 ${dark ? 'text-background' : 'text-foreground'}`} aria-label="SÂN trang chủ">
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground">S</span><span className="text-xl font-extrabold tracking-tight">SÂN</span>
            </Link>
            <div className="hidden items-center gap-5 lg:flex">
                {links.map(([label, href]) => <Link key={href} href={href} className={`text-sm font-semibold transition ${text}`}>{label}</Link>)}
                <DropdownMenu>
                    <DropdownMenuTrigger className={`inline-flex cursor-pointer items-center gap-1 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${text}`}>Dịch vụ <ChevronDown className="size-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="center" sideOffset={20} className="w-[min(32rem,calc(100vw-3rem))] rounded-2xl p-3 shadow-xl">
                        <div className="flex items-center justify-between px-2 pb-3"><p className="text-sm font-black text-foreground">Dịch vụ cho sân</p><p className="text-xs font-semibold text-muted-foreground">Chọn mô hình của bạn</p></div>
                        <div className="grid gap-2 sm:grid-cols-2">{services.map((service) => <DropdownMenuItem key={service.href} asChild><Link href={service.href} className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent hover:shadow-md focus:bg-accent"><span><span className="block text-sm font-black text-foreground">{service.label}</span><span className="mt-1 block text-xs text-muted-foreground">{service.description}</span></span><ArrowRight className="size-4 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-1" /></Link></DropdownMenuItem>)}</div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
                {!auth?.user && <Link href="/login" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${text}`}>Đăng nhập</Link>}
                <Link href={primaryHref} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-95">{auth?.user ? 'Quản trị sân' : 'Bắt đầu'}</Link>
            </div>
            <button type="button" className={`grid size-10 place-items-center rounded-xl border lg:hidden ${dark ? 'border-background/20 text-background' : 'border-border text-foreground'}`} aria-label="Mở menu điều hướng" aria-expanded={open} aria-controls="marketing-mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
            {open && <div id="marketing-mobile-menu" className="absolute left-5 right-5 top-[4.6rem] rounded-2xl border bg-card p-3 shadow-xl lg:hidden">
                {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-foreground hover:bg-muted">{label}</Link>)}
                <div className="mx-2 my-2 border-t pt-3"><p className="px-2 text-xs font-bold uppercase tracking-wider text-primary">Dịch vụ</p><div className="mt-2 space-y-1">{services.map((service) => <Link key={service.href} href={service.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl border border-border px-3 py-3 transition hover:bg-muted"><span><span className="block text-sm font-bold text-foreground">{service.label}</span><span className="mt-1 block text-xs text-muted-foreground">{service.description}</span></span><ArrowRight className="size-4 text-primary" /></Link>)}</div></div>
                <div className="mt-2 border-t pt-2"><Link href={primaryHref} onClick={() => setOpen(false)} className="block rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">{auth?.user ? 'Quản trị sân' : 'Bắt đầu cùng SÂN'}</Link></div>
            </div>}
        </nav>
    );
}
