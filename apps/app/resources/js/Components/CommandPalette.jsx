import { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Calendar, Search, User, MapPin, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';

export function CommandPalette({ open, onOpenChange }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ bookings: [], customers: [], courts: [] });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setQuery('');
            setResults({ bookings: [], customers: [], courts: [] });
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    useEffect(() => {
        if (!query.trim()) {
            setResults({ bookings: [], customers: [], courts: [] });
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(`/manager/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const allResults = [
        ...results.bookings.map((b) => ({ ...b, type: 'booking' })),
        ...results.customers.map((c) => ({ ...c, type: 'customer' })),
        ...results.courts.map((c) => ({ ...c, type: 'court' })),
    ];

    const handleSelect = (item) => {
        onOpenChange(false);
        if (item.type === 'booking') {
            router.visit(route('manager.bookings.show', item.uuid));
        } else if (item.type === 'customer') {
            router.visit(route('manager.customers.show', item.uuid));
        } else if (item.type === 'court') {
            router.visit(route('manager.courts.index'));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && allResults[selectedIndex]) {
            e.preventDefault();
            handleSelect(allResults[selectedIndex]);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking':
                return <Calendar className="h-4 w-4 text-primary" />;
            case 'customer':
                return <User className="h-4 w-4 text-primary" />;
            case 'court':
                return <MapPin className="h-4 w-4 text-primary" />;
            default:
                return null;
        }
    };

    const getLabel = (item) => {
        switch (item.type) {
            case 'booking':
                return `${item.code} - ${item.customer_name || 'Khách vãng lai'}`;
            case 'customer':
                return item.name || item.phone;
            case 'court':
                return item.name;
            default:
                return '';
        }
    };

    const getSublabel = (item) => {
        switch (item.type) {
            case 'booking':
                return item.phone || '';
            case 'customer':
                return item.phone || '';
            case 'court':
                return item.status === 'active' ? 'Đang hoạt động' : 'Đã lưu trữ';
            default:
                return '';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0">
                <div className="flex items-center border-b px-4">
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tìm kiếm đơn đặt sân, khách hàng, sân..."
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="ml-2 rounded p-1 hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    {loading && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Đang tìm kiếm...
                        </div>
                    )}

                    {!loading && query && allResults.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Không tìm thấy kết quả nào
                        </div>
                    )}

                    {!loading && allResults.length > 0 && (
                        <div className="space-y-1">
                            {allResults.map((item, index) => (
                                <button
                                    key={`${item.type}-${item.uuid || item.id}`}
                                    onClick={() => handleSelect(item)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                                        index === selectedIndex
                                            ? 'bg-muted'
                                            : 'hover:bg-muted/50'
                                    }`}
                                >
                                    {getIcon(item.type)}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">{getLabel(item)}</div>
                                        {getSublabel(item) && (
                                            <div className="truncate text-xs text-muted-foreground">
                                                {getSublabel(item)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {item.type === 'booking' && 'Đơn'}
                                        {item.type === 'customer' && 'Khách'}
                                        {item.type === 'court' && 'Sân'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!loading && !query && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Nhập từ khóa để tìm kiếm
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                    <div className="flex gap-2">
                        <kbd className="rounded border px-1.5 py-0.5">↑↓</kbd>
                        <span>Di chuyển</span>
                    </div>
                    <div className="flex gap-2">
                        <kbd className="rounded border px-1.5 py-0.5">↵</kbd>
                        <span>Chọn</span>
                    </div>
                    <div className="flex gap-2">
                        <kbd className="rounded border px-1.5 py-0.5">Esc</kbd>
                        <span>Đóng</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
