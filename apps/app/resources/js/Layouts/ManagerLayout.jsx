import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { AppTopbar } from '@/Components/AppTopbar';
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

export default function ManagerLayout({ children }) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" className="border-r border-sidebar-border">
                <SidebarHeader className="border-b border-sidebar-border">
                    <Link
                        href={route('manager.home')}
                        className="flex items-center gap-3 px-3 py-4"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 shadow-sm">
                            <ApplicationLogo className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                            <span className="text-base font-bold leading-tight text-foreground">SÂN</span>
                            <span className="text-[10px] leading-tight text-muted-foreground">Court Management</span>
                        </div>
                    </Link>
                </SidebarHeader>

                <SidebarContent className="px-2 py-4">
                    {managerNav.map((group) => (
                        <SidebarGroup key={group.title} className="mb-4">
                            <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
                                {group.title}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-1">
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={route().current(item.href + '*')}
                                                tooltip={item.title}
                                                className="rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground data-[active=true]:bg-accent data-[active=true]:font-semibold data-[active=true]:text-accent-foreground"
                                            >
                                                <Link href={route(item.href)}>
                                                    <item.icon className="h-4 w-4 shrink-0" />
                                                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>

                <SidebarFooter className="border-t border-sidebar-border p-3">
                    <SidebarTrigger className="mx-auto h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" />
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="flex flex-col">
                <AppTopbar />
                <main className="flex-1 overflow-auto">{children}</main>
            </SidebarInset>

            <Toaster richColors position="top-right" />
        </SidebarProvider>
    );
}
