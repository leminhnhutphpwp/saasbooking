import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
    ['Tính năng', '/features'], ['Cách hoạt động', '/how-it-works'], ['Trải nghiệm', '/demo'], ['Pickleball', '/for/pickleball'], ['Cầu lông', '/for/badminton'], ['Bảng giá', '/pricing'],
];

export default function MarketingNav({ dark = false }) {
    const [open, setOpen] = useState(false);
    const { auth } = usePage().props;
    const primaryHref = auth?.user ? '/dashboard' : '/register';
    const text = dark ? 'text-white/75 hover:text-white' : 'text-[#426253] hover:text-[#163d2e]';

    return (
        <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10" aria-label="Điều hướng chính">
            <Link href="/" className={`flex items-center gap-2.5 ${dark ? 'text-white' : 'text-[#163d2e]'}`} aria-label="SÂN trang chủ">
                <span className="grid size-9 place-items-center rounded-xl bg-[#d9ff76] text-lg font-black text-[#102d22]">S</span><span className="text-xl font-extrabold tracking-[-.08em]">SÂN</span>
            </Link>
            <div className="hidden items-center gap-5 lg:flex">
                {links.map(([label, href]) => <Link key={href} href={href} className={`text-sm font-semibold transition ${text}`}>{label}</Link>)}
            </div>
            <div className="hidden items-center gap-2 sm:flex">
                {!auth?.user && <Link href="/login" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${text}`}>Đăng nhập</Link>}
                <Link href={primaryHref} className="rounded-full bg-[#d9ff76] px-5 py-2.5 text-sm font-bold text-[#102d22] transition hover:-translate-y-0.5 hover:bg-[#edffb5]">{auth?.user ? 'Quản trị sân' : 'Bắt đầu'}</Link>
            </div>
            <button type="button" className={`grid size-10 place-items-center rounded-xl border lg:hidden ${dark ? 'border-white/20 text-white' : 'border-[#d8e5d5] text-[#163d2e]'}`} aria-label="Mở menu điều hướng" aria-expanded={open} aria-controls="marketing-mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
            {open && <div id="marketing-mobile-menu" className="absolute left-5 right-5 top-[4.6rem] rounded-2xl border border-[#d8e5d5] bg-[#fbfdf8] p-3 shadow-xl lg:hidden">
                {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-[#163d2e] hover:bg-[#edf5e7]">{label}</Link>)}
                <div className="mt-2 border-t border-[#e1eadc] pt-2"><Link href={primaryHref} onClick={() => setOpen(false)} className="block rounded-xl bg-[#d9ff76] px-4 py-3 text-center text-sm font-bold text-[#163d2e]">{auth?.user ? 'Quản trị sân' : 'Bắt đầu cùng SÂN'}</Link></div>
            </div>}
        </nav>
    );
}
