import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscape, useLockBodyScroll } from '../../hooks/useUi';
import { drawerPanel, overlayFade } from '../../utils/motion';

/** Right-side detail panel used for record details across modules. */
export function Drawer({ open, onClose, eyebrow, title, meta, footer, children }) {
  useLockBodyScroll(open);
  useEscape(onClose, open);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="drawer-overlay"
            variants={overlayFade}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
          />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Details'}
            variants={drawerPanel}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="drawer__header">
              <div style={{ minWidth: 0, flex: 1 }}>
                {eyebrow && <div className="drawer__eyebrow">{eyebrow}</div>}
                <h2 className="drawer__title">{title}</h2>
                {meta && <div className="row" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>{meta}</div>}
              </div>
              <button type="button" className="modal__close" onClick={onClose} aria-label="Close details">
                <X />
              </button>
            </div>
            <div className="drawer__body">{children}</div>
            {footer && <div className="drawer__footer">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Two-column key/value grid for drawers. items: [{ label, value, wide? }] */
export function KeyValue({ items }) {
  return (
    <div className="kv">
      {items.map((item) => (
        <div key={item.label} className={item.wide ? 'kv__item kv__item--wide' : 'kv__item'}>
          <div className="kv__label">{item.label}</div>
          <div className="kv__value">{item.value ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

export default Drawer;
