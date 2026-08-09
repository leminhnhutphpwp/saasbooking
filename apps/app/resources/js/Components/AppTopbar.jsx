import { Link, usePage } from '@inertiajs/react';
import { Bell, Building2, Check, ChevronDown, LogOut, Moon, Plus, Search, Sun, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { SidebarTrigger } from '@/Components/ui/sidebar';
import { CommandPalette } from '@/Components/CommandPalette';

function TenantSwitcher({ tenants, workingTenantId }) {
    if (tenants.length < 2) return null;

    const current = tenants.find((tenant) => tenant.id === workingTenantId) ?? tenants[0];

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button className="flex h-9 max-w-52 items-center gap-2 rounded-full border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
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

function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggle = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
        >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
    );
}

function UserAvatar({ user }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-md">
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
    const { auth, workingTenants = [], workingTenantId } = usePage().props;
    const user = auth.user;
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
                <SidebarTrigger className="md:hidden" aria-label="Mở menu điều hướng" />
                <div className="flex flex-1 items-center justify-center">
                    <button
                        onClick={() => setCommandPaletteOpen(true)}
                        className="relative w-full max-w-md"
                    >
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <div className="flex h-9 w-full items-center rounded-full border border-input bg-muted pl-9 pr-4 text-sm text-muted-foreground transition-colors hover:bg-muted/80">
                            <span className="flex-1 text-left">Tìm kiếm...</span>
                            <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-xs sm:inline-block">
                                ⌘K
                            </kbd>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <TenantSwitcher tenants={workingTenants} workingTenantId={workingTenantId} />
                    <ThemeToggle />
                    <UserAvatar user={user} />
                </div>
            </header>
            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
        </>
    );
}
