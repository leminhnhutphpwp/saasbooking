import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { EmptyState } from '@/Components/EmptyState';
import { StatusBadge } from '@/Components/StatusBadge';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { AlertTriangle, CalendarDays, ChartNoAxesCombined, CircleDollarSign, Clock3, HandCoins, Wallet } from 'lucide-react';
import { formatVND, formatTime } from '@/lib/format';

function compactVND(value) {
    if (value >= 1000000000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1000000000)} tỷ`;
    if (value >= 1000000) return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1000000)}tr`;

    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value);
}

function RevenueTrend({ data }) {
    const [activeDay, setActiveDay] = useState(null);
    const max = Math.max(...data.map(({ revenue }) => revenue), 1);
    const peak = Math.max(...data.map(({ revenue }) => revenue), 0);
    const summary = data.map((day) => `${day.label}: ${formatVND(day.revenue)}`).join(', ');

    return <div aria-label={`Biểu đồ doanh thu bảy ngày gần đây. ${summary}`} role="img">
        <svg viewBox="0 0 560 180" className="h-44 w-full" preserveAspectRatio="none" aria-hidden="true">
            <defs><pattern id="home-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-invert)" strokeOpacity=".45" strokeWidth="2" /></pattern></defs>
            {[40, 90, 150].map((y) => <line key={y} x1="26" x2="560" y1={y} y2={y} stroke="var(--line)" strokeDasharray="4 6" />)}
            <text x="20" y="44" textAnchor="end" fill="var(--ink-mute)" fontSize="11">{compactVND(max)}</text>
            <text x="20" y="154" textAnchor="end" fill="var(--ink-mute)" fontSize="11">0</text>
            {data.map((day, index) => { const height = day.revenue ? Math.max((day.revenue / max) * 110, 8) : 0; const x = 42 + index * (492 / Math.max(data.length - 1, 1)); const highlighted = day.revenue === peak && peak > 0; const tooltipX = Math.min(Math.max(x - 55, 26), 424); return <g key={day.date}><title>{`${day.label}: ${formatVND(day.revenue)}`}</title>{height > 0 && <><rect tabIndex="0" onMouseEnter={() => setActiveDay(index)} onMouseLeave={() => setActiveDay(null)} onFocus={() => setActiveDay(index)} onBlur={() => setActiveDay(null)} x={x - 20} y={150 - height} width="40" height={height} rx="20" ry="20" fill={highlighted ? 'var(--turf-700)' : 'var(--turf-300)'}><title>{`${day.label}: ${formatVND(day.revenue)}`}</title></rect><rect x={x - 20} y={150 - height} width="40" height={height} rx="20" ry="20" fill="url(#home-hatch)" pointerEvents="none" /></>}{activeDay === index && <g pointerEvents="none"><circle cx={x} cy={150 - height} r="5" fill="var(--turf-700)" /><path d={`M${x - 4},${Math.max(22, 130 - height)} L${x + 4},${Math.max(22, 130 - height)} L${x},${Math.max(28, 136 - height)} Z`} fill="var(--turf-700)" /><rect x={tooltipX} y={Math.max(8, 104 - height)} width="110" height="22" rx="11" fill="var(--turf-700)" /><text x={tooltipX + 55} y={Math.max(23, 119 - height)} textAnchor="middle" fill="var(--ink-invert)" fontSize="11" fontWeight="600">{`${day.label} ${formatVND(day.revenue)}`}</text></g>}{highlighted && <text x={x} y={Math.max(16, 144 - height)} textAnchor="middle" fill="var(--ink-soft)" fontSize="11">{formatVND(day.revenue)}</text>}<text x={x} y="172" textAnchor="middle" fill="var(--ink-mute)" fontSize="11">{day.label}</text></g>; })}
        </svg>
        <span className="sr-only">{summary}</span>
    </div>;
}

function ActionRow({ href, label, count, children }) {
    return <Link href={href} className="manager-list-row flex items-center justify-between gap-3 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><div className="shrink-0">{children}</div><span className="min-w-0 text-sm font-medium text-foreground">{label}</span></div><span className="num shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-foreground">{count}</span></Link>;
}

