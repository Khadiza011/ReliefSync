import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Boxes, ChevronDown, ChevronRight, ClipboardList, HandHeart, LogOut, Menu, Search, ShieldCheck, UserRound } from 'lucide-react';
import { Avatar } from '../ui/Segmented';
import { useAuth } from '../../context/AuthContext';
import { useSignOut } from '../../hooks/useSignOut';
import { useClickOutside, useEscape } from '../../hooks/useUi';
import { pageMetaFor } from '../../utils/navConfig';
import { PERMISSIONS, ROLE_COLORS, ROLE_NAMES } from '../../utils/constants';
import { cx, formatTime } from '../../utils/helpers';

export function Topbar({ onOpenMenu, onOpenPalette, signals, notifications = [], lastSync }) {
  const { user } = useAuth();
  const logout = useSignOut();
  const location = useLocation();
  const meta = pageMetaFor(location.pathname);
  const [menu, setMenu] = useState(null); // 'notifications' | 'user' | null
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useClickOutside(notifRef, () => menu === 'notifications' && setMenu(null), menu === 'notifications');
  useClickOutside(userRef, () => menu === 'user' && setMenu(null), menu === 'user');
  useEscape(() => setMenu(null), !!menu);

  const role = user?.role_id;
  const alerts = notifications.length ? buildRecentAlerts(notifications) : buildAlerts(signals, role);
  const alertCount = alerts.reduce((s, a) => s + (Number(a.count) || 1), 0);
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <header className="topbar">
      <button type="button" className="topbar__icon-btn topbar__menu" onClick={onOpenMenu} aria-label="Open navigation">
        <Menu />
      </button>

      <nav className="topbar__crumbs" aria-label="Breadcrumb">
        <span className="topbar__crumb-section">{meta.section}</span>
        <ChevronRight aria-hidden="true" />
        <span className="topbar__crumb-page">{meta.title}</span>
      </nav>

      <div className="topbar__spacer" />

      <button type="button" className="topbar__search" onClick={onOpenPalette} aria-label="Search and jump to (Ctrl+K)">
        <Search aria-hidden="true" />
        <span>Search or jump to…</span>
        <span className="topbar__search-keys" aria-hidden="true">
          <kbd className="kbd">{isMac ? '⌘' : 'Ctrl'}</kbd>
          <kbd className="kbd">K</kbd>
        </span>
      </button>

      {lastSync && (
        <div className="topbar__live" title={`Last synced ${lastSync.toLocaleTimeString()}`}>
          <span className="status-dot" aria-hidden="true" />
          <span>Live · {formatTime(lastSync)}</span>
        </div>
      )}

      <div className="topbar__menu-wrap" ref={notifRef}>
        <button
          type="button"
          className={cx('topbar__icon-btn', menu === 'notifications' && 'is-open')}
          onClick={() => setMenu(menu === 'notifications' ? null : 'notifications')}
          aria-label={`Notifications${alertCount ? ` (${alertCount})` : ''}`}
          aria-expanded={menu === 'notifications'}
        >
          <Bell />
          {alertCount > 0 && <span className="topbar__dot" aria-hidden="true" />}
        </button>
        <AnimatePresence>
          {menu === 'notifications' && (
            <motion.div
              className="popover popover--notifications"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="popover__head">
                <span>Needs attention</span>
                {alertCount > 0 && <span className="badge badge--cyan badge--sm">{alertCount}</span>}
              </div>
              {alerts.length === 0 ? (
                <div className="popover__empty">
                  <ShieldCheck aria-hidden="true" />
                  <span>You're all caught up.</span>
                </div>
              ) : (
                <ul className="popover__list">
                  {alerts.map((a) => (
                    <li key={a.key}>
                      <Link to={a.to} className="popover__item" onClick={() => setMenu(null)}>
                        <span className={`popover__item-icon popover__item-icon--${a.tone}`} aria-hidden="true">
                          <a.icon />
                        </span>
                        <span className="popover__item-text">
                          <span className="popover__item-title">{a.title}</span>
                          <span className="popover__item-sub">{a.sub}</span>
                        </span>
                        <ChevronRight className="popover__chev" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="topbar__menu-wrap" ref={userRef}>
        <button
          type="button"
          className={cx('topbar__user', menu === 'user' && 'is-open')}
          onClick={() => setMenu(menu === 'user' ? null : 'user')}
          aria-expanded={menu === 'user'}
          aria-haspopup="menu"
        >
          <Avatar name={user?.full_name || user?.email} tone={ROLE_COLORS[role]} size={30} />
          <span className="topbar__user-name">{user?.full_name?.split(' ')[0] || 'Account'}</span>
          <ChevronDown className="topbar__user-chev" aria-hidden="true" />
        </button>
        <AnimatePresence>
          {menu === 'user' && (
            <motion.div
              className="popover popover--user"
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="popover__profile">
                <Avatar name={user?.full_name || user?.email} tone={ROLE_COLORS[role]} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div className="popover__profile-name truncate">{user?.full_name || 'Signed in'}</div>
                  <div className="popover__profile-email truncate">{user?.email}</div>
                </div>
              </div>
              <div className="popover__role" style={{ '--tone': ROLE_COLORS[role] }}>
                <ShieldCheck aria-hidden="true" />
                {ROLE_NAMES[role]} access
              </div>
              <div className="divider" style={{ margin: '6px 0' }} />
              <Link to="/profile" role="menuitem" className="popover__action" onClick={() => setMenu(null)}>
                <UserRound aria-hidden="true" />
                Profile settings
              </Link>
              <button type="button" role="menuitem" className="popover__action" onClick={logout}>
                <LogOut aria-hidden="true" />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}


function buildRecentAlerts(rows) {
  return rows.slice(0, 10).map((row) => ({
    key: row.id,
    count: Number(row.count) || 1,
    icon: row.type === 'inventory' ? Boxes : row.type === 'donation' ? HandHeart : ClipboardList,
    tone: row.tone || 'cyan',
    title: row.title,
    sub: row.sub || 'Recent update',
    to: row.to || '/',
  }));
}

function buildAlerts(signals, role) {
  if (!signals) return [];
  const list = [];
  const pending = Number(signals.pending_requests) || 0;
  const low = Number(signals.low_stock_items) || 0;
  const donations = Number(signals.pending_donations) || 0;
  const critical = Number(signals.critical_requests) || 0;

  if (critical > 0) {
    list.push({ key: 'critical', count: critical, icon: ClipboardList, tone: 'danger', title: `${critical} critical request${critical > 1 ? 's' : ''} open`, sub: 'Highest priority — review now', to: '/requests' });
  }
  if (pending > 0) {
    list.push({ key: 'pending', count: pending, icon: ClipboardList, tone: 'cyan', title: `${pending} request${pending > 1 ? 's' : ''} awaiting approval`, sub: PERMISSIONS.reviewRequest.includes(role) ? 'Approve or cancel from the queue' : 'Waiting on relief managers', to: '/requests' });
  }
  if (low > 0) {
    list.push({ key: 'low', count: low, icon: Boxes, tone: 'warning', title: `${low} item${low > 1 ? 's' : ''} at or below reorder level`, sub: 'Restock before the next distribution', to: '/inventory' });
  }
  if (donations > 0) {
    list.push({ key: 'donations', count: donations, icon: HandHeart, tone: 'violet', title: `${donations} donation${donations > 1 ? 's' : ''} pending receipt`, sub: 'Confirm arrival to update stock', to: '/donations' });
  }
  return list;
}

export default Topbar;
