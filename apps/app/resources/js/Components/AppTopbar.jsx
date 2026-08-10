import { Link, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronDown, LogOut, Plus, User } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { managerNav } from '@/managerNav';

function TenantSwitcher({ tenants, workingTenantId }) {
    const current = tenants.find((tenant) => tenant.id === workingTenantId) ?? tenants[0];

    if (tenants.length < 2) {
        return (
            <div className="flex h-9 max-w-52 items-center gap-2 rounded-full bg-secondary px-3 text-sm font-medium text-foreground">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{current?.name}</span>
            </div>
        );
    }

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button className="flex h-9 max-w-52 items-center gap-2 rounded-full bg-secondary px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <Building2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{current.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" width="48">
                <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">Cơ sở đang quản lý</div>
                {tenants.map((tenant) => (
                    <Dropdown.Link
                        key={tenant.id}
                        href={route('tenant.switch')}
                        method="post"
                        as="button"
                        data={{ tenant_id: tenant.id }}
                        className="flex items-center justify-between gap-3"
                    >
                        <span className="min-w-0">
                            <span className="block truncate">{tenant.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{tenant.service?.name}</span>
                        </span>
                        {tenant.id === workingTenantId && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </Dropdown.Link>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}

function UserAvatar({ user }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    {user.name?.charAt(0)?.toUpperCase()}
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="48">
                <div className="border-b px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Hồ sơ
                </Dropdown.Link>
                <Dropdown.Link href={route('services.register')} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Mở thêm dịch vụ
                </Dropdown.Link>
                <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                </Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );
}

export function AppTopbar() {
    const { props: { auth, workingTenants = [], workingTenantId }, url } = usePage();
    const user = auth.user;
    const tabsRef = useRef(null);
    const activeLinkRef = useRef(null);
    const [activePill, setActivePill] = useState(null);
    const allNavigationItems = managerNav.flatMap((group) => group.items);
    const navigationItems = allNavigationItems.slice(0, 5);
    const activeItem = allNavigationItems.find((item) => route().current(item.href + '*'));

    useLayoutEffect(() => {
        const updateActivePill = () => {
            if (!tabsRef.current || !activeLinkRef.current) return;

            const tabs = tabsRef.current.getBoundingClientRect();
            const active = activeLinkRef.current.getBoundingClientRect();
            setActivePill({ transform: `translateX(${active.left - tabs.left}px)`, width: active.width });
        };

        updateActivePill();
        let mobileScrollFrame;
        if (window.matchMedia('(max-width: 767px)').matches) {
            mobileScrollFrame = window.requestAnimationFrame(() => {
                tabsRef.current.scrollLeft = activeLinkRef.current.offsetLeft + activeLinkRef.current.offsetWidth - tabsRef.current.clientWidth;
            });
        }
        window.addEventListener('resize', updateActivePill);
        return () => {
            window.removeEventListener('resize', updateActivePill);
            if (mobileScrollFrame) window.cancelAnimationFrame(mobileScrollFrame);
        };
    }, [url]);

    const moveTopbarFocus = (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

        const links = [...event.currentTarget.querySelectorAll('[data-topbar-link]')];
        const current = links.indexOf(document.activeElement);
        if (current < 0) return;

        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
        links[next].focus();
    };

    return (
        <header className="manager-topbar sm:grid sm:grid-cols-3">
            <div className="hidden min-w-0 items-center sm:flex">
                <span className="manager-label truncate text-ink-mute">{activeItem?.title ?? 'Quản lý sân'}</span>
            </div>
            <nav ref={tabsRef} className="manager-topbar-tabs sm:justify-center" aria-label="Điều hướng nhanh" onKeyDown={moveTopbarFocus}>
                {activePill && <span className="manager-topbar-active-pill" aria-hidden="true" style={activePill} />}
                {navigationItems.map((item) => {
                    const active = route().current(item.href + '*');
                    return <Link key={item.href} href={route(item.href)} ref={active ? activeLinkRef : null} data-topbar-link className={`manager-topbar-tab ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>{item.title}</Link>;
                })}
            </nav>

            <div className="manager-topbar-actions ml-auto sm:ml-0 sm:justify-self-end">
                <TenantSwitcher tenants={workingTenants} workingTenantId={workingTenantId} />
                <UserAvatar user={user} />
            </div>
        </header>
    );
}
