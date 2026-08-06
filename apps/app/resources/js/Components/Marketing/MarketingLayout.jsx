import { Head } from '@inertiajs/react';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

export default function MarketingLayout({ title, children, darkNav = false }) {
    return <main className="min-h-screen overflow-hidden bg-background font-sans text-foreground [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-ring [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-ring"><Head title={title} /><div className={darkNav ? 'bg-foreground text-background' : ''}><MarketingNav dark={darkNav} /></div>{children}<MarketingFooter /></main>;
}
