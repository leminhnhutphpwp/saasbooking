import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { EmptyState } from '@/Components/EmptyState';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { ChevronLeft, ChevronRight, Plus, Search, Users } from 'lucide-react';

export default function Index({ customers = [], pagination, query = '' }) {
    const [search, setSearch] = useState(query);
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', phone: '', email: '' });
    const submitSearch = (event) => { event.preventDefault(); router.get(route('manager.customers.index'), search ? { q: search } : {}, { preserveState: true, replace: true }); };
    const create = (event) => { event.preventDefault(); form.post(route('manager.customers.store'), { preserveScroll: true, onSuccess: () => { setOpen(false); form.reset(); } }); };
    const goPage = (page) => router.get(route('manager.customers.index'), { page }, { preserveScroll: true });

    return <ManagerLayout>
        <Head title="Khách hàng" />
        <PageContainer>
            <PageHeader title="Khách hàng" description={query ? `Kết quả tìm kiếm cho “${query}”` : `${pagination?.total ?? customers.length} khách hàng`} actions={<Button onClick={() => { form.reset(); form.clearErrors(); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Thêm khách</Button>} />
            <form onSubmit={submitSearch} className="flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc số điện thoại" className="pl-9" aria-label="Tìm khách hàng" /></div>
                <Button type="submit">Tìm</Button>
            </form>
            {customers.length === 0 ? <Card><EmptyState icon={Users} title={query ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'} description={query ? 'Thử lại với tên hoặc số điện thoại khác.' : 'Khách đặt sân sẽ được lưu tự động tại đây.'} action={query && <Button variant="outline" onClick={() => { setSearch(''); router.get(route('manager.customers.index')); }}>Xóa tìm kiếm</Button>} /></Card> : <Card className="overflow-hidden"><div className="divide-y">{customers.map((customer) => <Link key={customer.uuid} href={route('manager.customers.show', customer.uuid)} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="min-w-0"><p className="truncate font-semibold">{customer.name || 'Khách chưa đặt tên'}</p><p className="mt-1 text-sm text-muted-foreground">{customer.phone}{customer.email && ` · ${customer.email}`}</p></div>{customer.bookings_count !== undefined && <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{customer.bookings_count} lượt đặt</span>}</Link>)}</div></Card>}
            {pagination && pagination.last_page > 1 && <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Trang {pagination.current_page} / {pagination.last_page}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => goPage(pagination.current_page - 1)}><ChevronLeft className="h-4 w-4" />Trước</Button><Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => goPage(pagination.current_page + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button></div></div>}
        </PageContainer>
        <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Thêm khách hàng</DialogTitle></DialogHeader><form onSubmit={create} className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Tên khách</Label><Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Nguyễn Văn A" />{form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}</div><div className="space-y-2"><Label htmlFor="phone">Số điện thoại</Label><Input id="phone" type="tel" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} placeholder="0901 234 567" required />{form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}</div><div className="space-y-2"><Label htmlFor="email">Email (không bắt buộc)</Label><Input id="email" type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} placeholder="khach@example.com" />{form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}</div><DialogFooter><Button type="submit" disabled={form.processing}>Lưu khách hàng</Button></DialogFooter></form></DialogContent></Dialog>
    </ManagerLayout>;
}
