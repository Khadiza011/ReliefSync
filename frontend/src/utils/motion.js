// Shared motion language — one easing curve, three speeds, restrained distances.

export const EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

export const stagger = (step = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren } },
});

export const pageTransition = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.42, ease: EASE } },
  exit: { opacity: 0, y: -6, filter: 'blur(2px)', transition: { duration: 0.18, ease: EASE } },
};

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 32 } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16, ease: EASE } },
};

export const overlayFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

export const drawerPanel = {
  hidden: { x: '104%' },
  show: { x: 0, transition: { type: 'spring', stiffness: 320, damping: 36 } },
  exit: { x: '104%', transition: { duration: 0.24, ease: EASE } },
};
