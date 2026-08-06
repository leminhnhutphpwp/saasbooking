import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
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
    const { flash, workingTenants = [], workingTenantId } = usePage().props;
    const currentTenant = workingTenants.find((tenant) => tenant.id === workingTenantId);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    return (
        <SidebarProvider>
            <Sidebar variant="inset" collapsible="icon" className="border-0 p-2">
                <SidebarHeader className="p-1">
                    <Link
                        href={route('manager.home')}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-sidebar-accent"
                    >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-lg font-black text-sidebar-primary-foreground shadow-sm">S</span>
                        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                            <span className="block text-base font-extrabold leading-tight tracking-tight text-foreground">SÂN</span>
                            <span className="block truncate text-[11px] font-medium text-muted-foreground">{currentTenant?.name ?? 'Không gian vận hành'}</span>
                        </div>
                    </Link>
                </SidebarHeader>

                <SidebarContent className="px-2 py-5">
                    {managerNav.map((group) => (
                        <SidebarGroup key={group.title} className="mb-5 p-0 last:mb-0">
                            <SidebarGroupLabel className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                                <group.icon className="size-3.5 shrink-0" />
                                <span className="group-data-[collapsible=icon]:hidden">{group.title}</span>
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-1.5">
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={route().current(item.href + '*')}
                                                tooltip={item.title}
                                                className="h-10 rounded-xl px-3 text-sm font-semibold text-sidebar-foreground transition-all hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
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

                <SidebarFooter className="p-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
                        <span className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]" aria-hidden="true" />
                        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                            <p className="truncate text-xs font-bold text-foreground">Hệ thống sẵn sàng</p>
                            <p className="truncate text-[11px] text-muted-foreground">Theo dõi vận hành sân</p>
                        </div>
                        <SidebarTrigger className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-sidebar hover:text-foreground group-data-[collapsible=icon]:size-10" />
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="flex min-w-0 flex-col bg-background">
                <AppTopbar />
                <main className="flex-1 overflow-auto">{children}</main>
            </SidebarInset>

            <Toaster richColors position="top-right" />
        </SidebarProvider>
    );
}
