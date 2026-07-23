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

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <SidebarProvider>
            <Sidebar collapsible="offcanvas">
                <SidebarHeader>
                    <Link
                        href={route('manager.home')}
                        className="flex items-center gap-3 px-3 py-2"
                    >
                        <ApplicationLogo className="h-9 w-9 rounded-lg bg-sidebar-primary p-1.5 text-sidebar-primary-foreground" />
                        <div className="flex flex-col">
                            <span className="text-base font-bold leading-tight text-sidebar-foreground">SÂN</span>
                            <span className="text-[10px] leading-tight text-sidebar-foreground/50">Court Management</span>
                        </div>
                    </Link>
                </SidebarHeader>

                <SidebarContent>
                    {managerNav.map((group) => (
                        <SidebarGroup key={group.title}>
                            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                                {group.title}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={route().current(item.href + '*')}
                                                tooltip={item.title}
                                                className="mx-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground"
                                            >
                                                <Link href={route(item.href)}>
                                                    <item.icon className="h-4 w-4" />
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
                    <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</span>
                            <span className="truncate text-[11px] text-sidebar-foreground/50">{user.email}</span>
                        </div>
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
