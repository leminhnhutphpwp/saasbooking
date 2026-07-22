import { Head, router, useForm } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

export default function Branding({ settings }) {
    const form = useForm({
        primary_color: settings?.primary_color ?? '#2563eb',
        logo: null,
        remove_logo: false,
    });

    const submit = (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('primary_color', form.data.primary_color);
        if (form.data.logo) data.append('logo', form.data.logo);
        if (form.data.remove_logo) data.append('remove_logo', '1');
        data.append('_method', 'POST');

        router.post('/manager/branding', data, {
            preserveScroll: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    };

    const removeLogo = () => {
        form.setData('logo', null);
        form.setData('remove_logo', true);
    };

    return (
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Thương hiệu</h2>}
        >
            <Head title="Thương hiệu" />

            <div className="mx-auto max-w-2xl p-4 sm:p-6">
                <form onSubmit={submit} className="space-y-6 rounded-lg border bg-card p-6">
                    <div className="space-y-1.5">
                        <Label>Logo</Label>
                        {settings?.logo_url && !form.data.remove_logo && (
                            <div className="mb-2">
                                <img src={settings.logo_url} alt="Logo" className="h-16 w-auto rounded border object-contain" />
                                <Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="mt-1">
                                    Xóa logo
                                </Button>
                            </div>
                        )}
                        <Input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={(e) => {
                                form.setData('logo', e.target.files[0]);
                                form.setData('remove_logo', false);
                            }}
                        />
                        {form.errors.logo && <p className="text-sm text-destructive">{form.errors.logo}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="color">Màu chủ đạo</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="color"
                                type="color"
                                value={form.data.primary_color}
                                onChange={(e) => form.setData('primary_color', e.target.value)}
                                className="h-10 w-20 cursor-pointer p-1"
                            />
                            <Input
                                type="text"
                                value={form.data.primary_color}
                                onChange={(e) => form.setData('primary_color', e.target.value)}
                                placeholder="#2563eb"
                                className="font-mono"
                            />
                        </div>
                        {form.errors.primary_color && <p className="text-sm text-destructive">{form.errors.primary_color}</p>}
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                        <span>Màu chủ đạo sẽ hiển thị trên trang đặt sân công khai của bạn.</span>
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        Lưu
                    </Button>
                </form>
            </div>
        </ManagerLayout>
    );
}
