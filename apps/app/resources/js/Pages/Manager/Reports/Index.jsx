import { router, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    CalendarDays,
    TrendingUp,
    TrendingDown,
    Users,
    XCircle,
    Trophy,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { StatCard } from '@/Components/StatCard';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { formatVND } from '@/lib/format';

const VND_SHORT = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'tr';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
    return n?.toLocaleString('vi-VN') ?? '0';
};

const STATUS_COLORS = {
    confirmed: '#10b981',
    pending_deposit: '#f59e0b',
    cancelled: '#94a3b8',
    expired: '#cbd5e1',
    completed: '#3b82f6',
    no_show: '#ef4444',
};

const STATUS_LABELS = {
    confirmed: 'Đã xác nhận',
    pending_deposit: 'Chờ cọc',
    cancelled: 'Đã hủy',
    expired: 'Hết hạn',
    completed: 'Hoàn thành',
    no_show: 'Bom sân',
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
                    {typeof entry.value === 'number' && entry.value > 999
                        ? formatVND(entry.value)
                        : entry.value}
                </p>
            ))}
        </div>
    );
};

export default function Reports({
    filters,
    revenueByDay,
    summary,
    occupancy,
    topCustomers,
    statusBreakdown,
    revenueByDayOfWeek,
    hourlyBookings,
}) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilter = useCallback(() => {
        router.get(route('manager.reports.index'), { from, to }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [from, to]);

    const pieData = Object.entries(statusBreakdown || {})
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
            name: STATUS_LABELS[status] || status,
            value: count,
            color: STATUS_COLORS[status] || '#94a3b8',
        }));

    return (
        <div className="space-y-6">
            {/* Header + Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
                    <p className="text-sm text-muted-foreground">Phân tích doanh thu và hiệu suất kinh doanh</p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-[150px]"
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-[150px]"
                    />
                    <Button onClick={applyFilter} size="sm">Áp dụng</Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Tổng doanh thu"
                    value={formatVND(summary.totalRevenue)}
                    icon={TrendingUp}
                    accent="orange"
                    trend={`${summary.confirmedBookings} đặt sân đã xác nhận`}
                />
                <StatCard
                    label="Tỷ lệ lấp đầy"
                    value={`${occupancy.rate}%`}
                    icon={Users}
                    accent="emerald"
                    trend={`${occupancy.bookedMinutes.toLocaleString('vi-VN')} phút đã đặt`}
                />
                <StatCard
                    label="Tỷ lệ bom sân"
                    value={`${summary.noShowRate}%`}
                    icon={XCircle}
                    accent="rose"
                    trend={`${summary.noShowCount} / ${summary.totalBookings} đặt sân`}
                />
                <StatCard
                    label="Đã thu cọc"
                    value={formatVND(summary.depositsCollected)}
                    icon={CalendarDays}
                    accent="amber"
                    trend={`${summary.refundCount} hoàn tiền · ${formatVND(summary.refundsDone)}`}
                />
            </div>

            {/* Revenue Trend + Booking Status */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue AreaChart */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Xu hướng doanh thu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueByDay}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(d) => {
                                        const date = new Date(d);
                                        return `${date.getDate()}/${date.getMonth() + 1}`;
                                    }}
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={VND_SHORT}
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    fill="url(#revenueGradient)"
                                    name="Doanh thu"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Booking Status PieChart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Phân loại đặt sân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-2 grid grid-cols-2 gap-1">
                                    {pieData.map((entry) => (
                                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                            <span className="text-muted-foreground truncate">{entry.name}</span>
                                            <span className="ml-auto font-medium">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                                Không có dữ liệu
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Revenue by Day of Week + Hourly Distribution */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Day of Week BarChart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Doanh thu theo ngày trong tuần</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={revenueByDayOfWeek}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={VND_SHORT}
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Doanh thu" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Hourly Distribution BarChart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Giờ cao điểm
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={hourlyBookings}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={1}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={30}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="bookings" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Đặt sân" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top Customers */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        Khách hàng thân thiết
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {topCustomers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                                        <th className="pb-2 pr-4 w-10">#</th>
                                        <th className="pb-2 pr-4">Khách hàng</th>
                                        <th className="pb-2 pr-4">SĐT</th>
                                        <th className="pb-2 pr-4 text-right">Số đặt sân</th>
                                        <th className="pb-2 text-right">Tổng chi tiêu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topCustomers.map((c, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-border/50 last:border-0"
                                        >
                                            <td className="py-2.5 pr-4">
                                                <span
                                                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                        i === 0
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                                                            : i === 1
                                                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            : i === 2
                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                                            <td className="py-2.5 pr-4 text-muted-foreground">{c.phone}</td>
                                            <td className="py-2.5 pr-4 text-right font-medium">{c.booking_count}</td>
                                            <td className="py-2.5 text-right font-semibold text-orange-600 dark:text-orange-400">
                                                {formatVND(c.total_spent)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu khách hàng</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
