import { Head, Link } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { EmptyState } from '@/Components/EmptyState';
import { StatusBadge } from '@/Components/StatusBadge';
import { StatCard } from '@/Components/StatCard';
import { QuickLinks } from '@/Components/QuickLinks';
import { Sparkline } from '@/Components/Sparkline';
import { OccupancyGauge } from '@/Components/OccupancyGauge';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, HandCoins, MapPin, Wallet } from 'lucide-react';
import { formatVND, formatTime } from '@/lib/format';

function ActionRow({ href, label, count, children, onClick }) {
    return (
        <Link href={href} onClick={onClick} className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">{children}</div>
                <span className="text-sm font-semibold text-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-foreground">{count}</span>
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
        </Link>
    );
}

export default function Index({ stats, tenantName, revenueSeries, weekTotals, awaitingDeposits, refundsToProcess, unmatchedTxns, upcomingBookings, courtStatus = [] }) {
    const attentionCount = awaitingDeposits.length + refundsToProcess.length + unmatchedTxns.length;
    const hasActivity = stats.totalBookings > 0 || attentionCount > 0 || upcomingBookings.length > 0;

    const occupiedCourts = courtStatus.filter(c => c.occupied).length;
    const availableCourts = courtStatus.length - occupiedCourts;

    const revenueSparkline = (
        <Sparkline
            data={revenueSeries.map(r => r.revenue)}
            strokeColor="hsl(var(--primary))"
            fillColor="hsl(var(--primary))"
            fillOpacity={0.15}
            height={50}
        />
    );

    return <ManagerLayout>
        <Head title="Trang chủ" />
        <PageContainer>
            <PageHeader title="Vận hành hôm nay" description={`${tenantName} · Theo dõi lịch sân, cọc và các việc cần xử lý.`} actions={<Link href={route('manager.calendar.index')}><Button className="w-full rounded-xl sm:w-auto">Mở lịch sân <ArrowRight className="size-4" /></Button></Link>} />

            {/* Quick Links */}
            <QuickLinks className="mb-6" />

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Lịch hôm nay"
                    value={stats.totalBookings}
                    icon={CalendarDays}
                    accent="primary"
                    trend={`${stats.confirmedCount} xác nhận · ${stats.pendingDepositCount} chờ cọc`}
                    action={<Link href={route('manager.calendar.index')} className="text-xs font-semibold text-primary hover:underline">Mở lịch</Link>}
                />
                <StatCard
                    label="Doanh thu 7 ngày"
                    value={formatVND(weekTotals.revenue)}
                    icon={CircleDollarSign}
                    accent="emerald"
                    trend={`Đã thu cọc ${formatVND(weekTotals.depositsCollected)}`}
                    chart={revenueSparkline}
                    action={<Link href={route('manager.reports.index')} className="text-xs font-semibold text-primary hover:underline">Xem báo cáo</Link>}
                />
                <StatCard
                    label="Hoàn cọc chờ xử lý"
                    value={formatVND(weekTotals.refundsPending)}
                    icon={HandCoins}
                    accent="destructive"
                    trend={`${refundsToProcess.length} yêu cầu đang chờ`}
                    action={<Link href={route('manager.reconcile.index')} className="text-xs font-semibold text-primary hover:underline">Đến đối soát</Link>}
                />
                <Card className="relative">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Công suất hôm nay</div>
                                <div className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl text-primary">{stats.occupancy}%</div>
                                <div className="text-xs text-muted-foreground">
                                    {occupiedCourts} sân đang bận · {availableCourts} sân trống
                                </div>
                            </div>
                            <OccupancyGauge value={stats.occupancy} size={80} strokeWidth={8} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Court Status */}
            {courtStatus.length > 0 && (
                <Card className="mt-4 shadow-sm">
                    <CardContent className="p-5 sm:p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <MapPin className="size-5 text-primary" />
                            <h2 className="text-base font-bold text-foreground">Trạng thái sân hiện tại</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {courtStatus.map(court => (
                                <div
                                    key={court.id}
                                    className={`rounded-xl border p-3 text-center transition-colors ${
                                        court.occupied
                                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                                            : 'border-border bg-muted/30'
                                    }`}
                                >
                                    <div className="mb-1 flex items-center justify-center gap-1.5">
                                        <span className={`size-2 rounded-full ${court.occupied ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {court.occupied ? 'Đang bận' : 'Trống'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">{court.name}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!hasActivity && <EmptyState icon={CalendarDays} title="Hôm nay chưa có lịch đặt" description="Lịch sân và các việc cần xử lý sẽ xuất hiện tại đây." action={<Link href={route('manager.calendar.index')}><Button>Đặt hộ khách vãng lai</Button></Link>} />}

            {hasActivity && <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
                <Card className="shadow-sm"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-base font-bold text-foreground">Lịch sân sắp tới</h2><p className="mt-1 text-sm text-muted-foreground">Theo thứ tự giờ chơi trong ngày</p></div><Link href={route('manager.calendar.index')} className="group inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Xem lịch<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link></div>{upcomingBookings.length ? <div className="space-y-2">{upcomingBookings.map((booking, index) => <Link key={`${booking.code}-${index}`} href={route('manager.calendar.index')} className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-border hover:bg-muted/50"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">{formatTime(booking.start)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{booking.court} <span className="font-normal text-muted-foreground">· {booking.customer ?? 'Khách vãng lai'}</span></p><p className="mt-1 text-xs text-muted-foreground">{formatTime(booking.start)}-{formatTime(booking.end)} · {booking.code}</p></div><StatusBadge type="booking" value={booking.status} /><ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" /></Link>)}</div> : <div className="py-10 text-center"><Clock3 className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-sm font-medium text-muted-foreground">Không còn lịch nào trong ngày.</p></div>}</CardContent></Card>
                <Card className="shadow-sm"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10"><AlertTriangle className="size-4 text-primary" /></div><div><h2 className="text-base font-bold text-foreground">Cần xử lý</h2><p className="mt-1 text-sm text-muted-foreground">{attentionCount ? `${attentionCount} mục cần kiểm tra` : 'Không có ngoại lệ mới'}</p></div></div><div className="space-y-2"><ActionRow href={route('manager.reconcile.index')} label="Đơn chờ cọc" count={awaitingDeposits.length}><Wallet className="size-4 text-primary" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Hoàn tiền cần xử lý" count={refundsToProcess.length}><HandCoins className="size-4 text-destructive" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Giao dịch chưa khớp" count={unmatchedTxns.length}><CircleDollarSign className="size-4 text-primary" /></ActionRow></div></CardContent></Card>
            </div>}
        </PageContainer>
    </ManagerLayout>;
}
