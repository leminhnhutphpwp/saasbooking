import { Head, router, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { StatCard } from '@/Components/StatCard';
import { OccupancyGauge } from '@/Components/OccupancyGauge';
import { EmptyState } from '@/Components/EmptyState';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { formatVND, formatDate } from '@/lib/format';
import {
    TrendingUp,
    Users,
    XCircle,
    CalendarDays,
    Banknote,
    RefreshCw,
    Award,
    BarChart3,
} from 'lucide-react';

function RevenueChart({ data }) {
    const { path, area, points, max, yAxisLabels } = useMemo(() => {
        const max = Math.max(...data.map((d) => d.total), 1);
        const W = 700;
        const H = 200;
        const padX = 40;
        const padY = 20;
        const usableH = H - padY * 2;
        const stepX = data.length > 1 ? (W - padX * 2) / (data.length - 1) : 0;

        const pts = data.map((d, i) => ({
            x: padX + i * stepX,
            y: padY + usableH - (d.total / max) * usableH,
        }));

        const pathParts = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`);
        const path = pathParts.join(' ');
        const area = `${path} L${pts[pts.length - 1]?.x ?? 0},${H - padY} L${pts[0]?.x ?? 0},${H - padY} Z`;

        // Generate Y-axis labels
        const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
            y: padY + usableH - ratio * usableH,
            value: Math.round(max * ratio),
        }));

        return { path, area, points: pts, max, yAxisLabels };
    }, [data]);

    if (data.length === 0) return null;

    const W = 700;
    const H = 200;
    const padX = 40;
    const padY = 20;

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" className="text-primary" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
                    </linearGradient>
                </defs>
                
                {/* Y-axis grid lines and labels */}
                {yAxisLabels.map((label, i) => (
                    <g key={i}>
                        <line
                            x1={padX}
                            y1={label.y}
                            x2={W - padX}
                            y2={label.y}
                            stroke="currentColor"
                            strokeOpacity="0.1"
                            strokeDasharray="4 4"
                            className="text-muted-foreground"
                        />
                        <text
                            x={padX - 8}
                            y={label.y + 4}
                            textAnchor="end"
                            className="fill-muted-foreground text-[10px]"
                        >
                            {label.value >= 1000000 ? `${(label.value / 1000000).toFixed(1)}M` : label.value >= 1000 ? `${(label.value / 1000).toFixed(0)}K` : label.value}
                        </text>
                    </g>
                ))}
                
                <path d={area} fill="url(#revenueGrad)" />
                <path d={path} fill="none" strokeWidth="2.5" className="stroke-primary" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" className="fill-background stroke-primary" strokeWidth="2.5">
                            <title>{formatDate(data[i].date)}: {formatVND(data[i].total)}</title>
                        </circle>
                        <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer">
                            <title>{formatDate(data[i].date)}: {formatVND(data[i].total)}</title>
                        </circle>
                    </g>
                ))}
            </svg>
            <div className="mt-3 flex justify-between px-10 text-[11px] text-muted-foreground">
                {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1).map((d) => (
                    <span key={d.date}>{formatDate(d.date).slice(0, 5)}</span>
                ))}
            </div>
        </div>
    );
}

export default function Index({ filters, revenueByDay, summary, occupancy, topCustomers }) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilter = () => {
        router.get('/manager/reports', { from, to }, { preserveState: true, preserveScroll: true });
    };

    const isDefault = from === filters.from && to === filters.to;

    return (
        <ManagerLayout>
            <Head title="Báo cáo" />

            <PageContainer>
                <PageHeader
                    title="Báo cáo"
                    description="Tổng hợp hoạt động kinh doanh trong khoảng thời gian"
                />

                <Card>
                    <CardContent className="flex flex-wrap items-end gap-3 p-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Từ ngày</label>
                            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Đến ngày</label>
                            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
                        </div>
                        <Button onClick={applyFilter} variant={isDefault ? 'outline' : 'default'} size="sm" className="h-9 gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Áp dụng
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="Tổng doanh thu"
                        value={formatVND(summary.totalRevenue)}
                        icon={TrendingUp}
                        accent="primary"
                    />
                    <StatCard
                        label="Đặt sân (đã xác nhận)"
                        value={summary.confirmedBookings}
                        icon={CalendarDays}
                        accent="primary"
                    />
                    <Card className="relative">
                        <CardContent className="flex items-center gap-4 p-6">
                            <OccupancyGauge value={occupancy.rate} size={80} strokeWidth={8} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Tỉ lệ lấp đầy</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {occupancy.bookedMinutes} / {occupancy.totalMinutes} phút
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <StatCard
                        label="Tỉ lệ bom"
                        value={`${summary.noShowRate}%`}
                        icon={XCircle}
                        accent="rose"
                    />
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Doanh thu theo ngày
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">
                                Tổng: <strong className="text-foreground">{formatVND(summary.totalRevenue)}</strong>
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {revenueByDay.length === 0 || summary.totalRevenue === 0 ? (
                            <div className="py-12 text-center">
                                <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">
                                    Chưa có dữ liệu doanh thu trong khoảng thời gian này.
                                </p>
                            </div>
                        ) : (
                            <RevenueChart data={revenueByDay} />
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                            <span>Số đơn: <strong className="text-foreground">{summary.confirmedBookings}</strong></span>
                            <span>Bom sân: <strong className="text-foreground">{summary.noShowCount}</strong></span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Banknote className="h-4 w-4 text-primary" />
                                Bom sân &amp; Cọc
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground">Số đơn bom</p>
                                    <p className="mt-1 text-2xl font-bold">{summary.noShowCount}</p>
                                </div>
                                <div className="rounded-xl border bg-primary/10 p-3">
                                    <p className="text-xs text-muted-foreground">Tiền cọc đã thu</p>
                                    <p className="mt-1 text-2xl font-bold text-primary">{formatVND(summary.depositsCollected)}</p>
                                </div>
                                <div className="rounded-xl border bg-primary/10 p-3">
                                    <p className="text-xs text-muted-foreground">Đã hoàn cọc</p>
                                    <p className="mt-1 text-2xl font-bold text-primary">{formatVND(summary.refundsDone)}</p>
                                </div>
                                <div className="rounded-xl border bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground">Số đơn hoàn</p>
                                    <p className="mt-1 text-2xl font-bold">{summary.refundCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Award className="h-4 w-4 text-primary" />
                                Khách hàng thân thiết
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topCustomers.length === 0 ? (
                                <EmptyState
                                    icon={Award}
                                    title="Chưa có dữ liệu khách hàng"
                                    description="Dữ liệu sẽ xuất hiện khi có đơn đặt sân."
                                />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">#</TableHead>
                                            <TableHead>Khách hàng</TableHead>
                                            <TableHead className="text-right">Lượt đặt</TableHead>
                                            <TableHead className="text-right">Tổng chi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topCustomers.map((c, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                                                        i === 0
                                                            ? 'bg-primary text-primary-foreground'
                                                            : i === 1
                                                                ? 'bg-primary/20 text-primary'
                                                                : i === 2
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {i + 1}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={route('manager.customers.show', c.uuid)} className="font-medium text-foreground hover:text-primary transition-colors">
                                                        {c.name}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{c.booking_count} lượt</TableCell>
                                                <TableCell className="text-right font-semibold">{formatVND(c.total_spent)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </ManagerLayout>
    );
}
