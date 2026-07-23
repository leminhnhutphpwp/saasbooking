import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { formatVND, formatDate } from '@/lib/format';
import { TrendingUp, Users, XCircle, Banknote, CalendarDays, User } from 'lucide-react';

function BarChart({ data }) {
    const max = Math.max(...data.map((d) => d.total), 1);
    const W = 700;
    const H = 160;
    const barW = Math.max(6, Math.min(20, W / data.length - 2));

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
            {data.map((d, i) => {
                const x = i * (W / data.length) + (W / data.length - barW) / 2;
                const h = (d.total / max) * (H - 20);
                return (
                    <g key={d.date}>
                        <rect
                            x={x}
                            y={H - 10 - h}
                            width={barW}
                            height={Math.max(h, 1)}
                            rx="3"
                            className="fill-primary/60 hover:fill-primary transition-colors"
                        >
                            <title>{formatDate(d.date)}: {formatVND(d.total)}</title>
                        </rect>
                    </g>
                );
            })}
        </svg>
    );
}

function StatCard({ label, value, icon: Icon, accent }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`mt-1 text-xl font-bold ${accent ?? 'text-foreground'}`}>{value}</p>
                    </div>
                    {Icon && (
                        <div className={`rounded-lg p-2 ${accent ? accent + '/10' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${accent ?? 'text-muted-foreground'}`} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
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
        <ManagerLayout header={<h2 className="text-xl font-semibold">Báo cáo</h2>}>
            <Head title="Báo cáo" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Từ ngày</label>
                                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Đến ngày</label>
                                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
                            </div>
                            <Button onClick={applyFilter} disabled={isDefault}>Áp dụng</Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Tổng doanh thu" value={formatVND(summary.totalRevenue)} icon={TrendingUp} accent="text-emerald-600" />
                    <StatCard label="Đặt sân (đã XN)" value={summary.confirmedBookings} icon={CalendarDays} accent="text-blue-600" />
                    <StatCard label="Tỉ lệ lấp đầy" value={`${occupancy.rate}%`} icon={Users} accent="text-violet-600" />
                    <StatCard label="Tỉ lệ bom" value={`${summary.noShowRate}%`} icon={XCircle} accent="text-rose-600" />
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Doanh thu theo ngày</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueByDay.length === 0 || summary.totalRevenue === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Chưa có dữ liệu doanh thu trong khoảng thời gian này.
                            </p>
                        ) : (
                            <BarChart data={revenueByDay} />
                        )}
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Tổng: <strong className="text-foreground">{formatVND(summary.totalRevenue)}</strong></span>
                            <span>Số đơn: <strong className="text-foreground">{summary.confirmedBookings}</strong></span>
                            <span>Bom: <strong className="text-foreground">{summary.noShowCount}</strong></span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Bom sân &amp; Cọc</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Số đơn bom</p>
                                <p className="text-xl font-bold">{summary.noShowCount}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Tiền cọc đã thu</p>
                                <p className="text-xl font-bold text-emerald-600">{formatVND(summary.depositsCollected)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Đã hoàn cọc</p>
                                <p className="text-xl font-bold text-amber-600">{formatVND(summary.refundsDone)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Số đơn hoàn</p>
                                <p className="text-xl font-bold">{summary.refundCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Khách hàng thân thiết</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topCustomers.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                Chưa có dữ liệu khách hàng.
                            </p>
                        ) : (
                            <div className="divide-y">
                                {topCustomers.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium">{c.name}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{c.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{c.booking_count} lượt</p>
                                            <p className="text-xs text-muted-foreground">{formatVND(c.total_spent)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ManagerLayout>
    );
}
