import { useState, useCallback, useMemo } from 'react';

/**
 * Project-wide form validation hook for SÂN.
 * Wraps validators.js with Inertia's useForm for real-time field validation.
 *
 * @param {Object} form - Inertia useForm() instance
 * @param {Object} rules - { fieldName: validatorFunction, ... }
 *   e.g. { name: validators.name, phone: validators.phone }
 * @returns {{ fieldErrors, updateField, isFormValid, validateAll }}
 *
 * @example
 *   import { validators } from '@/lib/validators';
 *   import { useFieldValidation } from '@/hooks/useFieldValidation';
 *
 *   const form = useForm({ name: '', phone: '' });
 *   const { fieldErrors, updateField, isFormValid } = useFieldValidation(form, {
 *     name: validators.name,
 *     phone: validators.phone,
 *   });
 *
 *   // In JSX:
 *   <Input onChange={(e) => updateField('name', e.target.value)} />
 *   {fieldErrors.name && <p className="text-destructive">{fieldErrors.name}</p>}
 *   <Button disabled={!isFormValid}>Submit</Button>
 */
export function useFieldValidation(form, rules) {
  const [fieldErrors, setFieldErrors] = useState(() => {
    const init = {};
    for (const key of Object.keys(rules)) init[key] = '';
    return init;
  });

  const validateField = useCallback(
    (field, value) => {
      const fn = rules[field];
      if (!fn) return '';
      return fn(value);
    },
    [rules],
  );

  /** Call this instead of form.setData — validates + sets both fieldErrors and form data. */
  const updateField = useCallback(
    (field, value) => {
      form.setData(field, value);
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [form, validateField],
  );

  /** Validate all fields at once. Returns true if valid. */
  const validateAll = useCallback(() => {
    const data = form.data;
    const errors = {};
    let valid = true;
    for (const [field, fn] of Object.entries(rules)) {
      const err = fn(data[field]);
      if (err) {
        errors[field] = err;
        valid = false;
      } else {
        errors[field] = '';
      }
    }
    setFieldErrors(errors);
    return valid;
  }, [form, rules]);

  /** True when all field errors are empty and all fields have values. */
  const isFormValid = useMemo(() => {
    const data = form.data;
    for (const [field, fn] of Object.entries(rules)) {
      if (fn(data[field])) return false;
    }
    return true;
  }, [form.data, rules]);

  return { fieldErrors, updateField, isFormValid, validateAll };
}
