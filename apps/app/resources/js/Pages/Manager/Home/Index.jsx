import { Head, Link } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { StatCard } from '@/Components/StatCard';
import { EmptyState } from '@/Components/EmptyState';
import { StatusBadge } from '@/Components/StatusBadge';
import { PageHeader } from '@/Components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    CalendarDays,
    CalendarPlus,
    CircleDollarSign,
    HandCoins,
    LayoutDashboard,
    ListChecks,
    Percent,
    RefreshCw,
    ShoppingCart,
    Users,
    Wallet,
} from 'lucide-react';
import { formatVND, formatTime } from '@/lib/format';

function hhmm(iso) {
    return iso ? iso.slice(11, 16) : '';
}

export default function Index({ stats, awaitingDeposits, refundsToProcess, unmatchedTxns, upcomingBookings }) {
    return (
        <ManagerLayout>
            <Head title="Trang chủ" />

            <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
                <PageHeader
                    title="Trang chủ"
                    description="Tổng quan hoạt động hôm nay"
                />

                {stats.totalBookings === 0 && (
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

                {stats.totalBookings > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                            <StatCard
                                label="Tổng đặt"
                                value={stats.totalBookings}
                                icon={CalendarDays}
                            />
                            <StatCard
                                label="Đã xác nhận"
                                value={stats.confirmedCount}
                                icon={ListChecks}
                                accent="emerald"
                            />
                            <StatCard
                                label="Chờ cọc"
                                value={stats.pendingDepositCount}
                                icon={Wallet}
                                accent="amber"
                            />
                            <StatCard
                                label="Doanh thu"
                                value={formatVND(stats.todayRevenue)}
                                icon={CircleDollarSign}
                                accent="emerald"
                            />
                            <StatCard
                                label="Tỉ lệ lấp đầy"
                                value={`${stats.occupancy}%`}
                                icon={Percent}
                                accent="primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ShoppingCart className="h-4 w-4" />
                                        Thao tác nhanh
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-2">
                                    <Link href={route('manager.calendar.index')}>
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <CalendarPlus className="h-4 w-4" />
                                            Đặt hộ
                                        </Button>
                                    </Link>
                                    <Link href={route('manager.series.index')}>
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <RefreshCw className="h-4 w-4" />
                                            Đặt cố định
                                        </Button>
                                    </Link>
                                    <Link href={route('manager.calendar.index')}>
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <CalendarDays className="h-4 w-4" />
                                            Lịch hôm nay
                                        </Button>
                                    </Link>
                                    <Link href={route('manager.refunds.index')}>
                                        <Button variant="outline" className="w-full justify-start gap-2">
                                            <HandCoins className="h-4 w-4" />
                                            Hoàn cọc
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ListChecks className="h-4 w-4" />
                                        Cần xử lý
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {awaitingDeposits.length === 0 && refundsToProcess.length === 0 && unmatchedTxns.length === 0 && (
                                        <p className="text-sm text-muted-foreground">Không có việc cần xử lý.</p>
                                    )}
                                    {awaitingDeposits.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                Chờ cọc ({awaitingDeposits.length})
                                            </p>
                                            <ul className="space-y-1">
                                                {awaitingDeposits.map((b) => (
                                                    <li key={b.code} className="flex items-center justify-between text-sm">
                                                        <span>{b.customer}</span>
                                                        <span className="font-mono text-[11px] text-muted-foreground">{b.code}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {refundsToProcess.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                Hoàn tiền ({refundsToProcess.length})
                                            </p>
                                            <ul className="space-y-1">
                                                {refundsToProcess.map((r, i) => (
                                                    <li key={i} className="flex items-center justify-between text-sm">
                                                        <span>{r.customer}</span>
                                                        <span className="font-mono text-xs">{formatVND(r.amount)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {unmatchedTxns.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                Giao dịch chưa khớp ({unmatchedTxns.length})
                                            </p>
                                            <ul className="space-y-1">
                                                {unmatchedTxns.map((t, i) => (
                                                    <li key={i} className="flex items-center justify-between text-sm">
                                                        <span className="truncate text-muted-foreground">{t.description ?? '—'}</span>
                                                        <span className="font-mono text-xs">{formatVND(t.amount)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <Link href={route('manager.reconcile.index')}>
                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                            Đến trang đối soát →
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="h-4 w-4" />
                                    Sắp tới
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingBookings.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Chưa có lịch đặt nào sắp tới.</p>
                                ) : (
                                    <div className="divide-y">
                                        {upcomingBookings.map((b, i) => (
                                            <Link
                                                key={`${b.code}-${i}`}
                                                href={route('manager.calendar.index')}
                                                className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/50 first:pt-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                                        {hhmm(b.start)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{b.customer}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {b.court} · {hhmm(b.start)}–{hhmm(b.end)}
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
                    </>
                )}
            </div>
        </ManagerLayout>
    );
}
