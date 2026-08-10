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
  pending: 'bg-secondary text-muted-foreground',
  positive: 'bg-accent text-accent-foreground',
  neutral: 'bg-secondary text-muted-foreground',
  negative: 'ui-negative',
};

// type → { enum value → { label, tone } }
const MAP = {
  booking: {
    pending_deposit: { label: 'Chờ cọc', tone: 'pending' },
    confirmed: { label: 'Đã xác nhận', tone: 'positive' },
    cancelled: { label: 'Đã hủy', tone: 'neutral' },
    expired: { label: 'Hết hạn', tone: 'neutral' },
    completed: { label: 'Đã hoàn tất', tone: 'positive' },
    no_show: { label: 'Bom sân', tone: 'negative' },
  },
  payment: {
    awaiting: { label: 'Chờ thanh toán', tone: 'pending' },
    matched: { label: 'Đã khớp', tone: 'positive' },
    orphaned: { label: 'Mất chỗ', tone: 'negative' },
  },
  refund: {
    requested: { label: 'Chờ hoàn', tone: 'pending' },
    done: { label: 'Đã hoàn', tone: 'positive' },
    failed: { label: 'Thất bại', tone: 'negative' },
  },
  series: {
    active: { label: 'Đang chạy', tone: 'positive' },
    ended: { label: 'Đã kết thúc', tone: 'neutral' },
    cancelled: { label: 'Đã hủy', tone: 'neutral' },
  },
};

export function StatusBadge({ type, value, className, ...props }) {
  const entry = MAP[type]?.[value];

  // Unknown status: render the raw value with a neutral tone rather than nothing.
  const label = entry?.label ?? value ?? '';
  const tone = entry?.tone ?? 'neutral';

  if (!label) return null;

  return (
    <Badge
      className={cn(TONES[tone], 'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold', className)}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'negative' ? 'bg-destructive' : tone === 'positive' ? 'bg-primary' : 'bg-muted-foreground')} aria-hidden="true" />
      {label}
    </Badge>
  );
}
