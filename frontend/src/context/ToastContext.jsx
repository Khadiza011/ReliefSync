import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

/**
 * Toast notifications. API:
 *   const toast = useToast();
 *   toast.success('Saved', 'Optional detail');
 *   toast.error(err.message);
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type, title, message, duration = 4500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, message, duration }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => removeToast(id), duration)
        );
      }
      return id;
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      removeToast,
      addToast,
      success: (title, message, duration) => addToast('success', title, message, duration),
      error: (title, message, duration) => addToast('error', title, message, duration ?? 6000),
      warning: (title, message, duration) => addToast('warning', title, message, duration),
      info: (title, message, duration) => addToast('info', title, message, duration),
    }),
    [toasts, removeToast, addToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
