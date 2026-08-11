import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { EmptyState } from '@/Components/EmptyState';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { formatVND, formatDate } from '@/lib/format';
import { Award, BarChart3, CircleAlert, Grid3x3, RefreshCw, Settings, TrendingUp, WalletCards } from 'lucide-react';

function compactVND(value) {
    if (value >= 1000000000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1000000000)} tỷ`;
    if (value >= 1000000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1000000)}tr`;
    if (value >= 1000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value / 1000)}k`;

    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

function chartDate(date) {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(`${date}T00:00:00`));
}

function RevenueChart({ data }) {
    const [activeDay, setActiveDay] = useState(null);
    const [chartWidth, setChartWidth] = useState(700);
    const chartRef = useRef(null);
    useLayoutEffect(() => {
        const chart = chartRef.current;
        if (!chart) return undefined;

        const resizeObserver = new ResizeObserver(([entry]) => setChartWidth(Math.round(entry.contentRect.width)));
        resizeObserver.observe(chart);

        return () => resizeObserver.disconnect();
    }, []);
    if (data.length === 0) return null;

    const max = Math.max(...data.map((day) => day.total), 1);
    const peak = Math.max(...data.map((day) => day.total), 0);
    const chartLeft = Math.min(112, Math.max(56, chartWidth * 0.16));
    const chartRight = chartWidth - 16;
    const baseline = 210;
    const maximumPoints = chartWidth < 480 ? 6 : 8;
    const sampleEvery = Math.ceil((data.length - 1) / (maximumPoints - 1));
    const visibleIndexes = data.length > maximumPoints
        ? data.reduce((indexes, _, index) => (index % sampleEvery === 0 || index === data.length - 1 ? [...indexes, index] : indexes), [])
        : data.map((_, index) => index);
    const peakIndex = data.findIndex((day) => day.total === peak);
    if (peak > 0 && !visibleIndexes.includes(peakIndex)) {
        visibleIndexes.splice(1, 1, peakIndex);
        visibleIndexes.sort((first, second) => first - second);
    }
    const visible = visibleIndexes.map((index) => data[index]);
    const summary = data.map((day) => `${formatDate(day.date)}: ${formatVND(day.total)}`).join(', ');

    return <div ref={chartRef} role="img" aria-label={`Biểu đồ doanh thu từ ${formatDate(data[0]?.date)} đến ${formatDate(data.at(-1)?.date)}. ${summary}`}>
        <svg viewBox={`0 0 ${chartWidth} 260`} className="h-auto w-full" aria-hidden="true">
            <defs>
                <pattern id="report-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-invert)" strokeOpacity=".45" strokeWidth="2" />
                </pattern>
            </defs>
            {[40, 90, 150].map((y) => <line key={y} x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="var(--line)" strokeDasharray="4 6" />)}
            <line x1={chartLeft} x2={chartRight} y1={baseline} y2={baseline} stroke="var(--ink-mute)" />
            <text x={chartLeft - 12} y="44" textAnchor="end" fill="var(--ink-mute)" fontSize="11">{compactVND(max)}</text>
            <text x={chartLeft - 12} y="214" textAnchor="end" fill="var(--ink-mute)" fontSize="11">0</text>
            {visible.map((day, index) => {
                const width = Math.max(40, Math.min(48, 500 / visible.length));
                const x = chartLeft + index * ((chartRight - chartLeft) / Math.max(visible.length - 1, 1));
                const height = day.total ? Math.max((day.total / max) * 160, 8) : 0;
                const highlighted = day.total === peak && peak > 0;
                const tooltipX = Math.min(Math.max(x - 65, chartLeft), chartRight - 132);

                return <g key={day.date}>
                    <title>{`${formatDate(day.date)}: ${formatVND(day.total)}`}</title>
                    {height > 0 && <>
                        <rect tabIndex="0" onMouseEnter={() => setActiveDay(index)} onMouseLeave={() => setActiveDay(null)} onFocus={() => setActiveDay(index)} onBlur={() => setActiveDay(null)} x={x - width / 2} y={baseline - height} width={width} height={height} rx="999" ry="999" fill={highlighted ? 'var(--turf-700)' : 'var(--turf-300)'}>
                            <title>{`${formatDate(day.date)}: ${formatVND(day.total)}`}</title>
                        </rect>
                        <rect x={x - width / 2} y={baseline - height} width={width} height={height} rx="999" ry="999" fill="url(#report-hatch)" pointerEvents="none" />
                    </>}
                    {activeDay === index && <g pointerEvents="none">
                        <circle cx={x} cy={baseline - height} r="5" fill="var(--turf-700)" />
                        <path d={`M${x - 4},${Math.max(24, 184 - height)} L${x + 4},${Math.max(24, 184 - height)} L${x},${Math.max(30, 190 - height)} Z`} fill="var(--turf-700)" />
                        <rect x={tooltipX} y={Math.max(8, 158 - height)} width="132" height="22" rx="11" fill="var(--turf-700)" />
                        <text x={tooltipX + 66} y={Math.max(23, 173 - height)} textAnchor="middle" fill="var(--ink-invert)" fontSize="11" fontWeight="600">{`${formatDate(day.date)} ${formatVND(day.total)}`}</text>
                    </g>}
                    {highlighted && <text x={x} y={Math.max(16, 204 - height)} textAnchor="middle" fill="var(--ink-soft)" fontSize="11">{formatVND(day.total)}</text>}
                    <text x={x} y="238" textAnchor="middle" fill="var(--ink-mute)" fontSize="11">{chartDate(day.date)}</text>
                </g>;
            })}
        </svg>
        <span className="sr-only">{summary}</span>
    </div>;
}

function OccupancyGauge({ rate, bookedMinutes, totalMinutes }) {
    const value = Math.min(rate, 100);
    return <div role="img" aria-label={`Tỉ lệ lấp đầy ${rate} phần trăm`}><p className="manager-metric num text-3xl">{rate}%</p><p className="mt-1 text-sm text-muted-foreground">Công suất sân</p><div className="mt-3 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div><p className="num mt-2 text-xs text-muted-foreground">{Math.round(bookedMinutes / 60)} / {Math.round(totalMinutes / 60)} giờ đã sử dụng</p></div>;
}

function getHeatmapColor(rate) {
    if (rate >= 75) return 'var(--turf-700)';
    if (rate >= 50) return 'var(--turf-600)';
    if (rate >= 25) return 'var(--turf-300)';
    return 'var(--turf-100)';
}

function getHeatmapTextColor(rate) {
    if (rate >= 50) return 'var(--ink-invert)';
    return 'var(--ink)';
}

function UtilizationHeatmap({ hourly, coverage }) {
    const [focusedIndex, setFocusedIndex] = useState(null);
    const cellsRef = useRef([]);

    const hours = hourly.map((h) => h.hour);
    const minHour = hours.length > 0 ? Math.min(...hours) : 6;
    const maxHour = hours.length > 0 ? Math.max(...hours) : 23;
    const displayHours = [];
    for (let h = Math.max(minHour, 6); h <= Math.min(maxHour, 23); h++) {
        displayHours.push(h);
    }

    const hourlyMap = {};
    hourly.forEach((h) => {
        hourlyMap[h.hour] = h;
    });

    const handleKeyDown = useCallback((e, index) => {
        let nextIndex = index;
        if (e.key === 'ArrowRight') {
            nextIndex = Math.min(index + 1, displayHours.length - 1);
        } else if (e.key === 'ArrowLeft') {
            nextIndex = Math.max(index - 1, 0);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFocusedIndex(focusedIndex === index ? null : index);
            return;
        } else {
            return;
        }
        e.preventDefault();
        if (nextIndex !== index && cellsRef.current[nextIndex]) {
            cellsRef.current[nextIndex].focus();
        }
    }, [displayHours.length, focusedIndex]);

    if (coverage === 'none') {
        return <EmptyState icon={Settings} title="Thiếu giờ mở cửa" description="Cần cài đặt giờ mở cửa cho sân để tính công suất theo giờ." className="py-8" action={<Link href={route('manager.courts.index')} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"><Settings className="h-4 w-4" />Cài đặt sân</Link>} />;
    }

    if (hourly.length === 0) {
        return <EmptyState icon={Grid3x3} title="Chưa có dữ liệu hoạt động" description="Không có dữ liệu công suất trong khoảng thời gian đã chọn." className="py-8" />;
    }

    return <div role="grid" aria-label="Biểu đồ nhiệt công suất theo giờ" className="w-full">
        <div className="overflow-x-auto">
            <div className="inline-flex min-w-full flex-col gap-1">
                <div className="flex gap-1" role="row">
                    <div className="w-12 shrink-0" role="columnheader" aria-label="Giờ" />
                    {displayHours.map((hour) => <div key={hour} className="flex h-8 w-10 shrink-0 items-center justify-center text-xs text-muted-foreground num" role="columnheader">{String(hour).padStart(2, '0')}:00</div>)}
                </div>
                <div className="flex gap-1" role="row">
                    <div className="flex w-12 shrink-0 items-center text-xs font-medium text-muted-foreground" role="rowheader">Công suất</div>
                    {displayHours.map((hour, index) => {
                        const data = hourlyMap[hour];
                        const isAvailable = !!data;
                        const rate = data?.rate ?? 0;
                        const bookedMinutes = data?.bookedMinutes ?? 0;
                        const availableMinutes = data?.availableMinutes ?? 0;
                        const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                        const ariaLabel = isAvailable ? `${hourLabel} - ${rate}% công suất (${bookedMinutes}/${availableMinutes} phút)` : `${hourLabel} - Không có dữ liệu`;

                        return <div key={hour} ref={(el) => { cellsRef.current[index] = el; }} role="gridcell" tabIndex={index === 0 ? 0 : -1} aria-label={ariaLabel} onKeyDown={(e) => handleKeyDown(e, index)} onFocus={() => setFocusedIndex(index)} onBlur={() => setFocusedIndex(null)} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-inner text-xs font-semibold num transition-all" style={{ backgroundColor: isAvailable ? getHeatmapColor(rate) : 'var(--sunk)', color: isAvailable ? getHeatmapTextColor(rate) : 'var(--ink-mute)', outline: focusedIndex === index ? '2px solid var(--turf-600)' : 'none', outlineOffset: '2px' }}>
                            {isAvailable ? `${rate}%` : '—'}
                            {focusedIndex === index && isAvailable && <div className="ui-float absolute bottom-full left-1/2 z-10 mb-2 whitespace-nowrap px-3 py-1.5 text-xs shadow-float" style={{ transform: 'translateX(-50%)' }}><span className="font-semibold">{hourLabel}</span> — {rate}% ({bookedMinutes}/{availableMinutes} phút)</div>}
                        </div>;
                    })}
                </div>
            </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Thấp</span>
            <div className="flex gap-0.5">
                <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'var(--turf-100)' }} />
                <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'var(--turf-300)' }} />
                <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'var(--turf-600)' }} />
                <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: 'var(--turf-700)' }} />
            </div>
            <span>Cao</span>
        </div>
    </div>;
}

export default function Index({ filters, revenueByDay, summary, occupancy, topCustomers, utilization }) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilter = () => {
        if (from > to) return;
        router.get('/manager/reports', { from, to }, { preserveState: true, preserveScroll: true });
    };

    const setQuickRange = (days) => {
        const today = new Date();
        const fromDate = new Date();
        if (days === 'month') {
            fromDate.setDate(1);
        } else {
            fromDate.setDate(today.getDate() - days + 1);
        }
        const newFrom = fromDate.toISOString().split('T')[0];
        const newTo = today.toISOString().split('T')[0];
        setFrom(newFrom);
        setTo(newTo);
        router.get('/manager/reports', { from: newFrom, to: newTo }, { preserveState: true, preserveScroll: true });
    };

    const isDefault = from === filters.from && to === filters.to;
    const isInvalid = from > to;

    return <ManagerLayout><Head title="Báo cáo" /><PageContainer><PageHeader title="Báo cáo" description="Theo dõi doanh thu, công suất và rủi ro theo khoảng thời gian." />
        <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end"><div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label htmlFor="report-from" className="text-xs font-medium text-muted-foreground">Từ ngày</label><Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9 w-full" /></div><div className="space-y-1"><label htmlFor="report-to" className="text-xs font-medium text-muted-foreground">Đến ngày</label><Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-9 w-full" /></div></div><div className="flex flex-wrap items-center gap-2"><div className="flex flex-wrap gap-1"><button type="button" onClick={() => setQuickRange(0)} className="rounded-full bg-sunk px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-turf-100 hover:text-turf-700">Hôm nay</button><button type="button" onClick={() => setQuickRange(6)} className="rounded-full bg-sunk px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-turf-100 hover:text-turf-700">7 ngày qua</button><button type="button" onClick={() => setQuickRange(29)} className="rounded-full bg-sunk px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-turf-100 hover:text-turf-700">30 ngày qua</button><button type="button" onClick={() => setQuickRange('month')} className="rounded-full bg-sunk px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-turf-100 hover:text-turf-700">Tháng này</button></div><Button onClick={applyFilter} disabled={isInvalid} variant={isDefault ? 'outline' : 'default'} size="sm" className="h-9 gap-1.5 sm:mb-0"><RefreshCw className="h-3.5 w-3.5" />Áp dụng</Button></div></CardContent>{isInvalid && <p className="px-4 pb-3 text-xs text-destructive">Ngày bắt đầu phải trước ngày kết thúc.</p>}</Card>
        <Card><CardContent className="grid gap-6 p-6 lg:grid-cols-2"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><TrendingUp className="h-4 w-4" />Doanh thu trong kỳ</div><p className="manager-metric num mt-3 break-words text-3xl sm:text-4xl">{formatVND(summary.totalRevenue)}</p><div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4"><div><p className="text-xs text-muted-foreground">Lịch đã xác nhận</p><p className="manager-metric num mt-1 text-xl">{summary.confirmedBookings}</p></div><div><p className="text-xs text-muted-foreground">Tỉ lệ bom sân</p><p className="manager-metric num mt-1 text-xl">{summary.noShowRate}%</p></div></div></div><OccupancyGauge {...occupancy} /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Doanh thu theo ngày</CardTitle><p className="manager-card-sub text-muted-foreground">Các ngày không phát sinh vẫn được hiển thị để thấy nhịp hoạt động.</p></CardHeader><CardContent>{revenueByDay.length === 0 || summary.totalRevenue === 0 ? <EmptyState icon={BarChart3} title="Chưa có dữ liệu doanh thu" description="Hãy chọn một khoảng thời gian khác hoặc chờ lịch đã xác nhận phát sinh." className="py-8" /> : <RevenueChart data={revenueByDay} />}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Grid3x3 className="h-4 w-4 text-muted-foreground" />Công suất theo giờ</CardTitle><p className="manager-card-sub text-muted-foreground">Tỉ lệ lấp đầy trung bình theo từng giờ trong khoảng thời gian đã chọn.</p></CardHeader><CardContent><UtilizationHeatmap hourly={utilization.hourly} coverage={utilization.coverage} /></CardContent></Card>
        <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-primary" />Dòng tiền và rủi ro</CardTitle></CardHeader><CardContent><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Cọc đã thu</dt><dd className="manager-metric num mt-1 break-words text-lg">{formatVND(summary.depositsCollected)}</dd></div><div><dt className="text-xs text-muted-foreground">Cọc đã hoàn</dt><dd className="manager-metric num mt-1 break-words text-lg">{formatVND(summary.refundsDone)}</dd></div><div><dt className="text-xs text-muted-foreground">Yêu cầu hoàn đã xử lý</dt><dd className="manager-metric num mt-1 text-lg">{summary.refundCount}</dd></div><div><dt className="text-xs text-muted-foreground">Đơn bom sân</dt><dd className="manager-metric num mt-1 flex items-center gap-2 text-lg"><CircleAlert className="h-4 w-4 text-destructive" />{summary.noShowCount}</dd></div></dl></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" />Khách hàng thân thiết</CardTitle><p className="manager-card-sub text-muted-foreground">Xếp theo số lượt đặt đã xác nhận trong kỳ.</p></CardHeader><CardContent>{topCustomers.length === 0 ? <EmptyState icon={Award} title="Chưa có dữ liệu khách hàng" description="Khách hàng có lịch đã xác nhận sẽ xuất hiện ở đây." className="py-6" /> : <ol className="divide-y divide-border">{topCustomers.map((customer, index) => <li key={customer.id}><Link href={route('manager.customers.show', customer.id)} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-turf-100"><div className="flex min-w-0 items-center gap-3"><span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{customer.name}</p><p className="truncate text-xs text-muted-foreground">{customer.phone}</p></div></div><div className="min-w-0 shrink-0 text-right"><p className="num text-sm font-semibold text-foreground">{customer.booking_count} lượt</p><p className="num max-w-28 break-words text-xs text-muted-foreground sm:max-w-none">{formatVND(customer.total_spent)}</p></div></Link></li>)}</ol>}</CardContent></Card></div>
    </PageContainer></ManagerLayout>;
}
