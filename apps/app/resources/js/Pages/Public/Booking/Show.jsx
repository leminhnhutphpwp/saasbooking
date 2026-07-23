import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Clock, MapPin, CalendarDays } from 'lucide-react';

export default function Show({ tenant, date, courts }) {
    const [selected, setSelected] = useState(null);
    const form = useForm({ name: '', phone: '', court_id: null, start_at: '', end_at: '' });
    const brand = tenant.settings?.branding ?? {};
    const pc = brand.primary_color || '#059669';

    const changeDate = (d) =>
        router.get(`/book/${tenant.slug}`, { date: d }, { preserveState: true, preserveScroll: true });

    const pick = (court, slot) => {
        setSelected({ court_id: court.court_id, court_name: court.court_name, start: slot.start, end: slot.end, price: slot.price });
        form.setData({ name: form.data.name, phone: form.data.phone, court_id: court.court_id, start_at: slot.start, end_at: slot.end });
    };

    const submit = (e) => {
        e.preventDefault();
        form.post(`/book/${tenant.slug}/hold`);
    };

    const hhmm = (iso) => iso.slice(11, 16);
    const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

    const dateObj = date ? new Date(date + 'T00:00:00') : new Date();

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`Đặt sân — ${tenant.name}`} />

            {/* Header */}
            <div className="border-b bg-white" style={{ borderTopColor: pc, borderTopWidth: '3px' }}>
                <div className="mx-auto flex max-w-3xl items-center gap-3 p-4">
                    {brand.logo_path && (
                        <img src={`/storage/${brand.logo_path}`} alt={tenant.name} className="h-10 w-auto object-contain" />
                    )}
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: pc }}>{tenant.name}</h1>
                        <p className="text-xs text-gray-500">Đặt sân nhanh — cọc VietQR chống bom</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-3xl p-4">
                {/* Date picker */}
                <Card className="mb-4">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => changeDate(e.target.value)}
                                className="rounded-lg border p-2 text-sm"
                            />
                            <Badge variant="outline">
                                {dateObj.toLocaleDateString('vi-VN', { weekday: 'long' })}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Court cards */}
                <div className="space-y-4">
                    {courts.map((court) => (
                        <Card key={court.court_id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="h-4 w-4" style={{ color: pc }} />
                                    {court.court_name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {court.free.length === 0 && (
                                        <span className="text-sm text-gray-400">Hết chỗ hôm nay</span>
                                    )}
                                    {court.free.map((slot, i) => {
                                        const active = selected?.court_id === court.court_id && selected?.start === slot.start;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => pick(court, slot)}
                                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                                    active
                                                        ? 'text-white shadow-md'
                                                        : 'hover:border-gray-400 hover:bg-gray-50'
                                                }`}
                                                style={
                                                    active
                                                        ? { backgroundColor: pc, borderColor: pc }
                                                        : {}
                                                }
                                            >
                                                <Clock className="h-3.5 w-3.5" />
                                                {hhmm(slot.start)}–{hhmm(slot.end)}
                                                {slot.price && (
                                                    <span className={`ml-1 text-xs ${active ? 'opacity-90' : 'text-gray-500'}`}>
                                                        {vnd(slot.price)}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Booking form */}
                {selected && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Đặt {selected.court_name} · {hhmm(selected.start)}–{hhmm(selected.end)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Họ tên</Label>
                                    <Input
                                        id="name"
                                        placeholder="Nguyễn Văn A"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                    />
                                    {form.errors.name && (
                                        <p className="text-sm text-red-600">{form.errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="0901 234 567"
                                        value={form.data.phone}
                                        onChange={(e) => form.setData('phone', e.target.value)}
                                    />
                                    {form.errors.phone && (
                                        <p className="text-sm text-red-600">{form.errors.phone}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full"
                                    style={{ backgroundColor: pc }}
                                >
                                    Giữ chỗ & lấy mã QR cọc
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
