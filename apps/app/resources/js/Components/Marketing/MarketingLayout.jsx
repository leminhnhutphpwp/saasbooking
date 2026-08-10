import { Head } from '@inertiajs/react';
import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

export default function MarketingLayout({ title, children, darkNav = false }) {
    return <div className="min-h-screen bg-plane font-ui text-ink"><Head title={title} /><div style={darkNav ? { backgroundColor: 'var(--pitch-900)' } : undefined}><MarketingNav dark={darkNav} /></div><main>{children}</main><MarketingFooter /></div>;
}
