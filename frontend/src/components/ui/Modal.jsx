import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscape, useLockBodyScroll } from '../../hooks/useUi';
import { cx } from '../../utils/helpers';
import { modalPanel, overlayFade } from '../../utils/motion';

/**
 * Accessible modal dialog. Closes on Escape / backdrop click, locks page scroll,
 * moves focus into the panel and restores it on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  tone,
  size = 'md',
  footer,
  children,
  as = 'div',
  onSubmit,
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);
  const lastFocused = useRef(null);

  useLockBodyScroll(open);
  useEscape(onClose, open);

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement;
      const t = setTimeout(() => {
        const panel = panelRef.current;
        const target =
          panel?.querySelector('[data-autofocus]') ||
          panel?.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        (target || panelRef.current)?.focus();
      }, 60);
      return () => clearTimeout(t);
    }
    lastFocused.current?.focus?.();
    return undefined;
  }, [open]);

  const Panel = as === 'form' ? motion.form : motion.div;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
          onMouseDown={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
          }}
        >
          <Panel
            ref={panelRef}
            className={cx('modal', size !== 'md' && `modal--${size}`)}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            tabIndex={-1}
            variants={modalPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            onSubmit={onSubmit}
            noValidate={as === 'form' ? true : undefined}
          >
            <div className="modal__header">
              {Icon && (
                <span className={cx('modal__icon', tone && `modal__icon--${tone}`)} aria-hidden="true">
                  <Icon />
                </span>
              )}
              <div style={{ minWidth: 0 }}>
                <h2 className="modal__title">{title}</h2>
                {description && <p className="modal__description">{description}</p>}
              </div>
              <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
                <X />
              </button>
            </div>
            <div className="modal__body">{children}</div>
            {footer && <div className="modal__footer">{footer}</div>}
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Modal;
