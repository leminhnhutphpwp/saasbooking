import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent } from '@/Components/ui/card';
import { Upload, X, Copy, Check, Image, Palette, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Branding({ tenant, settings }) {
    const [previewUrl, setPreviewUrl] = useState(settings?.logo_url ?? null);
    const [copied, setCopied] = useState(false);
    const fileRef = useRef(null);
    const form = useForm({
        primary_color: settings?.primary_color ?? '#059669',
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
        <ManagerLayout
            header={<h2 className="text-xl font-semibold leading-tight">Thương hiệu</h2>}
        >
            <Head title="Thương hiệu" />

            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
                <PageHeader
                    title="Thương hiệu"
                    description="Tùy chỉnh giao diện trang đặt sân công khai của bạn."
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left column: Form controls */}
                    <div className="space-y-6">
                        {/* Logo */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Image className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-semibold">Logo</h3>
                                </div>
                                <div className="space-y-4">
                                    {previewUrl && (
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={previewUrl} alt="Logo" className="h-20 w-auto rounded-lg border object-contain bg-white" />
                                                <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow-sm">
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
                                            <Upload className="h-4 w-4" />Chọn file
                                        </Button>
                                        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} className="hidden" />
                                        <span className="text-xs text-muted-foreground">PNG/JPG, tối đa 2MB</span>
                                    </div>
                                    {form.errors.logo && <p className="text-sm text-destructive">{form.errors.logo}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Brand Color */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Palette className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-semibold">Màu chủ đạo</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input type="color" value={pc} onChange={(e) => form.setData('primary_color', e.target.value)} className="h-16 w-16 cursor-pointer rounded-lg border-0 p-0" />
                                    <div className="flex-1">
                                        <Input type="text" value={pc} onChange={(e) => form.setData('primary_color', e.target.value)} placeholder="#059669" className="font-mono" />
                                        {form.errors.primary_color && <p className="text-sm text-destructive">{form.errors.primary_color}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Public URL */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-semibold">URL trang đặt sân</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input type="text" value={publicUrl} readOnly className="font-mono text-sm" />
                                    <Button type="button" variant="outline" onClick={copyUrl} className="gap-2 shrink-0">
                                        {copied ? <><Check className="h-4 w-4 text-emerald-500" />Đã sao chép</> : <><Copy className="h-4 w-4" />Sao chép</>}
                                    </Button>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">Chia sẻ link này với khách hàng để họ đặt sân trực tiếp.</p>
                            </CardContent>
                        </Card>

                        {/* Save */}
                        <Button onClick={submit} disabled={form.processing} size="lg" className="w-full gap-2">
                            {form.processing ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </div>

                    {/* Right column: Live preview */}
                    <div className="lg:sticky lg:top-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="font-semibold">Xem trước trang đặt sân</h3>
                                </div>

                                <div className="rounded-lg border bg-gray-50 overflow-hidden">
                                    {/* Hero preview */}
                                    <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${pc}dd 0%, ${pc} 100%)` }}>
                                        <div className="flex items-center gap-3 px-3 py-3">
                                            {previewUrl && (
                                                <img src={previewUrl} alt="Logo" className="h-8 w-8 rounded-lg border border-white/30 object-cover bg-white" />
                                            )}
                                            <div className="text-white">
                                                <p className="text-sm font-bold">{tenant.slug?.replace(/-/g, ' ') || 'Tên sân của bạn'}</p>
                                                <p className="text-[10px] text-white/70">Giữ sân 15 phút · cọc VietQR chống bom</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content preview */}
                                    <div className="p-3 space-y-2">
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                                                <div key={d} className={`min-w-[36px] flex flex-col items-center rounded-lg px-2 py-1.5 text-[10px] ${d === 4 ? 'text-white' : 'border border-gray-200 bg-white text-gray-500'}`} style={d === 4 ? { backgroundColor: pc } : {}}>
                                                    <span>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d - 1]}</span>
                                                    <span className="text-sm font-bold leading-tight">{(new Date().getDate() + d - 4 + '').padStart(2, '0')}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="rounded-lg border bg-white p-2">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: pc }} />
                                                <p className="text-[10px] font-semibold">Sân 1</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="h-6 w-12 rounded border border-gray-200 bg-white" />
                                                <div className="h-6 w-12 rounded bg-amber-50 border border-amber-200" />
                                                <div className="h-6 w-12 rounded" style={{ backgroundColor: pc, opacity: 0.8 }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground text-center">
                                    Đây là giao diện trang đặt sân mà khách hàng của bạn sẽ thấy.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}