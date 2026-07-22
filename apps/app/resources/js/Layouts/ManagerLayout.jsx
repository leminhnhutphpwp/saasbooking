import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Button } from '@/Components/ui/button';
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

function UserMenu({ user }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <span className="inline-flex rounded-md">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                    >
                        {user.name}
                    </button>
                </span>
            </Dropdown.Trigger>

            <Dropdown.Content align="right" width="48">
                <Dropdown.Link href={route('profile.edit')}>Hồ sơ</Dropdown.Link>
                <Dropdown.Link href={route('logout')} method="post" as="button">
                    Đăng xuất
                </Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );
}

export default function ManagerLayout({ header, children }) {
    const user = usePage().props.auth.user;

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-2 py-1 font-semibold"
                    >
                        <ApplicationLogo className="block h-7 w-auto fill-current text-sidebar-foreground" />
                        <span>SÂN</span>
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
                    <div className="px-2 py-1 text-sm text-sidebar-foreground/80">
                        {user.name}
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex-1">{header}</div>
                    <UserMenu user={user} />
                </header>

                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
