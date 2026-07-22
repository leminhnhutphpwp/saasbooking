import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({ tenant, date, courts }) {
    const [selected, setSelected] = useState(null);
    const form = useForm({ name: '', phone: '', court_id: null, start_at: '', end_at: '' });
    const brand = tenant.settings ?? {};
    const pc = brand.primary_color || '#2563eb';

    const changeDate = (d) =>
        router.get(`/book/${tenant.slug}`, { date: d }, { preserveState: true, preserveScroll: true });

    const pick = (court, slot) => {
        setSelected({ court_id: court.court_id, court_name: court.court_name, start: slot.start, end: slot.end });
        form.setData({ name: form.data.name, phone: form.data.phone, court_id: court.court_id, start_at: slot.start, end_at: slot.end });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(`/book/${tenant.slug}/hold`);
    };

    const hhmm = (iso) => iso.slice(11, 16);

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Đặt sân — ${tenant.name}`} />

            <div className="mx-auto max-w-2xl p-4">
                <div className="mb-4">
                    {brand.logo_url && (
                        <img src={brand.logo_url} alt={tenant.name} className="mb-2 h-14 w-auto object-contain" />
                    )}
                    <h1 className="text-2xl font-bold" style={{ color: pc }}>{tenant.name}</h1>
                    <p className="text-sm text-gray-500">Chọn khung giờ để đặt sân</p>
                </div>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => changeDate(e.target.value)}
                    className="mt-2 rounded-lg border p-2"
                />

                <div className="mt-4 space-y-4">
                    {courts.map((court) => (
                        <div key={court.court_id} className="rounded-lg border bg-white p-4">
                            <div className="font-medium">{court.court_name}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {court.free.length === 0 && (
                                    <span className="text-sm text-gray-400">Hết chỗ hôm nay</span>
                                )}
                                {court.free.map((slot, i) => {
                                    const active = selected?.court_id === court.court_id && selected?.start === slot.start;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => pick(court, slot)}
                                            className={`rounded-lg border px-3 py-1.5 text-sm ${active ? 'text-white' : 'hover:bg-gray-100'}`}
                                            style={active ? { backgroundColor: pc, borderColor: pc } : {}}
                                        >
                                            {hhmm(slot.start)}–{hhmm(slot.end)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {selected && (
                    <form onSubmit={submit} className="mt-6 space-y-3 rounded-lg border bg-white p-4">
                        <div className="font-medium" style={{ color: pc }}>
                            {selected.court_name} · {hhmm(selected.start)}–{hhmm(selected.end)}
                        </div>
                        <div>
                            <input
                                placeholder="Họ tên"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="w-full rounded-lg border p-2"
                            />
                            {form.errors.name && <p className="mt-1 text-sm text-red-600">{form.errors.name}</p>}
                        </div>
                        <div>
                            <input
                                placeholder="Số điện thoại"
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                                className="w-full rounded-lg border p-2"
                            />
                            {form.errors.phone && <p className="mt-1 text-sm text-red-600">{form.errors.phone}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full rounded-lg py-2.5 font-medium text-white disabled:opacity-50"
                            style={{ backgroundColor: pc }}
                        >
                            Giữ chỗ & lấy mã QR cọc
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
