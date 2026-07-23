import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/Components/ui/sidebar';
import { managerNav } from '@/managerNav';
import { LogOut, User } from 'lucide-react';

function UserMenu({ user }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline">{user.name}</span>
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="48">
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

export default function ManagerLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;

    // Surface Laravel flash messages as toasts app-wide.
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <Link
                        href={route('manager.calendar.index')}
                        className="flex items-center gap-2 px-2 py-1"
                    >
                        <ApplicationLogo className="h-8 w-8" />
                        <span className="text-lg font-bold text-sidebar-foreground">SÂN</span>
                    </Link>
                </SidebarHeader>

                <SidebarContent>
                    {managerNav.map((group) => (
                        <SidebarGroup key={group.title}>
                            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={route().current(item.href)}
                                                tooltip={item.title}
                                            >
                                                <Link href={route(item.href)}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>

                <SidebarFooter>
                    <div className="flex items-center gap-2 px-2 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium">
                            {user.name?.charAt(0)}
                        </div>
                        <span className="truncate text-sm text-sidebar-foreground/80">{user.name}</span>
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:px-6">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex-1">{header}</div>
                    <UserMenu user={user} />
                </header>

                <main className="flex-1 overflow-auto">{children}</main>
            </SidebarInset>

            <Toaster richColors position="top-right" />
        </SidebarProvider>
    );
}
