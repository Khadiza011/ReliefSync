import { useId } from 'react';
import { motion } from 'framer-motion';

/** Tab-like segmented control with a sliding pill. options: [{ value, label, icon?, count? }] */
export function Segmented({ value, onChange, options, ariaLabel }) {
  const layoutId = useId();
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className="segmented__item"
            onClick={() => onChange(opt.value)}
          >
            {selected && (
              <motion.span
                layoutId={`seg-${layoutId}`}
                className="segmented__pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {Icon && <Icon aria-hidden="true" />}
            <span className="segmented__label">{opt.label}</span>
            {opt.count !== undefined && <span className="segmented__count">{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ name, tone, size = 34 }) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const text = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'U').slice(0, 2);
  return (
    <span
      className="avatar"
      style={{ '--avatar-size': `${size}px`, ...(tone ? { '--tone': tone } : null) }}
      aria-hidden="true"
    >
      {text.toUpperCase()}
    </span>
  );
}

export default Segmented;
