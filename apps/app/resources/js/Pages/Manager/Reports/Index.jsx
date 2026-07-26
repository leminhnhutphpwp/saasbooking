import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { StatCard } from '@/Components/StatCard';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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
    const { path, area, points, max } = useMemo(() => {
        const max = Math.max(...data.map((d) => d.total), 1);
        const W = 700;
        const H = 160;
        const padX = 0;
        const padY = 10;
        const usableH = H - padY * 2;
        const stepX = data.length > 1 ? (W - padX * 2) / (data.length - 1) : 0;

        const pts = data.map((d, i) => ({
            x: padX + i * stepX,
            y: padY + usableH - (d.total / max) * usableH,
        }));

        const pathParts = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`);
        const path = pathParts.join(' ');
        const area = `${path} L${pts[pts.length - 1]?.x ?? 0},${H} L${pts[0]?.x ?? 0},${H} Z`;

        return { path, area, points: pts, max };
    }, [data]);

    if (data.length === 0) return null;

    const W = 700;
    const H = 160;

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" className="text-primary" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
                    </linearGradient>
                </defs>
                <path d={area} fill="url(#revenueGrad)" />
                <path d={path} fill="none" strokeWidth="2.5" className="stroke-primary" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" className="fill-background stroke-primary" strokeWidth="2">
                        <title>{formatDate(data[i].date)}: {formatVND(data[i].total)}</title>
                    </circle>
                ))}
            </svg>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
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
                        accent="orange"
                    />
                    <StatCard
                        label="Tỉ lệ lấp đầy"
                        value={`${occupancy.rate}%`}
                        icon={Users}
                        accent="orange"
                    />
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
                                <div className="rounded-xl border bg-orange-50 p-3 dark:bg-orange-950/30">
                                    <p className="text-xs text-muted-foreground">Tiền cọc đã thu</p>
                                    <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{formatVND(summary.depositsCollected)}</p>
                                </div>
                                <div className="rounded-xl border bg-amber-50 p-3 dark:bg-amber-950/30">
                                    <p className="text-xs text-muted-foreground">Đã hoàn cọc</p>
                                    <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{formatVND(summary.refundsDone)}</p>
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
                                <div className="py-8 text-center">
                                    <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu khách hàng.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {topCustomers.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
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
                                                <div>
                                                    <div className="text-sm font-medium">{c.name}</div>
                                                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold">{c.booking_count} lượt</p>
                                                <p className="text-xs text-muted-foreground">{formatVND(c.total_spent)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </ManagerLayout>
    );
}
