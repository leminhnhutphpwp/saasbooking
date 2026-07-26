/**
 * Vietnamese-locale formatters for SÂN. All helpers are null-safe:
 * they return '' (or a sensible fallback) for null/undefined/invalid input.
 * Money is integer VND (never float) per the money invariant.
 */

const VND = new Intl.NumberFormat('vi-VN');

const WEEKDAYS = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật',
};

/** Parse an ISO string / Date / timestamp into a valid Date, or null. */
function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 60000 → "60.000 vnđ" (integer VND, vi-VN grouping). */
export function formatVND(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  return VND.format(Math.round(num)) + ' vnđ';
}

/** ISO → "22/07/2026". */
export function formatDate(iso) {
  const d = toDate(iso);
  if (!d) return '';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** ISO → "18:00". */
export function formatTime(iso) {
  const d = toDate(iso);
  if (!d) return '';
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** ISO → "18:00 · 22/07/2026". */
export function formatDateTime(iso) {
  const d = toDate(iso);
  if (!d) return '';
  return `${formatTime(d)} · ${formatDate(d)}`;
}

/** 1 → "Thứ Hai" … 7 → "Chủ Nhật" (ISO weekday, Monday = 1). */
export function formatWeekday(n) {
  return WEEKDAYS[n] ?? '';
}
