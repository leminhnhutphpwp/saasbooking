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
            <PageHeader title="Khách hàng" description={query ? `Kết quả tìm kiếm cho “${query}”` : `${pagination?.total ?? customers.length} khách hàng`} actions={<Button onClick={() => { form.reset(); form.clearErrors(); setOpen(true); }}><Plus className="h-4 w-4" />Thêm khách</Button>} />
            <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc số điện thoại" className="pl-9" aria-label="Tìm khách hàng" /></div>
                <Button type="submit">Tìm</Button>
            </form>
            {customers.length === 0 ? <Card><EmptyState icon={Users} title={query ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'} description={query ? 'Thử lại với tên hoặc số điện thoại khác.' : 'Khách đặt sân sẽ được lưu tự động tại đây.'} action={query && <Button variant="outline" onClick={() => { setSearch(''); router.get(route('manager.customers.index')); }}>Xóa tìm kiếm</Button>} /></Card> : <Card className="p-3 sm:p-6">
                <table className="w-full text-sm" aria-label="Danh sách khách hàng">
                    <thead className="hidden sm:table-header-group"><tr><th scope="col" className="text-left">Khách hàng</th><th scope="col" className="text-left">Liên hệ</th><th scope="col" className="text-right">Lượt đặt</th><th scope="col"><span className="sr-only">Xem chi tiết</span></th></tr></thead>
                    <tbody className="block sm:table-row-group">{customers.map((customer) => <tr key={customer.uuid} className="mb-3 block rounded-inner bg-sunk p-4 last:mb-0 sm:mb-0 sm:table-row sm:rounded-none sm:bg-transparent sm:p-0">
                        <td className="block px-0 py-0 sm:table-cell sm:px-3 sm:py-4"><Link href={route('manager.customers.show', customer.uuid)} className="font-semibold text-foreground hover:text-primary">{customer.name || 'Khách chưa đặt tên'}</Link></td>
                        <td className="mt-2 block px-0 py-0 text-muted-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4">{customer.phone}{customer.email && <span className="block sm:inline">{customer.email && <span className="hidden sm:inline"> · </span>}{customer.email}</span>}</td>
                        <td className="num mt-3 flex items-center justify-between px-0 py-0 text-foreground sm:mt-0 sm:table-cell sm:px-3 sm:py-4 sm:text-right"><span className="manager-label text-muted-foreground sm:hidden">Lượt đặt</span><span>{customer.bookings_count ?? 0}</span></td>
                        <td className="mt-3 block px-0 py-0 text-left sm:mt-0 sm:table-cell sm:px-3 sm:py-4 sm:text-right"><Link href={route('manager.customers.show', customer.uuid)} className="text-sm font-semibold text-primary hover:underline">Xem chi tiết</Link></td>
                    </tr>)}</tbody>
                </table>
            </Card>}
            {pagination && pagination.last_page > 1 && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Trang {pagination.current_page} / {pagination.last_page}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => goPage(pagination.current_page - 1)}><ChevronLeft />Trước</Button><Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => goPage(pagination.current_page + 1)}>Sau<ChevronRight /></Button></div></div>}
        </PageContainer>
        <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Thêm khách hàng</DialogTitle></DialogHeader><form onSubmit={create} className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Tên khách</Label><Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Nguyễn Văn A" />{form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}</div><div className="space-y-2"><Label htmlFor="phone">Số điện thoại</Label><Input id="phone" type="tel" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} placeholder="0901 234 567" required />{form.errors.phone && <p className="text-sm text-destructive">{form.errors.phone}</p>}</div><div className="space-y-2"><Label htmlFor="email">Email (không bắt buộc)</Label><Input id="email" type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} placeholder="khach@example.com" />{form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}</div><DialogFooter><Button type="submit" disabled={form.processing}>Lưu khách hàng</Button></DialogFooter></form></DialogContent></Dialog>
    </ManagerLayout>;
}
