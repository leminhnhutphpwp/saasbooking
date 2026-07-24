import { Head, Link, usePage } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageContainer } from '@/Components/PageContainer';
import { QuickLinks } from '@/Components/QuickLinks';
import { EmptyState } from '@/Components/EmptyState';
import { StatusBadge } from '@/Components/StatusBadge';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import {
    ArrowRight,
    CalendarDays,
    HandCoins,
    LayoutDashboard,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { formatVND, formatTime } from '@/lib/format';
import { useMemo } from 'react';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
}

function getTodayLabel() {
    return new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
    });
}

function RevenueChart({ data }) {
    const { path, area, points, isEmpty } = useMemo(() => {
        const values = data.map((d) => d.revenue);
        const isEmpty = values.every((v) => v === 0);
        const scale = Math.max(...values, 1);
        const W = 400;
        const H = 100;
        const px = values.map((_, i) => (values.length === 1 ? W / 2 : (i * W) / Math.max(values.length - 1, 1)));
        const py = values.map((v) => H - (v / scale) * (H - 16) - 4);
        const pts = px.map((x, i) => [x, py[i]]);
        const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
        const area = isEmpty ? '' : `${line} L${px[px.length - 1]},${H} L${px[0]},${H} Z`;
        return { path: line, area, points: pts, isEmpty };
    }, [data]);

    return (
        <div className="relative -mx-2">
            <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="h-28 w-full">
                <defs>
                    <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {!isEmpty && (
                    <>
                        <path d={area} fill="url(#rev-fill)" className="text-violet-500" />
                        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500" />
                        {points.map((p, i) => (
                            <circle key={i} cx={p[0]} cy={p[1]} r="3" className="fill-background stroke-violet-500" strokeWidth="2" />
                        ))}
                    </>
                )}
                {isEmpty && (
                    <line x1="0" y1="96" x2="400" y2="96" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" className="text-muted-foreground/40" />
                )}
            </svg>
            <div className="mt-1 flex justify-between px-1">
                {data.map((d) => (
                    <span key={d.date} className="text-[10px] text-muted-foreground">
                        {d.label.split(' ')[0]}
                    </span>
                ))}
            </div>
            {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    Chưa có doanh thu trong 7 ngày
                </div>
            )}
        </div>
    );
}

function PillAction({ href, children }) {
    return (
        <Link href={href}>
            <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-full border-border/80 text-xs font-medium hover:border-primary/40 hover:text-primary"
            >
                {children}
                <ArrowRight className="h-3 w-3" />
            </Button>
        </Link>
    );
}

