import { Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { CommandPalette } from '../components/layout/CommandPalette';
import { Spinner } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery, useOnChange } from '../hooks/useUi';
import { dashboardService } from '../services/api';
import apiClient from '../services/apiClient';
import { PERMISSIONS, STORAGE_KEYS } from '../utils/constants';
import { pageTransition } from '../utils/motion';
import { cx } from '../utils/helpers';
import { DATA_CHANGED_EVENT } from '../utils/events';
import './layout.css';

const SIGNAL_REFRESH_MS = 15_000;

export function MainLayout() {
  const location = useLocation();
  // Captured per render so an exiting page keeps rendering its own route during the transition
  const outlet = useOutlet();
  const { user } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)) === true;
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [signals, setSignals] = useState(null);
  const [apiOnline, setApiOnline] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [lastSync, setLastSync] = useState(null);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  // Live counters for manager dashboards + a role-aware notification feed for every user.
  const canSeeSignals = PERMISSIONS.viewSummary.includes(user?.role_id);
  useEffect(() => {
    if (!user?.role_id) return undefined;
    let cancelled = false;

    const load = async () => {
      try {
        const [summaryResult, notificationResult] = await Promise.allSettled([
          canSeeSignals ? dashboardService.getSummary() : Promise.resolve(null),
          apiClient.get('/dashboard/notifications').then((r) => r.data),
        ]);
        if (cancelled) return;
        if (summaryResult.status === 'fulfilled' && summaryResult.value) setSignals(summaryResult.value);
        if (notificationResult.status === 'fulfilled') {
          setNotifications(Array.isArray(notificationResult.value) ? notificationResult.value : []);
        }
        setApiOnline(true);
        setLastSync(new Date());
      } catch (err) {
        if (!cancelled && err?.code === 'NETWORK_ERROR') setApiOnline(false);
      }
    };

    load();
    const t = setInterval(load, SIGNAL_REFRESH_MS);
    const onFocus = () => load();
    window.addEventListener(DATA_CHANGED_EVENT, load);
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(t);
      window.removeEventListener(DATA_CHANGED_EVENT, load);
      window.removeEventListener('focus', onFocus);
    };
  }, [canSeeSignals, user?.role_id]);

  // Close the mobile drawer and scroll to top on navigation
  useOnChange(location.pathname, () => setMobileOpen(false));
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // ⌘K / Ctrl+K opens the command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isCollapsed = isDesktop && collapsed;

  return (
    <div className={cx('shell', isCollapsed && 'is-collapsed')}>
      <AnimatePresence>
        {mobileOpen && !isDesktop && (
          <motion.div
            className="shell__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <Sidebar
        collapsed={isCollapsed}
        onToggleCollapsed={isDesktop ? toggleCollapsed : () => setMobileOpen(false)}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        signals={signals}
        apiOnline={apiOnline}
      />

      <div className="shell__main">
        <Topbar
          onOpenMenu={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          signals={signals}
          notifications={notifications}
          lastSync={lastSync}
        />
        <main className="shell__content" id="main">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="page"
            >
              <Suspense
                fallback={
                  <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
                    <Spinner size={28} />
                  </div>
                }
              >
                {outlet}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export default MainLayout;
