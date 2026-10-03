import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CircleCheck,
  PackageCheck,
  PencilLine,
  Plus,
  RefreshCw,
  ScrollText,
  Truck,
  UserPlus,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Feedback';
import { Meter } from '../../components/charts/Charts';
import { useSpotlight } from '../../hooks/useUi';
import { ROLE_COLORS, ROLE_NAMES, stockState } from '../../utils/constants';
import { cx, formatNumber, formatRelativeTime, greeting, truncate } from '../../utils/helpers';
import { actionTone } from '../../utils/audit';
import { EASE, fadeUp } from '../../utils/motion';
import '../pages.css';

/* ---------- Greeting banner ---------- */
export function DashboardHero({ user, role, title, subtitle, actions, onRefresh, refreshing, stats = [] }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <motion.section
      className="dash-hero"
      style={{ '--tone': ROLE_COLORS[role] }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="dash-hero__glow" aria-hidden="true" />
      <div className="dash-hero__grid" aria-hidden="true" />
      <div className="dash-hero__content">
        <div className="dash-hero__meta">
          <span className="dash-hero__role">
            <span className="dash-hero__role-dot" aria-hidden="true" />
            {ROLE_NAMES[role]} workspace
          </span>
          <span className="dash-hero__date">{today}</span>
        </div>
        <h1 className="dash-hero__title">
          {title || (
            <>
              {greeting()}, <span className="text-gradient">{user?.full_name?.split(' ')[0] || 'there'}</span>
            </>
          )}
        </h1>
        {subtitle && <p className="dash-hero__subtitle">{subtitle}</p>}
        {stats.length > 0 && (
          <div className="dash-hero__stats">
            {stats.map((s) => (
              <div key={s.label} className="dash-hero__stat">
                <span className="dash-hero__stat-value tabular">{s.value}</span>
                <span className="dash-hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="dash-hero__actions">
        {onRefresh && (
          <Button variant="secondary" size="md" onClick={onRefresh} loading={refreshing} leftIcon={<RefreshCw />}>
            Refresh
          </Button>
        )}
        {actions}
      </div>
    </motion.section>
  );
}

/* ---------- Quick actions ---------- */
export function QuickActions({ actions }) {
  const onMove = useSpotlight();
  return (
    <div className="quick-actions">
      {actions.map((a, i) => {
        const Icon = a.icon;
        const content = (
          <>
            <span className="quick-action__icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="quick-action__text">
              <span className="quick-action__label">{a.label}</span>
              <span className="quick-action__desc">{a.description}</span>
            </span>
            <ArrowRight className="quick-action__arrow" aria-hidden="true" />
          </>
        );
        return (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.1 + i * 0.05 }}
          >
            {a.to ? (
              <Link to={a.to} className="quick-action spotlight" onMouseMove={onMove} style={a.tone ? { '--tone': a.tone } : undefined}>
                {content}
              </Link>
            ) : (
              <button type="button" className="quick-action spotlight" onClick={a.onClick} onMouseMove={onMove} style={a.tone ? { '--tone': a.tone } : undefined}>
                {content}
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------- Activity timeline ---------- */
const ACTION_ICON = {
  INSERT: Plus,
  CREATE: Plus,
  UPDATE: PencilLine,
  DELETE: X,
  APPROVE: Check,
  RECEIVE: PackageCheck,
  DISTRIBUTE: Truck,
  LOGIN: UserPlus,
};

/** items: [{ id, action, title, description, at, actor }] */
export function ActivityTimeline({ items, emptyText = 'No activity recorded yet.', limit = 8 }) {
  if (!items.length) {
    return <EmptyState icon={ScrollText} title="Quiet for now" description={emptyText} compact />;
  }
  return (
    <ol className="timeline">
      {items.slice(0, limit).map((item, i) => {
        const key = String(item.action || '').toUpperCase();
        const Icon = item.icon || ACTION_ICON[Object.keys(ACTION_ICON).find((k) => key.includes(k))] || ScrollText;
        const tone = item.tone || actionTone(item.action);
        return (
          <motion.li
            key={item.id ?? i}
            className="timeline__item"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.05 * i }}
          >
            <span className={`timeline__icon timeline__icon--${tone}`} aria-hidden="true">
              <Icon />
            </span>
            <div className="timeline__body">
              <div className="timeline__title">{item.title}</div>
              {item.description && <div className="timeline__desc">{truncate(item.description, 90)}</div>}
              <div className="timeline__meta">
                {item.actor && <span>{item.actor}</span>}
                {item.actor && <span aria-hidden="true">·</span>}
                <time dateTime={item.at}>{formatRelativeTime(item.at)}</time>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/* ---------- Request queue (approve / cancel inline) ---------- */
export function RequestQueue({ requests, canReview, onReview, busyId, emptyTitle = 'Queue is clear', limit = 6 }) {
  if (!requests.length) {
    return (
      <EmptyState
        icon={CircleCheck}
        tone="success"
        title={emptyTitle}
        description="No relief requests are waiting for a decision."
        compact
      />
    );
  }
  return (
    <ul className="queue">
      {requests.slice(0, limit).map((r, i) => (
        <motion.li
          key={r.request_id}
          className={cx('queue__item', r.priority === 'CRITICAL' && 'is-critical')}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: i * 0.04 }}
        >
          <div className="queue__main">
            <div className="queue__top">
              <span className="code-chip">{r.request_code}</span>
              <PriorityBadge priority={r.priority} size="sm" />
              <StatusBadge status={r.status} size="sm" />
            </div>
            <div className="queue__title">{r.shelter_name}</div>
            <div className="queue__sub">
              {[r.district, r.upazila].filter(Boolean).join(', ')} · {formatRelativeTime(r.requested_at)}
              {r.notes ? ` · “${truncate(r.notes, 48)}”` : ''}
            </div>
          </div>
          {canReview && r.status === 'REQUESTED' && (
            <div className="queue__actions">
              <Button
                variant="danger-soft"
                size="sm"
                iconOnly
                aria-label={`Cancel ${r.request_code}`}
                title="Cancel request"
                onClick={() => onReview(r, 'CANCELLED')}
                disabled={busyId === r.request_id}
              >
                <X />
              </Button>
              <Button
                variant="success-soft"
                size="sm"
                leftIcon={<Check />}
                onClick={() => onReview(r, 'APPROVED')}
                loading={busyId === r.request_id}
              >
                Approve
              </Button>
            </div>
          )}
        </motion.li>
      ))}
    </ul>
  );
}

/* ---------- Low stock ---------- */
export function LowStockList({ rows, limit = 6 }) {
  if (!rows.length) {
    return (
      <EmptyState icon={PackageCheck} tone="success" title="Stock levels healthy" description="Every item is above its reorder level." compact />
    );
  }
  return (
    <ul className="stock-list">
      {rows.slice(0, limit).map((r) => {
        const state = stockState(r.quantity, r.reorder_level);
        const ratio = Number(r.reorder_level) > 0 ? (Number(r.quantity) / Number(r.reorder_level)) * 100 : 0;
        return (
          <li key={r.inventory_id} className="stock-list__item">
            <div className="stock-list__meta">
              <div>
                <div className="stock-list__name">{r.item_name}</div>
                <div className="stock-list__sub">{r.shelter_name}</div>
              </div>
              <StatusBadge status={state} size="sm" />
            </div>
            <Meter
              value={Math.min(100, ratio)}
              max={100}
              size="sm"
              label={`${formatNumber(r.quantity)} ${r.unit || ''} on hand`}
              detail={`reorder at ${formatNumber(r.reorder_level)}`}
              tone={state === 'OUT_OF_STOCK' ? 'danger' : state === 'LOW_STOCK' ? 'warning' : 'ok'}
            />
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Shelter occupancy ---------- */
export function ShelterOccupancy({ shelters, limit = 6, highlightIds }) {
  if (!shelters.length) {
    return <EmptyState title="No shelters registered" description="Shelters appear here once they are added to the database." compact />;
  }
  const sorted = [...shelters].sort(
    (a, b) => Number(b.current_occupancy || 0) / (Number(b.total_capacity) || 1) - Number(a.current_occupancy || 0) / (Number(a.total_capacity) || 1)
  );
  return (
    <div className="occupancy">
      {sorted.slice(0, limit).map((s) => (
        <div key={s.shelter_id} className={cx('occupancy__row', highlightIds?.has(s.shelter_id) && 'is-mine')}>
          <Meter
            value={Number(s.current_occupancy) || 0}
            max={Number(s.total_capacity) || 1}
            label={s.shelter_name}
            detail={`${formatNumber(s.current_occupancy || 0)} / ${formatNumber(s.total_capacity)}`}
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- Small helpers ---------- */
export function SectionLink({ to, children = 'View all' }) {
  return (
    <Link to={to} className="section-link">
      {children}
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

