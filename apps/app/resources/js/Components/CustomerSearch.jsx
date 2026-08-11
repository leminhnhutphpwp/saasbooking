import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Customer search combobox for the walk-in dialog.
 * Searches by phone/name via JSON API, shows results in a dropdown.
 * On select: calls onSelect(customer).
 * On clear: calls onClear().
 */
export default function CustomerSearch({ onSelect, onClear }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const search = useCallback((q) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(() => {
            setLoading(true);
            fetch(`/manager/customers/search?q=${encodeURIComponent(q)}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then((r) => r.json())
                .then((data) => {
                    setResults(data);
                    setOpen(true);
                })
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 250);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setSelected(null);
        onClear?.();
        search(val);
    };

    const handleSelect = (customer) => {
        setSelected(customer);
        setQuery('');
        setOpen(false);
        onSelect?.(customer);
    };

    const handleClear = () => {
        setSelected(null);
        setQuery('');
        setResults([]);
        setOpen(false);
        onClear?.();
        inputRef.current?.focus();
    };

    // Selected customer display
    if (selected) {
        return (
            <div className="flex items-center gap-3 rounded-[8px] border border-turf-300 bg-turf-100/50 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-turf-600 text-xs font-bold text-white">
                    {selected.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{selected.name || 'Chưa có tên'}</p>
                    <p className="truncate text-xs text-muted-foreground tabular-nums">
                        {selected.phone} · {selected.code}
                        {selected.bookings_count > 0 && ` · ${selected.bookings_count} lịch đặt`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleClear}
                    className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-sunk hover:text-foreground"
                    aria-label="Xóa chọn"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    // Search input
    return (
        <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-2 rounded-[var(--r-pill)] border border-input bg-sunk px-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Tìm SĐT hoặc tên khách..."
                    value={query}
                    onChange={handleChange}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    aria-label="Tìm khách hàng"
                    aria-expanded={open}
                    role="combobox"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                        aria-label="Xóa tìm kiếm"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-[8px] border border-border bg-white shadow-[var(--e-float)]">
                    {loading ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">Đang tìm...</div>
                    ) : results.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
                            {results.map((c) => (
                                <li
                                    key={c.id}
                                    role="option"
                                    tabIndex={0}
                                    onClick={() => handleSelect(c)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(c)}
                                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-turf-100 focus:bg-turf-100 focus:outline-none"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunk text-xs font-bold text-ink-soft">
                                        {c.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">{c.name || 'Chưa có tên'}</p>
                                        <p className="truncate text-xs text-muted-foreground tabular-nums">{c.phone} · {c.code}</p>
                                    </div>
                                    {c.bookings_count > 0 && (
                                        <span className="shrink-0 text-[10px] text-muted-foreground">{c.bookings_count} lịch</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : query.length >= 2 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">Không tìm thấy khách</div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
