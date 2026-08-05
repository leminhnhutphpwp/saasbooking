import { Head } from '@inertiajs/react';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

export default function MarketingLayout({ title, children, darkNav = false }) {
    return <main className="min-h-screen overflow-hidden bg-[#f5f7f2] font-sans text-[#12231b] [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#d9ff76] [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#d9ff76]"><Head title={title} /><div className={darkNav ? 'bg-[#102d22]' : ''}><MarketingNav dark={darkNav} /></div>{children}<MarketingFooter /></main>;
}
