import { Head, router, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { Upload, X, Copy, Check, Image, Palette, ExternalLink } from 'lucide-react';

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

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
            form.setError('logo', 'Chỉ chấp nhận file PNG/JPG (không hỗ trợ SVG).');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            form.setError('logo', 'File quá lớn (tối đa 2MB).');
            return;
        }

        form.setData('logo', file);
        form.setData('remove_logo', false);

        // Create preview
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

            <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
                {/* Logo Upload */}
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
                                        <img
                                            src={previewUrl}
                                            alt="Logo preview"
                                            className="h-20 w-auto rounded-lg border object-contain bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow-sm"
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
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileRef.current?.click()}
                                    className="gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Chọn file
                                </Button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <span className="text-xs text-muted-foreground">
                                    PNG hoặc JPG, tối đa 2MB. Không hỗ trợ SVG.
                                </span>
                            </div>

                            {form.errors.logo && (
                                <p className="text-sm text-destructive">{form.errors.logo}</p>
                            )}
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

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={form.data.primary_color}
                                        onChange={(e) => form.setData('primary_color', e.target.value)}
                                        className="h-16 w-16 cursor-pointer rounded-lg border-0 p-0"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        type="text"
                                        value={form.data.primary_color}
                                        onChange={(e) => form.setData('primary_color', e.target.value)}
                                        placeholder="#059669"
                                        className="font-mono"
                                    />
                                    {form.errors.primary_color && (
                                        <p className="text-sm text-destructive">{form.errors.primary_color}</p>
                                    )}
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Xem trước</p>
                                <div
                                    className="rounded-lg border bg-white p-4"
                                    style={{ borderTopColor: form.data.primary_color, borderTopWidth: '3px' }}
                                >
                                    <div className="flex items-center gap-3">
                                        {previewUrl && (
                                            <img
                                                src={previewUrl}
                                                alt="Logo"
                                                className="h-8 w-auto rounded object-contain"
                                            />
                                        )}
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: form.data.primary_color }}>
                                                Tên sân của bạn
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Đặt sân nhanh — cọc VietQR chống bom
                                            </p>
                                        </div>
                                    </div>
                                </div>
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
                            <Input
                                type="text"
                                value={publicUrl}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={copyUrl}
                                className="gap-2 shrink-0"
                            >
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
                        <p className="mt-2 text-xs text-muted-foreground">
                            Chia sẻ link này với khách hàng để họ đặt sân trực tiếp.
                        </p>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={submit}
                        disabled={form.processing}
                        className="gap-2"
                    >
                        {form.processing ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>
        </ManagerLayout>
    );
}
