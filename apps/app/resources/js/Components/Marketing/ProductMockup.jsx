import { CalendarDays, CheckCircle2, Clock3, CreditCard } from 'lucide-react';

export default function ProductMockup({ compact = false }) {
    return <div className={`rounded-[1.7rem] border bg-card p-4 text-foreground shadow-2xl shadow-foreground/15 ${compact ? 'max-w-md' : ''}`} data-marketing-mockup>
        <div className="flex items-center justify-between border-b pb-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Tổng quan hôm nay</p><p className="mt-1 text-lg font-extrabold">Thứ Bảy, 10 tháng 8</p></div><span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground"><CalendarDays size={19} /></span></div>
        <div className="mt-4 rounded-2xl bg-foreground p-4 text-background"><div className="flex items-start justify-between"><div><p className="text-sm text-background/65">Doanh thu dự kiến</p><p className="mt-1 text-2xl font-black">4.850.000đ</p></div><CreditCard size={19} className="text-primary" /></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background/15"><div className="h-full w-[74%] rounded-full bg-primary" /></div></div>
        <div className="mt-4 space-y-2">{[['06:00', 'Sân 01', 'Đã xác nhận'], ['07:30', 'Sân 03', 'Chờ cọc'], ['09:00', 'Sân 02', 'Sẵn sàng']].map(([time, court, state]) => <div key={time} className="grid grid-cols-[3.4rem_1fr_auto] items-center gap-2 rounded-xl bg-muted px-3 py-2.5"><span className="inline-flex items-center gap-1 text-xs font-bold"><Clock3 size={13} />{time}</span><span className="text-sm font-semibold">{court}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-success"><CheckCircle2 size={13} />{state}</span></div>)}</div>
    </div>;
}
