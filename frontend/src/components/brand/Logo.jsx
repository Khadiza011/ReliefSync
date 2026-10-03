import { useId } from 'react';

/** ReliefSync mark: a relief cross inside a two-arrow sync loop. */
export function Logo({ size = 32, withWordmark = true, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`lg-${id}`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.55" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#lg-${id})`} />
        <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" stroke="rgba(255,255,255,0.25)" />
        <path d="M7.6 13.2A8.8 8.8 0 0 1 22.9 9.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24.4 18.8A8.8 8.8 0 0 1 9.1 22.4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M20.6 7.6l2.5 2.1-2.9 1.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.4 24.4l-2.5-2.1 2.9-1.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14.6" y="11.6" width="2.8" height="8.8" rx="1.2" fill="#fff" />
        <rect x="11.6" y="14.6" width="8.8" height="2.8" rx="1.2" fill="#fff" />
      </svg>
      {withWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: size * 0.6,
            letterSpacing: '-0.03em',
            color: 'var(--text-1)',
          }}
        >
          Relief<span style={{ color: 'var(--cyan-400)' }}>Sync</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
