import { Head, Link } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageContainer } from '@/Components/PageContainer';
import { PageHeader } from '@/Components/PageHeader';
import { EmptyState } from '@/Components/EmptyState';
import { StatusBadge } from '@/Components/StatusBadge';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, HandCoins, Wallet } from 'lucide-react';
import { formatVND, formatTime } from '@/lib/format';

function ActionRow({ href, label, count, children }) {
    return <Link href={href} className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex min-w-0 items-center gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">{children}</div><span className="text-sm font-semibold text-foreground">{label}</span></div><div className="flex items-center gap-2"><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-foreground">{count}</span><ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></div></Link>;
}

function MetricCard({ icon: Icon, label, value, detail, href, action, accent = 'primary' }) {
    const iconClass = accent === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary';

    return <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className={`grid size-10 place-items-center rounded-xl ${iconClass}`}><Icon className="size-5" /></div><Link href={href} className="group inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">{action}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></Link></div><p className="mt-5 text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{value}</p><p className="mt-2 text-sm text-muted-foreground">{detail}</p></CardContent></Card>;
}

export default function Index({ stats, tenantName, revenueSeries, weekTotals, awaitingDeposits, refundsToProcess, unmatchedTxns, upcomingBookings }) {
    const attentionCount = awaitingDeposits.length + refundsToProcess.length + unmatchedTxns.length;
    const hasActivity = stats.totalBookings > 0 || attentionCount > 0 || upcomingBookings.length > 0;

    return <ManagerLayout>
        <Head title="Trang chủ" />
        <PageContainer>
            <PageHeader title="Vận hành hôm nay" description={`${tenantName} · Theo dõi lịch sân, cọc và các việc cần xử lý.`} actions={<Link href={route('manager.calendar.index')}><Button className="w-full rounded-xl sm:w-auto">Mở lịch sân <ArrowRight className="size-4" /></Button></Link>} />

            <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card px-5 py-5 shadow-sm sm:px-6 sm:py-6">
                <div className="absolute -right-10 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><CheckCircle2 className="size-5" /></div><div><p className="text-sm font-bold text-foreground">Bảng điều khiển hôm nay</p><p className="mt-1 text-sm text-muted-foreground">Tập trung vào lịch chơi, tiền cọc và các việc cần xử lý trước.</p></div></div>
                    <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><span className="size-2 rounded-full bg-primary" aria-hidden="true" />{attentionCount ? `${attentionCount} việc cần xem` : 'Không có việc gấp'}</div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard icon={CalendarDays} label="Lịch hôm nay" value={stats.totalBookings} detail={`${stats.occupancy}% công suất · ${stats.confirmedCount} xác nhận · ${stats.pendingDepositCount} chờ cọc`} href={route('manager.calendar.index')} action="Mở lịch" />
                <MetricCard icon={CircleDollarSign} label="Doanh thu 7 ngày" value={formatVND(weekTotals.revenue)} detail={`Đã thu cọc ${formatVND(weekTotals.depositsCollected)}`} href={route('manager.reports.index')} action="Xem báo cáo" />
                <MetricCard icon={HandCoins} label="Hoàn tiền chờ xử lý" value={formatVND(weekTotals.refundsPending)} detail={`${refundsToProcess.length} yêu cầu đang chờ thao tác`} href={route('manager.reconcile.index')} action="Đến đối soát" accent="destructive" />
            </div>

            {!hasActivity && <EmptyState icon={CalendarDays} title="Hôm nay chưa có lịch đặt" description="Lịch sân và các việc cần xử lý sẽ xuất hiện tại đây." action={<Link href={route('manager.calendar.index')}><Button>Đặt hộ khách vãng lai</Button></Link>} />}

            {hasActivity && <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
                <Card className="shadow-sm"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-base font-bold text-foreground">Lịch sân sắp tới</h2><p className="mt-1 text-sm text-muted-foreground">Theo thứ tự giờ chơi trong ngày</p></div><Link href={route('manager.calendar.index')} className="group inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Xem lịch<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link></div>{upcomingBookings.length ? <div className="space-y-2">{upcomingBookings.map((booking, index) => <Link key={`${booking.code}-${index}`} href={route('manager.calendar.index')} className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-border hover:bg-muted/50"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">{formatTime(booking.start)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{booking.court} <span className="font-normal text-muted-foreground">· {booking.customer ?? 'Khách vãng lai'}</span></p><p className="mt-1 text-xs text-muted-foreground">{formatTime(booking.start)}-{formatTime(booking.end)} · {booking.code}</p></div><StatusBadge type="booking" value={booking.status} /><ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" /></Link>)}</div> : <div className="py-10 text-center"><Clock3 className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-sm font-medium text-muted-foreground">Không còn lịch nào trong ngày.</p></div>}</CardContent></Card>
                <Card className="shadow-sm"><CardContent className="p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10"><AlertTriangle className="size-4 text-primary" /></div><div><h2 className="text-base font-bold text-foreground">Cần xử lý</h2><p className="mt-1 text-sm text-muted-foreground">{attentionCount ? `${attentionCount} mục cần kiểm tra` : 'Không có ngoại lệ mới'}</p></div></div><div className="space-y-2"><ActionRow href={route('manager.reconcile.index')} label="Đơn chờ cọc" count={awaitingDeposits.length}><Wallet className="size-4 text-primary" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Hoàn tiền cần xử lý" count={refundsToProcess.length}><HandCoins className="size-4 text-destructive" /></ActionRow><ActionRow href={route('manager.reconcile.index')} label="Giao dịch chưa khớp" count={unmatchedTxns.length}><CircleDollarSign className="size-4 text-primary" /></ActionRow></div></CardContent></Card>
            </div>}
        </PageContainer>
    </ManagerLayout>;
}
