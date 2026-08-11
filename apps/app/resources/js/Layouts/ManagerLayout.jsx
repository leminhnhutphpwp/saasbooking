import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';
import { AppTopbar } from '@/Components/AppTopbar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/Components/ui/tooltip';
import { managerNav } from '@/managerNav';

export default function ManagerLayout({ children }) {
    const { flash } = usePage().props;
    const [moreOpen, setMoreOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const moveRailFocus = (event) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

        const controls = [...event.currentTarget.querySelectorAll('[data-rail-control]')].filter((control) => control.offsetParent !== null);
        const current = controls.indexOf(document.activeElement);
        if (current < 0) return;

        event.preventDefault();
        const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (current + (forward ? 1 : -1) + controls.length) % controls.length;
        controls[next].focus();
    };

    return (
        <div className="manager-plane">
            <div className="manager-shell !max-w-none">
                <AppTopbar />
                <div className="manager-body">
                    <TooltipProvider delayDuration={300}>
                        <nav className="manager-rail" aria-label="Điều hướng quản lý" onKeyDown={moveRailFocus}>
                            <Link href={route('manager.home')} className="manager-rail-logo" aria-label="Trang chủ SÂN">
                                <span>S</span>
                            </Link>
                            {managerNav.map((group) => (
                                <div className="manager-rail-group" key={group.title} role="group" aria-label={group.title}>
                                    {group.items.map((item) => {
                                        const active = route().current(item.href + '*');
                                        return (
                                            <Tooltip key={item.href}>
                                                <TooltipTrigger asChild>
                                                    <Link href={route(item.href)} data-rail-control className={`manager-rail-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined} aria-label={item.title}>
                                                        <item.icon />
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">{item.title}</TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            ))}
                            <button type="button" data-rail-control className="manager-rail-more" aria-label="Mở thêm điểm đến" aria-expanded={moreOpen} aria-controls="manager-rail-overflow" onClick={() => setMoreOpen((open) => !open)}>
                                <MoreHorizontal />
                            </button>
                            <div id="manager-rail-overflow" className={`manager-rail-overflow ${moreOpen ? 'is-open' : ''}`} aria-label="Điểm đến khác">
                                {managerNav.slice(1).flatMap((group) => group.items).map((item) => {
                                    const active = route().current(item.href + '*');
                                    return (
                                        <Tooltip key={item.href}>
                                            <TooltipTrigger asChild>
                                                <Link href={route(item.href)} data-rail-control className={`manager-rail-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined} aria-label={item.title} onClick={() => setMoreOpen(false)}>
                                                    <item.icon />
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">{item.title}</TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </nav>
                    </TooltipProvider>
                    <main className="manager-main">{children}</main>
                </div>
            </div>

            <Toaster richColors position="top-right" />
        </div>
    );
}
