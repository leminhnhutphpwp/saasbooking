import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Search, X, UserPlus, ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react';

function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function Index({ customers, pagination, query }) {
    const [searchInput, setSearchInput] = useState(query || '');
    const debouncedSearch = useDebounce(searchInput, 300);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        router.get(route('manager.customers.index'), { q: searchInput || undefined }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [debouncedSearch]);

    const goToPage = useCallback((page) => {
        router.get(route('manager.customers.index'), { q: query || undefined, page }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [query]);

    const customerList = Array.isArray(customers) ? customers : [];
    const hasResults = customerList.length > 0;
    const isSearching = !!query;

    return (
        <ManagerLayout>
            <Head title="Khách hàng" />

            <PageContainer>
                <PageHeader
                    title="Khách hàng"
                    description="Quản lý thông tin khách hàng"
                />

                {/* Search bar */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo tên hoặc SĐT..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {!hasResults && !isSearching ? (
                    <EmptyState
                        title="Chưa có khách hàng"
                        description="Khách hàng sẽ xuất hiện khi có đặt sân mới."
                    />
                ) : !hasResults && isSearching ? (
                    <EmptyState
                        title="Không tìm thấy"
                        description={`Không có khách hàng nào khớp với "${query}"`}
                    />
                ) : (
                    <>
                        <div className="rounded-lg border border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Khách hàng</TableHead>
                                        <TableHead>Số điện thoại</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Đặt sân</TableHead>
                                        <TableHead className="w-[50px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerList.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                <Link
                                                    href={route('manager.customers.show', c.uuid)}
                                                    className="font-medium text-foreground hover:text-primary hover:underline"
                                                >
                                                    {c.name || 'Chưa cập nhật'}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {c.phone}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {c.email ? (
                                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {c.email}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/50">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                    {c.bookings_count}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={route('manager.customers.show', c.uuid)}
                                                    className="text-muted-foreground hover:text-foreground text-xs"
                                                >
                                                    Xem
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    Trang {pagination.current_page} / {pagination.last_page} · {pagination.total} khách hàng
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.current_page <= 1}
                                        onClick={() => goToPage(pagination.current_page - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.current_page >= pagination.last_page}
                                        onClick={() => goToPage(pagination.current_page + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </PageContainer>
        </ManagerLayout>
    );
}
