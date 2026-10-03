import { forwardRef, useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from '../../utils/helpers';

/** Label + control + hint/error wrapper. Children receive the generated id via `id` prop. */
export function Field({ label, required, hint, error, className, htmlFor, aside, children }) {
  return (
    <div className={cx('field', error && 'field--error', className)}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          <span>
            {label}
            {required && <span className="field__required" aria-hidden="true">*</span>}
          </span>
          {aside}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error" role="alert">
          <CircleAlert aria-hidden="true" />
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, required, hint, error, icon: Icon, suffix, size, className, fieldClassName, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={inputId} className={fieldClassName}>
      <div className="control">
        {Icon && (
          <span className="control__icon" aria-hidden="true">
            <Icon />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cx(
            'input',
            Icon && 'input--with-icon',
            suffix && 'input--with-suffix',
            size === 'lg' && 'input--lg',
            className
          )}
          aria-invalid={error ? true : undefined}
          required={required}
          {...rest}
        />
        {suffix && <span className="control__suffix">{suffix}</span>}
      </div>
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, required, hint, error, options = [], placeholder, className, fieldClassName, id, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={selectId} className={fieldClassName}>
      <select
        ref={ref}
        id={selectId}
        className={cx('select', className)}
        aria-invalid={error ? true : undefined}
        required={required}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, required, hint, error, className, fieldClassName, id, ...rest },
  ref
) {
  const autoId = useId();
  const areaId = id || autoId;
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={areaId} className={fieldClassName}>
      <textarea
        ref={ref}
        id={areaId}
        className={cx('textarea', className)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    </Field>
  );
});

/** Radio group rendered as chips. options: [{ value, label, color? }] */
export function ChoiceGroup({ label, required, error, hint, value, onChange, options, name }) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <div className="choice-group" role="radiogroup" aria-label={label || name}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            className="choice"
            onClick={() => onChange(opt.value)}
          >
            {opt.color && <span className="choice__swatch" style={{ background: opt.color }} aria-hidden="true" />}
            {opt.icon && <opt.icon size={14} aria-hidden="true" />}
            {opt.label}
          </button>
        ))}
      </div>
    </Field>
  );
}
