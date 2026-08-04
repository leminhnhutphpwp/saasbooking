import { CalendarDays, CheckCircle2, Clock3, CreditCard } from 'lucide-react';

export default function ProductMockup({ compact = false }) {
    return <div className={`rounded-[1.7rem] border border-[#dce5d5] bg-[#f9fcf3] p-4 text-[#12231b] shadow-2xl shadow-[#183d2b]/15 ${compact ? 'max-w-md' : ''}`} data-marketing-mockup>
        <div className="flex items-center justify-between border-b border-[#dce5d5] pb-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#61806d]">Tổng quan hôm nay</p><p className="mt-1 text-lg font-extrabold">Thứ Bảy, 10 tháng 8</p></div><span className="grid size-10 place-items-center rounded-2xl bg-[#e5f7ba] text-[#315520]"><CalendarDays size={19} /></span></div>
        <div className="mt-4 rounded-2xl bg-[#163d2e] p-4 text-white"><div className="flex items-start justify-between"><div><p className="text-sm text-white/65">Doanh thu dự kiến</p><p className="mt-1 text-2xl font-black">4.850.000đ</p></div><CreditCard size={19} className="text-[#d9ff76]" /></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[74%] rounded-full bg-[#d9ff76]" /></div></div>
        <div className="mt-4 space-y-2">{[['06:00', 'Sân 01', 'Đã xác nhận'], ['07:30', 'Sân 03', 'Chờ cọc'], ['09:00', 'Sân 02', 'Sẵn sàng']].map(([time, court, state]) => <div key={time} className="grid grid-cols-[3.4rem_1fr_auto] items-center gap-2 rounded-xl bg-[#eff4e9] px-3 py-2.5"><span className="inline-flex items-center gap-1 text-xs font-bold"><Clock3 size={13} />{time}</span><span className="text-sm font-semibold">{court}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-[#287044]"><CheckCircle2 size={13} />{state}</span></div>)}</div>
    </div>;
}
