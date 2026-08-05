import { Head, Link } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { EmptyState } from '@/Components/EmptyState';
import { StatusBadge } from '@/Components/StatusBadge';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { AlertTriangle, CalendarDays, CircleDollarSign, Clock3, HandCoins, Wallet } from 'lucide-react';
import { formatVND, formatTime } from '@/lib/format';

function ActionRow({ href, label, count, children }) {
    return <Link href={href} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"><div className="flex min-w-0 items-center gap-3"><div className="shrink-0">{children}</div><span className="text-sm font-medium text-foreground">{label}</span></div><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-foreground">{count}</span></Link>;
}

export default function Index({ stats, tenantName, revenueSeries, weekTotals, awaitingDeposits, refundsToProcess, unmatchedTxns, upcomingBookings }) {
    const attentionCount = awaitingDeposits.length + refundsToProcess.length + unmatchedTxns.length;
    const hasActivity = stats.totalBookings > 0 || attentionCount > 0 || upcomingBookings.length > 0;

    return <ManagerLayout>
        <Head title="Trang chủ" />
        <PageContainer>
            <PageHeader title="Vận hành hôm nay" description={`${tenantName} · Theo dõi lịch sân, cọc và các việc cần xử lý.`} />

            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><CalendarDays className="h-4 w-4" />Lịch hôm nay</div><div className="mt-3 flex items-end justify-between"><div><p className="text-3xl font-bold tracking-tight text-foreground">{stats.totalBookings}</p><p className="text-xs text-muted-foreground">lịch đặt · {stats.occupancy}% công suất</p></div><Link href={route('manager.calendar.index')} className="text-sm font-semibold text-primary hover:underline">Mở lịch</Link></div><div className="mt-4 flex gap-3 text-xs text-muted-foreground"><span>{stats.confirmedCount} xác nhận</span><span>{stats.pendingDepositCount} chờ cọc</span></div></CardContent></Card>
                <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><CircleDollarSign className="h-4 w-4" />Doanh thu 7 ngày</div><p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatVND(weekTotals.revenue)}</p><p className="mt-1 text-xs text-muted-foreground">Đã thu cọc {formatVND(weekTotals.depositsCollected)}</p><Link href={route('manager.reports.index')} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Xem báo cáo</Link></CardContent></Card>
                <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><HandCoins className="h-4 w-4" />Hoàn tiền chờ xử lý</div><p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{formatVND(weekTotals.refundsPending)}</p><p className="mt-1 text-xs text-muted-foreground">{refundsToProcess.length} yêu cầu đang chờ thao tác</p><Link href={route('manager.reconcile.index')} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Đến đối soát</Link></CardContent></Card>
            </div>

            {!hasActivity && <EmptyState icon={CalendarDays} title="Hôm nay chưa có lịch đặt" description="Lịch sân và các việc cần xử lý sẽ xuất hiện tại đây." action={<Link href={route('manager.calendar.index')}><Button>Đặt hộ khách vãng lai</Button></Link>} />}

            {hasActivity && <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
                <Card><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-foreground">Lịch sân sắp tới</h2><p className="text-xs text-muted-foreground">Theo thứ tự giờ chơi trong ngày</p></div><Link href={route('manager.calendar.index')} className="text-sm font-semibold text-primary hover:underline">Xem lịch</Link></div>{upcomingBookings.length ? <div className="divide-y divide-border">{upcomingBookings.map((booking, index) => <Link key={`${booking.code}-${index}`} href={route('manager.calendar.index')} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/30"><div className="w-12 shrink-0 text-sm font-bold text-foreground">{formatTime(booking.start)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{booking.court} <span className="font-normal text-muted-foreground">· {booking.customer ?? 'Khách vãng lai'}</span></p><p className="text-xs text-muted-foreground">{formatTime(booking.start)}-{formatTime(booking.end)} · {booking.code}</p></div><StatusBadge type="booking" value={booking.status} /></Link>)}</div> : <div className="py-8 text-center"><Clock3 className="mx-auto h-7 w-7 text-muted-foreground/40" /><p className="mt-2 text-sm text-muted-foreground">Không còn lịch nào trong ngày.</p></div>}</CardContent></Card>
                <Card><CardContent className="p-5"><div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" /><div><h2 className="font-semibold text-foreground">Cần xử lý</h2><p className="text-xs text-muted-foreground">{attentionCount ? `${attentionCount} mục cần kiểm tra` : 'Không có ngoại lệ mới'}</p></div></div><div className="space-y-2"><ActionRow href={route('manager.reconcile.index')} label="Đơn chờ cọc" count={awaitingDeposits.length}><Wallet className="h-4 w-4 text-primary" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Hoàn tiền cần xử lý" count={refundsToProcess.length}><HandCoins className="h-4 w-4 text-destructive" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Giao dịch chưa khớp" count={unmatchedTxns.length}><CircleDollarSign className="h-4 w-4 text-primary" /></ActionRow></div></CardContent></Card>
            </div>}
        </PageContainer>
    </ManagerLayout>;
}
