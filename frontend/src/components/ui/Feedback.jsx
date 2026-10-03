import { motion } from 'framer-motion';
import { CircleAlert, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { Logo } from '../brand/Logo';
import { cx } from '../../utils/helpers';
import { fadeUp } from '../../utils/motion';

export function Skeleton({ width = '100%', height = 14, radius, className, style }) {
  return (
    <span
      className={cx('skeleton', className)}
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({ rows = 6, columns = 5 }) {
  return (
    <div style={{ padding: '8px 20px 16px' }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `1.4fr repeat(${columns - 1}, 1fr)`,
            gap: 20,
            alignItems: 'center',
            height: 56,
            borderBottom: '1px solid var(--border-1)',
          }}
        >
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} height={c === 0 ? 14 : 12} width={c === 0 ? '80%' : `${50 + ((r * 7 + c * 13) % 40)}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card stat" aria-hidden="true">
      <div className="stat__top">
        <Skeleton width={110} height={12} />
        <Skeleton width={36} height={36} radius={11} />
      </div>
      <Skeleton width={90} height={30} style={{ marginTop: 'auto' }} />
      <Skeleton width={140} height={10} style={{ marginTop: 14 }} />
    </div>
  );
}

export function Spinner({ size = 22 }) {
  return <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Loading" />;
}

/** Full-screen splash while auth state restores. */
export function BootScreen({ label = 'Restoring your session…' }) {
  return (
    <div className="boot-screen">
      <div className="boot-screen__inner">
        <span className="boot-screen__logo">
          <Logo size={52} withWordmark={false} />
        </span>
        <Spinner />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, compact = false, tone }) {
  return (
    <motion.div
      className={cx('state', compact && 'state--compact', tone && `state--${tone}`)}
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      <span className="state__icon" aria-hidden="true">
        <Icon />
      </span>
      <h3 className="state__title">{title}</h3>
      {description && <p className="state__description">{description}</p>}
      {action && <div className="state__action">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({ title = 'Something went wrong', error, message, onRetry, compact = false }) {
  const detail = message || error?.message || 'We could not reach the ReliefSync API. Check that the backend is running and try again.';
  return (
    <motion.div
      className={cx('state', 'state--error', compact && 'state--compact')}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      role="alert"
    >
      <span className="state__icon" aria-hidden="true">
        <CircleAlert />
      </span>
      <h3 className="state__title">{title}</h3>
      <p className="state__description">{detail}</p>
      {onRetry && (
        <div className="state__action">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw />} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </motion.div>
  );
}
