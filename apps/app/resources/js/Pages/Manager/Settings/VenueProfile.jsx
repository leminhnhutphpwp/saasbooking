import { Head, useForm } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Card, CardContent } from '@/Components/ui/card';
import { Banknote, MapPin, Phone, Mail, Globe, MessageCircle, Save } from 'lucide-react';

export default function VenueProfile({ tenant }) {
    const form = useForm({
        address: tenant.address ?? '',
        phone: tenant.phone ?? '',
        email: tenant.email ?? '',
        website: tenant.website ?? '',
        lat: tenant.lat ?? '',
        lng: tenant.lng ?? '',
        description: tenant.description ?? '',
        pricing: {
            default_price_per_hour: tenant.settings?.pricing?.default_price_per_hour ?? '',
        },
        social: {
            zalo: tenant.settings?.social?.zalo ?? '',
            facebook: tenant.settings?.social?.facebook ?? '',
            instagram: tenant.settings?.social?.instagram ?? '',
        },
    });

    const submit = (e) => {
        e.preventDefault();
        form.post('/manager/venue', { preserveScroll: true });
    };

    return (
        <ManagerLayout>
            <Head title="Hồ sơ cơ sở" />

            <PageContainer>
                <PageHeader
                    title="Hồ sơ cơ sở"
                    description="Thông tin hiển thị trên trang đặt sân công khai. Khách hàng sẽ thấy địa chỉ, số điện thoại, và liên hệ mạng xã hội."
                />

                <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Contact Info */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Liên hệ</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Số điện thoại</label>
                                        <Input type="tel" placeholder="0901234567" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                        {form.errors.phone && <p className="mt-1 text-sm text-destructive">{form.errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Email</label>
                                        <Input type="email" placeholder="info@san.vn" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                                        {form.errors.email && <p className="mt-1 text-sm text-destructive">{form.errors.email}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium">Website</label>
                                        <Input type="url" placeholder="https://san.vn" value={form.data.website} onChange={(e) => form.setData('website', e.target.value)} />
                                        {form.errors.website && <p className="mt-1 text-sm text-destructive">{form.errors.website}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address & Geo */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Địa chỉ</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Địa chỉ</label>
                                        <Input placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                                        {form.errors.address && <p className="mt-1 text-sm text-destructive">{form.errors.address}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium">Vĩ độ (Lat)</label>
                                            <Input type="number" step="0.0000001" placeholder="10.7769" value={form.data.lat} onChange={(e) => form.setData('lat', e.target.value)} />
                                            {form.errors.lat && <p className="mt-1 text-sm text-destructive">{form.errors.lat}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium">Kinh độ (Lng)</label>
                                            <Input type="number" step="0.0000001" placeholder="106.7009" value={form.data.lng} onChange={(e) => form.setData('lng', e.target.value)} />
                                            {form.errors.lng && <p className="mt-1 text-sm text-destructive">{form.errors.lng}</p>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Social Links */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Banknote className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Giá mặc định</h3>
                                        <p className="text-xs text-muted-foreground">Lưới an toàn khi không có mức giá theo ngày và giờ.</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Giá mỗi giờ (VNĐ)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="1000000000"
                                        step="1000"
                                        placeholder="100000"
                                        value={form.data.pricing.default_price_per_hour}
                                        onChange={(e) => form.setData('pricing.default_price_per_hour', e.target.value)}
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        Giá riêng của sân và giá chung toàn cơ sở luôn được ưu tiên trước mức này.
                                    </p>
                                    {form.errors['pricing.default_price_per_hour'] && <p className="mt-1 text-sm text-destructive">{form.errors['pricing.default_price_per_hour']}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Social Links */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <MessageCircle className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Mạng xã hội</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Zalo</label>
                                        <Input type="url" placeholder="https://zalo.me/0901234567" value={form.data.social.zalo} onChange={(e) => form.setData('social.zalo', e.target.value)} />
                                        {form.errors['social.zalo'] && <p className="mt-1 text-sm text-destructive">{form.errors['social.zalo']}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Facebook</label>
                                        <Input type="url" placeholder="https://facebook.com/..." value={form.data.social.facebook} onChange={(e) => form.setData('social.facebook', e.target.value)} />
                                        {form.errors['social.facebook'] && <p className="mt-1 text-sm text-destructive">{form.errors['social.facebook']}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium">Instagram</label>
                                        <Input type="url" placeholder="https://instagram.com/..." value={form.data.social.instagram} onChange={(e) => form.setData('social.instagram', e.target.value)} />
                                        {form.errors['social.instagram'] && <p className="mt-1 text-sm text-destructive">{form.errors['social.instagram']}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Giới thiệu</h3>
                                </div>
                                <div>
                                    <Textarea placeholder="Mô tả ngắn gọn về cơ sở của bạn..." rows={3} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                                    <p className="mt-1.5 text-xs text-muted-foreground">Hiển thị trên trang đặt sân công khai.</p>
                                    {form.errors.description && <p className="mt-1 text-sm text-destructive">{form.errors.description}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" disabled={form.processing} className="w-full gap-2">
                            <Save className="h-4 w-4" />
                            {form.processing ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="mb-3 font-semibold">Xem trước</h3>
                                <div className="space-y-2 rounded-xl border bg-muted/30 p-3 text-sm">
                                    {form.data.address && (
                                        <div className="flex items-start gap-2 text-muted-foreground">
                                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span className="text-xs">{form.data.address}</span>
                                        </div>
                                    )}
                                    {form.data.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-xs">{form.data.phone}</span>
                                        </div>
                                    )}
                                    {form.data.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-xs">{form.data.email}</span>
                                        </div>
                                    )}
                                    {form.data.description && (
                                        <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">{form.data.description}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </PageContainer>
        </ManagerLayout>
    );
}
