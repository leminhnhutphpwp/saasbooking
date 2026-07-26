/**
 * Project-wide validation rules for SÂN.
 * Pure functions — no React dependency. Returns '' (valid) or Vietnamese error message.
 * Backend must mirror these regexes in PublicBookingController, CalendarController, CustomerController.
 */

const VN_PHONE_RE = /^(0[2-9]|84[2-9])\d{7,8}$/;

/** Normalize VN phone: strip +, spaces, dashes, normalize +84 → 84. */
function normalizePhone(v) {
  return v.replace(/[\s\-]/g, '').replace(/^\+84/, '84');
}

export const validators = {
  /** Name: required, 2–255 chars. */
  name: (v, { min = 2, max = 255 } = {}) => {
    if (!v || !v.trim()) return 'Tên không được để trống.';
    if (v.trim().length < min) return `Tên phải có ít nhất ${min} ký tự.`;
    if (v.length > max) return `Tên không được quá ${max} ký tự.`;
    return '';
  },

  /** Vietnamese phone: 0[2-9]xxxxxxxx, 84[2-9]xxxxxxxx, +84[2-9]xxxxxxxx (10–12 digits). */
  phone: (v) => {
    if (!v || !v.trim()) return 'Số điện thoại không được để trống.';
    if (!VN_PHONE_RE.test(normalizePhone(v.trim()))) return 'Số điện thoại không hợp lệ (VD: 0912345678).';
    return '';
  },

  /** Generic required. */
  required: (v, label = 'Trường này') => {
    if (v === null || v === undefined || (typeof v === 'string' && !v.trim())) {
      return `${label} không được để trống.`;
    }
    return '';
  },

  /** Email: optional, valid format when provided. */
  email: (v) => {
    if (!v || !v.trim()) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Email không hợp lệ.';
    return '';
  },

  /** Password: min 8 chars. */
  password: (v) => {
    if (!v) return 'Mật khẩu không được để trống.';
    if (v.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    return '';
  },
};

/**
 * Validate multiple fields at once.
 * @param {Object} data - { name: 'value', phone: 'value' }
 * @param {Object} rules - { name: validators.name, phone: validators.phone }
 * @returns {Object} - { name: 'error msg', phone: '' } (only fields with errors)
 */
export function validateFields(data, rules) {
  const errors = {};
  for (const [field, fn] of Object.entries(rules)) {
    const err = fn(data[field]);
    if (err) errors[field] = err;
  }
  return errors;
}
