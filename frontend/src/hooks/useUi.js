import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/** Debounces a fast-changing value (search inputs). */
export function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Animates a number from 0 to `value` once the element scrolls into view. */
export function useCountUp(value, { duration = 1.1, decimals = 0 } = {}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const target = Number(value) || 0;

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, target, duration, reduce]);

  const shown = reduce ? target : display;
  const formatted = decimals > 0 ? shown.toFixed(decimals) : Math.round(shown).toLocaleString();
  return [ref, formatted];
}

/** Runs `callback` during render the moment `open` flips to true (resets dialog state without an effect). */
export function useOnOpen(open, callback) {
  // Starts closed so a dialog that mounts already open still initialises
  const [prev, setPrev] = useState(false);
  if (open !== prev) {
    setPrev(open);
    if (open) callback();
  }
}

/** Runs `callback` during render whenever `value` changes (React's "adjust state on prop change" pattern). */
export function useOnChange(value, callback) {
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    callback(value, prev);
  }
}

/** Keeps a ref pointing at the latest value without writing to it during render. */
function useLatest(value) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** Sets --mx / --my CSS variables for the cursor-tracked spotlight effect. */
export function useSpotlight() {
  return useCallback((event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, []);
}

/** Locks page scroll while an overlay is open. */
export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

/** Calls handler on Escape while `active`. */
export function useEscape(handler, active = true) {
  const handlerRef = useLatest(handler);
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') handlerRef.current?.(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, handlerRef]);
}

/** Closes something when a click lands outside `ref`. */
export function useClickOutside(ref, handler, active = true) {
  const handlerRef = useLatest(handler);
  useEffect(() => {
    if (!active) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current?.(e);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [ref, active, handlerRef]);
}

/** Tracks a media query. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
