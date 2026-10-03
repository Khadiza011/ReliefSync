import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ClipboardPlus, CornerDownLeft, HandHeart, LogOut, PackagePlus, Search, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSignOut } from '../../hooks/useSignOut';
import { useLockBodyScroll, useOnOpen } from '../../hooks/useUi';
import { navForRole } from '../../utils/navConfig';
import { PERMISSIONS, ROLES } from '../../utils/constants';
import { cx } from '../../utils/helpers';
import { modalPanel, overlayFade } from '../../utils/motion';

/** ⌘K / Ctrl+K palette: jump to any page or run a quick action. */
export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { user, homePath } = useAuth();
  const logout = useSignOut();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useLockBodyScroll(open);

  const role = user?.role_id;

  const commands = useMemo(() => {
    const nav = navForRole(role, homePath).flatMap((section) =>
      section.items.map((item) => ({
        id: `nav-${item.path}`,
        group: 'Go to',
        label: item.label,
        hint: section.title,
        icon: item.icon,
        keywords: item.keywords || '',
        run: () => navigate(item.path),
      }))
    );

    const actions = [];
    if (PERMISSIONS.createRequest.includes(role)) {
      actions.push({
        id: 'act-request',
        group: 'Actions',
        label: 'Create relief request',
        icon: ClipboardPlus,
        keywords: 'new request need supplies',
        run: () => navigate(role === ROLES.SHELTER_MANAGER ? '/shelter-manager/requests/create' : '/requests?new=1'),
      });
    }
    if (PERMISSIONS.createFamily.includes(role)) {
      actions.push({
        id: 'act-family',
        group: 'Actions',
        label: 'Register a family',
        icon: UserPlus,
        keywords: 'new family household',
        run: () => navigate(role === ROLES.SHELTER_MANAGER ? '/shelter-manager/families/register' : '/families?new=1'),
      });
    }
    if (PERMISSIONS.manageInventory.includes(role)) {
      actions.push({ id: 'act-stock', group: 'Actions', label: 'Add inventory stock', icon: PackagePlus, keywords: 'restock supplies', run: () => navigate('/inventory?new=1') });
    }
    if (PERMISSIONS.createDonation.includes(role)) {
      actions.push({ id: 'act-donate', group: 'Actions', label: 'Make a donation', icon: HandHeart, keywords: 'donate give', run: () => navigate(role === ROLES.DONOR ? '/donor?new=1' : '/donations?new=1') });
    }
    actions.push({ id: 'act-logout', group: 'Account', label: 'Sign out', icon: LogOut, keywords: 'logout exit', run: logout });

    return [...nav, ...actions];
  }, [role, homePath, navigate, logout]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords} ${c.group}`.toLowerCase().includes(q));
  }, [commands, query]);

  useOnOpen(open, () => {
    setQuery('');
    setActive(0);
  });

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const execute = (cmd) => {
    onClose();
    setTimeout(() => cmd.run(), 60);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      execute(results[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay palette-overlay"
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            variants={modalPanel}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="palette__search">
              <Search aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search pages and actions…"
                aria-label="Search pages and actions"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
              />
              <kbd className="kbd">Esc</kbd>
            </div>
            <ul className="palette__list" id="palette-list" role="listbox" ref={listRef}>
              {results.length === 0 && <li className="palette__empty">No results for “{query}”</li>}
              {results.map((cmd, i) => {
                const header = cmd.group !== lastGroup ? cmd.group : null;
                lastGroup = cmd.group;
                const Icon = cmd.icon;
                return (
                  <li key={cmd.id} role="presentation">
                    {header && <div className="palette__group">{header}</div>}
                    <button
                      type="button"
                      id={`palette-${cmd.id}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      className={cx('palette__item', i === active && 'is-active')}
                      onMouseMove={() => setActive(i)}
                      onClick={() => execute(cmd)}
                    >
                      <span className="palette__item-icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="palette__item-label">{cmd.label}</span>
                      {cmd.hint && <span className="palette__item-hint">{cmd.hint}</span>}
                      {i === active ? (
                        <CornerDownLeft className="palette__enter" aria-hidden="true" />
                      ) : (
                        <ArrowRight className="palette__enter palette__enter--idle" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="palette__foot">
              <span>
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> navigate
              </span>
              <span>
                <kbd className="kbd">↵</kbd> open
              </span>
              <span className="palette__brand">ReliefSync command</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default CommandPalette;
