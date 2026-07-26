import { useCallback, useRef, useState } from 'react';

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
  const formRef = useRef(form);
  const rulesRef = useRef(rules);
  formRef.current = form;
  rulesRef.current = rules;

  const [fieldErrors, setFieldErrors] = useState(() => {
    const init = {};
    for (const key of Object.keys(rules)) init[key] = '';
    return init;
  });

  const validateField = useCallback((field, value) => {
    const fn = rulesRef.current[field];
    if (!fn) return '';
    return fn(value);
  }, []);

  /** Call this instead of form.setData — validates + sets both fieldErrors and form data. */
  const updateField = useCallback(
    (field, value) => {
      formRef.current.setData(field, value);
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    },
    [validateField],
  );

  /** Validate all fields at once. Returns true if valid. */
  const validateAll = useCallback(() => {
    const data = formRef.current.data;
    const errors = {};
    let valid = true;
    for (const [field, fn] of Object.entries(rulesRef.current)) {
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
  }, []);

  /** True when every field passes its current validation rule. */
  const isFormValid = Object.entries(rules).every(
    ([field, fn]) => !fn(form.data[field]),
  );

  return { fieldErrors, updateField, isFormValid, validateAll };
}
