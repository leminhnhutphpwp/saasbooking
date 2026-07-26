import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent } from '@/Components/ui/card';
import { Upload, X, Copy, Check, Image, Palette, ExternalLink, Eye } from 'lucide-react';

export default function Branding({ tenant, settings }) {
    const [previewUrl, setPreviewUrl] = useState(settings?.logo_url ?? null);
    const [copied, setCopied] = useState(false);
    const fileRef = useRef(null);
    const form = useForm({
        primary_color: settings?.primary_color ?? '#8b5cf6',
        logo: null,
        remove_logo: false,
    });

    const publicUrl = `${window.location.origin}/book/${tenant.slug}`;
    const pc = form.data.primary_color;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
            form.setError('logo', 'Chỉ chấp nhận file PNG/JPG (không hỗ trợ SVG).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            form.setError('logo', 'File quá lớn (tối đa 2MB).');
            return;
        }
        form.setData('logo', file);
        form.setData('remove_logo', false);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
        form.clearErrors('logo');
    };

    const removeLogo = () => {
        form.setData('logo', null);
        form.setData('remove_logo', true);
        setPreviewUrl(null);
        if (fileRef.current) fileRef.current.value = '';
    };

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

    const copyUrl = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <ManagerLayout>
            <Head title="Thương hiệu" />

            <PageContainer>
                <PageHeader
                    title="Thương hiệu"
                    description="Tùy chỉnh giao diện trang đặt sân công khai của bạn. Khách hàng sẽ thấy màu và logo này khi truy cập link đặt sân."
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Image className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Logo</h3>
                                </div>
                                <div className="space-y-4">
                                    {previewUrl && (
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={previewUrl} alt="Logo" className="h-20 w-auto rounded-xl border bg-white object-contain" />
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <p>Logo hiện tại</p>
                                                <p className="text-xs">PNG/JPG, tối đa 2MB</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
                                            <Upload className="h-4 w-4" />
                                            Chọn file
                                        </Button>
                                        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} className="hidden" />
                                        <span className="text-xs text-muted-foreground">PNG/JPG, tối đa 2MB</span>
                                    </div>
                                    {form.errors.logo && <p className="text-sm text-destructive">{form.errors.logo}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Palette className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Màu chủ đạo</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={pc}
                                        onChange={(e) => form.setData('primary_color', e.target.value)}
                                        className="h-14 w-14 cursor-pointer rounded-xl border-0 p-0"
                                    />
                                    <div className="flex-1">
                                        <Input type="text" value={pc} onChange={(e) => form.setData('primary_color', e.target.value)} placeholder="#8b5cf6" className="font-mono" />
                                        {form.errors.primary_color && <p className="text-sm text-destructive">{form.errors.primary_color}</p>}
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-muted-foreground">Màu này sẽ được dùng cho nút bấm, highlight, và các chi tiết trên trang đặt sân công khai.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <ExternalLink className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">URL trang đặt sân</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input type="text" value={publicUrl} readOnly className="font-mono text-sm" />
                                    <Button type="button" variant="outline" onClick={copyUrl} className="shrink-0 gap-2">
                                        {copied ? (
                                            <>
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                Đã sao chép
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                Sao chép
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">Chia sẻ link này với khách hàng để họ đặt sân trực tiếp.</p>
                            </CardContent>
                        </Card>

                        <Button onClick={submit} disabled={form.processing} className="w-full gap-2">
                            {form.processing ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </div>

                    <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Eye className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Xem trước trang đặt sân</h3>
                                </div>

                                <div className="overflow-hidden rounded-xl border bg-muted/30">
                                    <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${pc}dd 0%, ${pc} 100%)` }}>
                                        <div className="flex items-center gap-3 px-3 py-3">
                                            {previewUrl && (
                                                <img src={previewUrl} alt="Logo" className="h-8 w-8 rounded-lg border border-white/30 bg-white object-cover" />
                                            )}
                                            <div className="text-white">
                                                <p className="text-sm font-bold">{tenant.slug?.replace(/-/g, ' ') || 'Tên sân của bạn'}</p>
                                                <p className="text-[10px] text-white/70">Giữ sân 15 phút · cọc VietQR chống bom</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 p-3">
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                                <div
                                                    key={d}
                                                    className={`min-w-[36px] flex flex-col items-center rounded-lg px-2 py-1.5 text-[10px] ${d === 4 ? 'text-white' : 'border border-border bg-background text-muted-foreground'}`}
                                                    style={d === 4 ? { backgroundColor: pc } : {}}
                                                >
                                                    <span>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d - 1]}</span>
                                                    <span className="text-sm font-bold leading-tight">
                                                        {(new Date().getDate() + d - 4 + '').padStart(2, '0')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="rounded-xl border bg-background p-2">
                                            <div className="mb-1.5 flex items-center gap-1.5">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: pc }} />
                                                <p className="text-[10px] font-semibold">Sân 1</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="h-6 w-12 rounded border border-border bg-background" />
                                                <div className="h-6 w-12 rounded border border-amber-200 bg-amber-50" />
                                                <div className="h-6 w-12 rounded" style={{ backgroundColor: pc, opacity: 0.8 }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-center text-xs text-muted-foreground">
                                    Đây là giao diện trang đặt sân mà khách hàng của bạn sẽ thấy.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>
        </ManagerLayout>
    );
}
