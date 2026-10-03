import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { EASE } from '../../utils/motion';

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              layout
              className={`toast toast--${toast.type}`}
              role={toast.type === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 32 } }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2, ease: EASE } }}
            >
              <span className="toast__icon" aria-hidden="true">
                <Icon />
              </span>
              <div className="toast__content">
                <div className="toast__title">{toast.title}</div>
                {toast.message && <div className="toast__message">{toast.message}</div>}
              </div>
              <button type="button" className="toast__close" onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
                <X />
              </button>
              {toast.duration > 0 && (
                <motion.span
                  className="toast__progress"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                  aria-hidden="true"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default Toaster;
