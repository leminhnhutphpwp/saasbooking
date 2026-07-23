import { Head, Link } from '@inertiajs/react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import { Button } from '@/Components/ui/button';
import { Clock, DollarSign } from 'lucide-react';

export default function Config({ courts }) {
    return (
        <ManagerLayout>
            <Head title="Giờ & Giá" />

            <div className="space-y-6 p-4 sm:p-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Giờ & Giá</h1>
                    <p className="text-sm text-muted-foreground">
                        Cấu hình giờ mở cửa và bảng giá cho từng sân
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courts.length === 0 && (
                        <p className="col-span-full text-center text-sm text-muted-foreground">
                            Chưa có sân nào đang hoạt động.
                        </p>
                    )}
                    {courts.map((court) => (
                        <div
                            key={court.uuid}
                            className="rounded-2xl border bg-card p-6 shadow-sm"
                        >
                            <h3 className="font-semibold">{court.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {court.court_type_label}
                            </p>

                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    asChild
                                >
                                    <Link
                                        href={`/manager/courts/${court.uuid}/opening-rules`}
                                    >
                                        <Clock className="h-4 w-4" />
                                        Giờ ({court.opening_rules_count})
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    asChild
                                >
                                    <Link
                                        href={`/manager/courts/${court.uuid}/pricing-rules`}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        Giá ({court.pricing_rules_count})
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ManagerLayout>
    );
}
