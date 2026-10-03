import { cx } from '../../utils/helpers';
import { PRIORITY_META, STATUS_META, humanize } from '../../utils/constants';

export function Badge({ tone = 'neutral', size = 'md', dot = false, pulse = false, icon: Icon, className, children }) {
  return (
    <span className={cx('badge', `badge--${tone}`, size === 'sm' && 'badge--sm', pulse && 'badge--pulse', className)}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Status pill for any workflow status (requests, donations, families, shelters…). */
export function StatusBadge({ status, size = 'md' }) {
  if (!status) return <span className="muted">—</span>;
  const meta = STATUS_META[status] || { tone: 'neutral' };
  return (
    <Badge tone={meta.tone} size={size} dot pulse={meta.pulse}>
      {meta.label || humanize(status)}
    </Badge>
  );
}

/** Priority pill — icon + label so meaning never relies on color alone. */
export function PriorityBadge({ priority, size = 'md' }) {
  if (!priority) return <span className="muted">—</span>;
  const meta = PRIORITY_META[priority] || { tone: 'neutral', label: humanize(priority) };
  return (
    <Badge tone={meta.tone} size={size} icon={meta.icon}>
      {meta.label}
    </Badge>
  );
}

export default Badge;
