import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Maps a domain status (enum value from the backend) to a colored badge with a
 * Vietnamese label. Single source of truth for status presentation across the app.
 *
 * Usage: <StatusBadge type="booking" value={booking.status} />
 *
 * Supported types: "booking" (BookingStatus), "payment" (PaymentStatus),
 * "refund" (RefundStatus), "series" (SeriesStatus).
 */

// Semantic tone → theme-aware Tailwind classes.
const TONES = {
  amber:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  emerald:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  slate:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  rose:
    'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
};

// type → { enum value → { label, tone } }
const MAP = {
  booking: {
    pending_deposit: { label: 'Chờ cọc', tone: 'amber' },
    confirmed: { label: 'Đã xác nhận', tone: 'emerald' },
    cancelled: { label: 'Đã hủy', tone: 'slate' },
    expired: { label: 'Hết hạn', tone: 'slate' },
    completed: { label: 'Đã hoàn tất', tone: 'emerald' },
    no_show: { label: 'Bom sân', tone: 'rose' },
  },
  payment: {
    awaiting: { label: 'Chờ thanh toán', tone: 'amber' },
    matched: { label: 'Đã khớp', tone: 'emerald' },
    orphaned: { label: 'Mất chỗ', tone: 'rose' },
  },
  refund: {
    requested: { label: 'Chờ hoàn', tone: 'amber' },
    done: { label: 'Đã hoàn', tone: 'emerald' },
    failed: { label: 'Thất bại', tone: 'rose' },
  },
  series: {
    active: { label: 'Đang chạy', tone: 'emerald' },
    ended: { label: 'Đã kết thúc', tone: 'slate' },
    cancelled: { label: 'Đã hủy', tone: 'slate' },
  },
};

export function StatusBadge({ type, value, className, ...props }) {
  const entry = MAP[type]?.[value];

  // Unknown status: render the raw value with a neutral tone rather than nothing.
  const label = entry?.label ?? value ?? '';
  const tone = entry?.tone ?? 'slate';

  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className={cn(TONES[tone], 'font-medium', className)}
      {...props}
    >
      {label}
    </Badge>
  );
}
