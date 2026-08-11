import { Head, useForm } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { PageHeader } from '@/Components/PageHeader';
import { PageContainer } from '@/Components/PageContainer';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Card, CardContent } from '@/Components/ui/card';
import { formatVND } from '@/lib/format';
import { Banknote, MapPin, Phone, Mail, Globe, MessageCircle, Save, RotateCcw } from 'lucide-react';

export default function VenueProfile({ tenant }) {
    const initialValues = {
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
    };

    const form = useForm(initialValues);

    const submit = (e) => {
        e.preventDefault();
        form.post(route('manager.venue.update'), { preserveScroll: true });
    };

    const handleCancel = () => {
        form.reset();
        form.clearErrors();
    };

    return (
        <ManagerLayout>
            <Head title="Hồ sơ cơ sở" />

            <PageContainer>
                <PageHeader
                    title="Hồ sơ cơ sở"
                    description="Thông tin hiển thị trên trang đặt sân công khai. Khách hàng sẽ thấy địa chỉ, số điện thoại, và liên hệ mạng xã hội."
                />

                <form onSubmit={submit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="manager-icon-well">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Liên hệ</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="venue-phone">Số điện thoại</Label>
                                        <Input id="venue-phone" type="tel" placeholder="0901234567" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                        {form.errors.phone && <p className="mt-1 text-sm text-destructive">{form.errors.phone}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="venue-email">Email</Label>
                                        <Input id="venue-email" type="email" placeholder="info@san.vn" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                                        {form.errors.email && <p className="mt-1 text-sm text-destructive">{form.errors.email}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="venue-website">Website</Label>
                                        <Input id="venue-website" type="url" placeholder="https://san.vn" value={form.data.website} onChange={(e) => form.setData('website', e.target.value)} />
                                        {form.errors.website && <p className="mt-1 text-sm text-destructive">{form.errors.website}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="manager-icon-well">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Địa chỉ</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="venue-address">Địa chỉ</Label>
                                        <Input id="venue-address" placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                                        {form.errors.address && <p className="mt-1 text-sm text-destructive">{form.errors.address}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="venue-lat">Vĩ độ (Lat)</Label>
                                            <Input id="venue-lat" type="number" step="0.0000001" placeholder="10.7769" value={form.data.lat} onChange={(e) => form.setData('lat', e.target.value)} />
                                            {form.errors.lat && <p className="mt-1 text-sm text-destructive">{form.errors.lat}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="venue-lng">Kinh độ (Lng)</Label>
                                            <Input id="venue-lng" type="number" step="0.0000001" placeholder="106.7009" value={form.data.lng} onChange={(e) => form.setData('lng', e.target.value)} />
                                            {form.errors.lng && <p className="mt-1 text-sm text-destructive">{form.errors.lng}</p>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="manager-icon-well">
                                        <Banknote className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Giá mặc định</h3>
                                        <p className="text-xs text-muted-foreground">Lưới an toàn khi không có mức giá theo ngày và giờ.</p>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="default-price-per-hour">Giá mỗi giờ (VNĐ)</Label>
                                    <Input
                                        id="default-price-per-hour"
                                        type="number"
                                        min="0"
                                        max="1000000000"
                                        step="1000"
                                        placeholder="100000"
                                        value={form.data.pricing.default_price_per_hour}
                                        onChange={(e) => form.setData('pricing.default_price_per_hour', e.target.value)}
                                        className="font-num"
                                    />
                                    {form.data.pricing.default_price_per_hour && (
                                        <p className="mt-1.5 font-num text-xs text-muted-foreground">
                                            = {formatVND(Number(form.data.pricing.default_price_per_hour))} / giờ
                                        </p>
                                    )}
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        Giá riêng của sân và giá chung toàn cơ sở luôn được ưu tiên trước mức này.
                                    </p>
                                    {form.errors['pricing.default_price_per_hour'] && <p className="mt-1 text-sm text-destructive">{form.errors['pricing.default_price_per_hour']}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="manager-icon-well">
                                        <MessageCircle className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Mạng xã hội</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="venue-zalo">Zalo</Label>
                                        <Input id="venue-zalo" type="url" placeholder="https://zalo.me/0901234567" value={form.data.social.zalo} onChange={(e) => form.setData('social.zalo', e.target.value)} />
                                        {form.errors['social.zalo'] && <p className="mt-1 text-sm text-destructive">{form.errors['social.zalo']}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="venue-facebook">Facebook</Label>
                                        <Input id="venue-facebook" type="url" placeholder="https://facebook.com/..." value={form.data.social.facebook} onChange={(e) => form.setData('social.facebook', e.target.value)} />
                                        {form.errors['social.facebook'] && <p className="mt-1 text-sm text-destructive">{form.errors['social.facebook']}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="venue-instagram">Instagram</Label>
                                        <Input id="venue-instagram" type="url" placeholder="https://instagram.com/..." value={form.data.social.instagram} onChange={(e) => form.setData('social.instagram', e.target.value)} />
                                        {form.errors['social.instagram'] && <p className="mt-1 text-sm text-destructive">{form.errors['social.instagram']}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <div className="manager-icon-well">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-semibold">Giới thiệu</h3>
                                </div>
                                <div>
                                    <Label htmlFor="venue-description" className="sr-only">Giới thiệu về cơ sở</Label>
                                    <Textarea id="venue-description" placeholder="Mô tả ngắn gọn về cơ sở của bạn..." rows={3} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                                    <p className="mt-1.5 text-xs text-muted-foreground">Hiển thị trên trang đặt sân công khai.</p>
                                    {form.errors.description && <p className="mt-1 text-sm text-destructive">{form.errors.description}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button type="submit" disabled={form.processing} className="flex-1 gap-2">
                                <Save className="h-4 w-4" />
                                {form.processing ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel} disabled={form.processing} className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Hủy
                            </Button>
                        </div>
                    </div>

                    <div className="xl:col-span-1 xl:sticky xl:top-6 xl:self-start">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="mb-3 font-semibold">Xem trước</h3>
                                <div className="manager-well space-y-2 p-3 text-sm">
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
