import { usePage } from '@inertiajs/react';
import { Moon, Search, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import Dropdown from '@/Components/Dropdown';
import { LogOut, User } from 'lucide-react';
import { SidebarTrigger } from '@/Components/ui/sidebar';

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
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-sm font-semibold text-white transition-shadow hover:shadow-md">
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
                <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                </Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );
}

export function AppTopbar() {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
            <SidebarTrigger className="-ml-1" />

            <div className="flex flex-1 items-center justify-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm... ⌘K"
                        className="h-9 w-full rounded-full border border-input bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                        readOnly
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserAvatar user={user} />
            </div>
        </header>
    );
}
