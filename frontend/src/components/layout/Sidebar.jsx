import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Avatar } from '../ui/Segmented';
import { useAuth } from '../../context/AuthContext';
import { useSignOut } from '../../hooks/useSignOut';
import { navForRole } from '../../utils/navConfig';
import { ROLE_COLORS, ROLE_NAMES } from '../../utils/constants';
import { cx } from '../../utils/helpers';

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onNavigate, signals, apiOnline }) {
  const { user, homePath } = useAuth();
  const logout = useSignOut();
  const location = useLocation();
  const sections = navForRole(user?.role_id, homePath);
  const roleColor = ROLE_COLORS[user?.role_id];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside
      className={cx('sidebar', collapsed && 'is-collapsed', mobileOpen && 'is-mobile-open')}
      aria-label="Main navigation"
    >
      <div className="sidebar__head">
        <NavLink to={homePath} className="sidebar__brand" onClick={onNavigate} aria-label="ReliefSync home">
          <Logo size={30} withWordmark={!collapsed} />
        </NavLink>
        <button
          type="button"
          className="sidebar__collapse"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </button>
      </div>

      <div className="sidebar__workspace" style={{ '--tone': roleColor }}>
        <span className="sidebar__workspace-dot" aria-hidden="true" />
        {!collapsed && (
          <div className="sidebar__workspace-text">
            <span className="sidebar__workspace-label">Workspace</span>
            <span className="sidebar__workspace-name">{ROLE_NAMES[user?.role_id]}</span>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {sections.map((section) => (
          <div key={section.title} className="sidebar__section">
            {!collapsed ? (
              <div className="sidebar__section-title">{section.title}</div>
            ) : (
              <div className="sidebar__section-rule" aria-hidden="true" />
            )}
            <ul>
              {section.items.map((item) => {
                const active = isActive(item.path);
                const count = item.signal ? Number(signals?.[item.signal]) || 0 : 0;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={cx('nav-link', active && 'is-active')}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="nav-link__bg"
                          transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                        />
                      )}
                      <Icon className="nav-link__icon" aria-hidden="true" />
                      {!collapsed && <span className="nav-link__label">{item.label}</span>}
                      <AnimatePresence>
                        {count > 0 && (
                          <motion.span
                            className={cx('nav-link__badge', `nav-link__badge--${item.signalTone}`, collapsed && 'is-dot')}
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            aria-label={`${count} need attention`}
                          >
                            {!collapsed && (count > 99 ? '99+' : count)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__foot">
        {!collapsed && (
          <div className="sidebar__status">
            <span className={cx('status-dot', apiOnline === false && 'is-down')} aria-hidden="true" />
            <div>
              <div className="sidebar__status-title">{apiOnline === false ? 'API unreachable' : 'All systems operational'}</div>
              <div className="sidebar__status-sub">REST API · MySQL · JWT</div>
            </div>
          </div>
        )}
        <div className="sidebar__user">
          <Avatar name={user?.full_name || user?.email} tone={roleColor} size={36} />
          {!collapsed && (
            <div className="sidebar__user-text">
              <span className="sidebar__user-name truncate">{user?.full_name || 'Signed in'}</span>
              <span className="sidebar__user-email truncate">{user?.email || ROLE_NAMES[user?.role_id]}</span>
            </div>
          )}
          <button type="button" className="sidebar__logout" onClick={logout} aria-label="Sign out" title="Sign out">
            <LogOut />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