export default function Index({ stats, tenantName, revenueSeries, weekTotals, awaitingDeposits, refundsToProcess, unmatchedTxns, upcomingBookings }) {
    const attentionCount = awaitingDeposits.length + refundsToProcess.length + unmatchedTxns.length;
    const hasActivity = stats.totalBookings > 0 || attentionCount > 0 || upcomingBookings.length > 0;

    return <ManagerLayout>
        <Head title="Trang chủ" />
        <PageContainer>
            <PageHeader title="Vận hành hôm nay" description={`${tenantName} · Theo dõi lịch sân, cọc và các việc cần xử lý.`} />

            <div className="grid gap-4 lg:grid-cols-2">
                <Card><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0" />Lịch hôm nay</div><p className="manager-metric num mt-3 text-4xl">{stats.totalBookings}</p><p className="mt-1 text-sm text-muted-foreground">lịch đặt · {stats.confirmedCount} đã xác nhận</p></div><Link href={route('manager.calendar.index')} className="shrink-0 text-sm font-semibold text-foreground underline-offset-4 hover:underline">Mở lịch</Link></div><div className="mt-5"><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>Công suất ước tính</span><span className="num shrink-0 font-semibold text-foreground">{stats.occupancy}%</span></div><div className="mt-2 h-2 rounded-full bg-muted" role="progressbar" aria-label="Công suất sân hôm nay" aria-valuemin="0" aria-valuemax="100" aria-valuenow={stats.occupancy}><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(stats.occupancy, 100)}%` }} /></div></div><div className="mt-4 border-t pt-4 text-sm text-muted-foreground"><span className="num font-semibold text-foreground">{stats.pendingDepositCount}</span> đơn đang chờ cọc</div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ChartNoAxesCombined className="h-4 w-4 shrink-0" />Doanh thu 7 ngày</div><p className="manager-metric num mt-3 break-words text-2xl sm:text-3xl">{formatVND(weekTotals.revenue)}</p><p className="mt-1 text-xs text-muted-foreground">Cọc đã thu {formatVND(weekTotals.depositsCollected)}</p></div><Link href={route('manager.reports.index')} className="shrink-0 text-sm font-semibold text-foreground underline-offset-4 hover:underline">Báo cáo</Link></div><div className="mt-4 border-t pt-4"><RevenueTrend data={revenueSeries} /></div></CardContent></Card>
            </div>

            {!hasActivity && <EmptyState icon={CalendarDays} title="Hôm nay chưa có lịch đặt" description="Lịch sân và các việc cần xử lý sẽ xuất hiện tại đây." action={<Button asChild><Link href={route('manager.calendar.index')}>Đặt hộ khách vãng lai</Link></Button>} />}

            {hasActivity && <div className="grid gap-4 lg:grid-cols-2">
                <Card><CardContent className="p-6"><div className="mb-4 flex items-center justify-between gap-3"><div className="min-w-0"><h2 className="manager-card-title text-foreground">Lịch sân sắp tới</h2><p className="manager-card-sub text-muted-foreground">Theo thứ tự giờ chơi trong ngày</p></div><Link href={route('manager.calendar.index')} className="shrink-0 text-sm font-semibold text-foreground underline-offset-4 hover:underline">Xem lịch</Link></div>{upcomingBookings.length ? <div className="divide-y divide-border">{upcomingBookings.map((booking, index) => <Link key={`${booking.code}-${index}`} href={route('manager.calendar.index')} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-turf-100"><div className="num w-12 shrink-0 text-sm font-bold text-foreground">{formatTime(booking.start)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{booking.court} <span className="font-normal text-muted-foreground">· {booking.customer ?? 'Khách vãng lai'}</span></p><p className="text-xs text-muted-foreground">{formatTime(booking.start)}-{formatTime(booking.end)} · {booking.code}</p></div><StatusBadge type="booking" value={booking.status} /></Link>)}</div> : <div className="py-8 text-left"><Clock3 className="h-7 w-7 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Không còn lịch nào trong ngày.</p></div>}</CardContent></Card>
                <Card><CardContent className="p-6"><div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-muted-foreground" /><div className="min-w-0"><h2 className="manager-card-title text-foreground">Cần xử lý</h2><p className="manager-card-sub text-muted-foreground">{attentionCount ? `${attentionCount} mục cần kiểm tra` : 'Không có ngoại lệ mới'}</p></div></div><div className="space-y-2"><ActionRow href={route('manager.reconcile.index')} label="Đơn chờ cọc" count={awaitingDeposits.length}><Wallet className="h-4 w-4 text-muted-foreground" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Hoàn tiền cần xử lý" count={refundsToProcess.length}><HandCoins className="h-4 w-4 text-muted-foreground" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Giao dịch chưa khớp" count={unmatchedTxns.length}><CircleDollarSign className="h-4 w-4 text-muted-foreground" /></ActionRow></div>{weekTotals.refundsPending > 0 && <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">Giá trị hoàn đang chờ: <span className="num font-semibold text-foreground">{formatVND(weekTotals.refundsPending)}</span></p>}</CardContent></Card>
            </div>}
        </PageContainer>
    </ManagerLayout>;
}