export default function Index({
    stats,
    tenantName,
    revenueSeries,
    weekTotals,
    awaitingDeposits,
    refundsToProcess,
    unmatchedTxns,
    upcomingBookings,
}) {
    const { auth } = usePage().props;
    const greeting = getGreeting();
    const todayLabel = getTodayLabel();
    const hasActivity = stats.totalBookings > 0 || awaitingDeposits.length > 0 || upcomingBookings.length > 0;

    return (
        <ManagerLayout>
            <Head title="Trang chủ" />

            <PageContainer>
                {/* Welcome hero */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {greeting}, <span className="text-primary">{auth.user.name?.split(' ').pop()}</span>
                        <span className="ml-2 text-muted-foreground">👋</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {tenantName} · <span className="capitalize">{todayLabel}</span>
                    </p>
                </div>

                {/* Quick links */}
                <QuickLinks />

                {/* 3 insight cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Hôm nay */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <CalendarDays className="h-4 w-4" />
                                    Hôm nay
                                </div>
                                <PillAction href={route('manager.calendar.index')}>Xem lịch</PillAction>
                            </div>
                            <div className="mt-4 flex items-baseline gap-3">
                                <div className="text-4xl font-bold tracking-tight text-foreground">
                                    {stats.totalBookings}
                                </div>
                                <div className="text-sm text-muted-foreground">đặt sân</div>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-xs">
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    {stats.confirmedCount} xác nhận
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    {stats.pendingDepositCount} chờ cọc
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="mb-1.5 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Lấp đầy hôm nay</span>
                                    <span className="font-semibold text-foreground">{stats.occupancy}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 transition-all"
                                        style={{ width: `${Math.min(stats.occupancy, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doanh thu 7 ngày */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    Doanh thu 7 ngày
                                </div>
                                <PillAction href={route('manager.reports.index')}>Báo cáo</PillAction>
                            </div>
                            <div className="mt-4 flex items-baseline gap-3">
                                <div className="text-4xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                                    {formatVND(weekTotals.revenue)}
                                </div>
                            </div>
                            <div className="mt-4">
                                <RevenueChart data={revenueSeries} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cọc & hoàn */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Wallet className="h-4 w-4" />
                                    Cọc & hoàn
                                </div>
                                <PillAction href={route('manager.reconcile.index')}>Đối soát</PillAction>
                            </div>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Đã thu (7 ngày)</span>
                                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                            {formatVND(weekTotals.depositsCollected)}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-emerald-500/70 transition-all"
                                            style={{ width: `${weekTotals.revenue > 0 ? Math.min(100, (weekTotals.depositsCollected / weekTotals.revenue) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end justify-between border-t border-border/60 pt-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Hoàn chờ xử lý</div>
                                        <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                            {formatVND(weekTotals.refundsPending)}
                                        </div>
                                    </div>
                                    <HandCoins className="h-8 w-8 shrink-0 text-muted-foreground/40" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Empty / no activity state */}
                {!hasActivity && (
                    <EmptyState
                        icon={LayoutDashboard}
                        title="Hôm nay chưa có lịch đặt nào"
                        description="Khi khách đặt sân hoặc bạn tạo lịch đặt hộ, thông tin sẽ hiển thị tại đây."
                        action={
                            <Link href={route('manager.calendar.index')}>
                                <Button>Đặt hộ khách vãng lai</Button>
                            </Link>
                        }
                    />
                )}

                {/* Needs attention */}
                {hasActivity && (awaitingDeposits.length > 0 || refundsToProcess.length > 0 || unmatchedTxns.length > 0) && (
                    <Card>
                        <CardContent className="space-y-5 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold tracking-tight text-foreground">Cần xử lý</h2>
                                <Link href={route('manager.reconcile.index')} className="text-xs font-medium text-primary hover:underline">
                                    Đến đối soát →
                                </Link>
                            </div>

                            {awaitingDeposits.length > 0 && (
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chờ cọc</span>
                                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                                {awaitingDeposits.length}
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {awaitingDeposits.map((b) => (
                                            <li key={b.code} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                                                <span className="font-medium text-foreground">{b.customer ?? 'Khách'}</span>
                                                <span className="font-mono text-[11px] text-muted-foreground">{b.code}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {refundsToProcess.length > 0 && (
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hoàn tiền</span>
                                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                                                {refundsToProcess.length}
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {refundsToProcess.map((r, i) => (
                                            <li key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                                                <span className="font-medium text-foreground">{r.customer ?? 'Khách'}</span>
                                                <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400">{formatVND(r.amount)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {unmatchedTxns.length > 0 && (
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Giao dịch chưa khớp</span>
                                            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                                                {unmatchedTxns.length}
                                            </span>
                                        </div>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {unmatchedTxns.map((t, i) => (
                                            <li key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                                                <span className="truncate text-muted-foreground">{t.description ?? '—'}</span>
                                                <span className="font-mono text-xs font-semibold text-foreground">{formatVND(t.amount)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Upcoming bookings */}
                {hasActivity && (
                    <Card>
                        <CardContent className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-base font-semibold tracking-tight text-foreground">Lịch sắp tới</h2>
                                <Link href={route('manager.calendar.index')} className="text-xs font-medium text-primary hover:underline">
                                    Xem lịch đầy đủ →
                                </Link>
                            </div>
                            {upcomingBookings.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-8 text-center">
                                    <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">Chưa có lịch đặt nào hôm nay.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {upcomingBookings.map((b, i) => (
                                        <Link
                                            key={`${b.code}-${i}`}
                                            href={route('manager.calendar.index')}
                                            className="group flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/5 text-primary">
                                                    <span className="text-sm font-bold leading-none">{formatTime(b.start).split(':')[0]}</span>
                                                    <span className="text-[9px] font-medium uppercase">h</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-foreground">{b.customer ?? 'Khách'}</div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {b.court} · {formatTime(b.start)}–{formatTime(b.end)}
                                                    </div>
                                                </div>
                                            </div>
                                            <StatusBadge type="booking" value={b.status} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </PageContainer>
        </ManagerLayout>
    );
}
