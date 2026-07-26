import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Head, useForm } from '@inertiajs/react';
import { Check, Plus } from 'lucide-react';

export default function RegisterService({ services }) {
    const form = useForm({ service: services[0]?.uuid ?? '', venue_name: '' });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('services.store'));
    };

    return (
        <GuestLayout>
            <Head title="Mở dịch vụ" />
            <form onSubmit={submit} className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Một lần đăng ký, một dịch vụ</p>
                    <h1 className="mt-2 text-2xl font-bold text-foreground">Bạn muốn vận hành dịch vụ nào?</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Mỗi dịch vụ tạo một cơ sở quản lý độc lập. Bạn có thể mở thêm dịch vụ khác sau.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {services.map((service) => {
                        const selected = form.data.service === service.uuid;
                        return (
                            <button key={service.uuid} type="button" onClick={() => form.setData('service', service.uuid)} className="text-left">
                                <Card className={selected ? 'border-primary ring-2 ring-primary/15' : 'transition-colors hover:border-primary/40'}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-foreground">{service.name}</p>
                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">{service.description}</p>
                                            </div>
                                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground'}`}>
                                                {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                            </span>
                                        </div>
                                        {service.trial_days > 0 && <p className="mt-3 text-xs font-medium text-primary">Dùng thử {service.trial_days} ngày</p>}
                                    </CardContent>
                                </Card>
                            </button>
                        );
                    })}
                </div>
                <InputError message={form.errors.service} />

                <div>
                    <InputLabel htmlFor="venue_name" value="Tên cơ sở" />
                    <Input id="venue_name" value={form.data.venue_name} onChange={(event) => form.setData('venue_name', event.target.value)} className="mt-1.5 w-full" placeholder="Ví dụ: Sân Minh Anh" required autoFocus />
                    <InputError message={form.errors.venue_name} className="mt-2" />
                </div>

                <Button type="submit" className="w-full" disabled={form.processing || services.length === 0}>
                    Mở dịch vụ và tiếp tục
                </Button>
            </form>
        </GuestLayout>
    );
}
