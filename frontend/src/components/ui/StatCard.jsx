import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useCountUp, useSpotlight } from '../../hooks/useUi';
import { cx } from '../../utils/helpers';
import { fadeUp } from '../../utils/motion';

const DELTA_ICON = { good: ArrowUpRight, bad: ArrowDownRight, warn: ArrowUpRight, neutral: Minus };

/**
 * KPI tile: label · animated value · optional delta/hint · optional meter.
 * tone: CSS color for the icon chip & meter (defaults to accent).
 */
export function StatCard({ label, value, icon: Icon, tone, hint, delta, deltaTone = 'neutral', meter, suffix, onClick }) {
  const [ref, display] = useCountUp(value);
  const onMove = useSpotlight();
  const DeltaIcon = DELTA_ICON[deltaTone] || Minus;
  const style = tone ? { '--tone': tone } : undefined;
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx('card', 'spotlight', 'stat', onClick && 'card--interactive')}
      style={{ ...style, textAlign: 'left', width: '100%' }}
      variants={fadeUp}
      onMouseMove={onMove}
      onClick={onClick}
    >
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        {Icon && (
          <span className="stat__icon" aria-hidden="true">
            <Icon />
          </span>
        )}
      </div>
      <div className="stat__value" ref={ref}>
        {display}
        {suffix && <span style={{ fontSize: '1rem', color: 'var(--text-3)', marginLeft: 4, fontWeight: 500 }}>{suffix}</span>}
      </div>
      <div className="stat__foot">
        {delta ? (
          <span className={cx('stat__delta', `stat__delta--${deltaTone}`)}>
            <DeltaIcon aria-hidden="true" />
            {delta}
          </span>
        ) : (
          <span>{hint}</span>
        )}
        {delta && hint && <span className="truncate">{hint}</span>}
        {meter !== undefined && (
          <span className="stat__meter" role="meter" aria-valuenow={Math.round(meter)} aria-valuemin={0} aria-valuemax={100}>
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, meter))}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </span>
        )}
      </div>
    </Tag>
  );
}

export function StatGrid({ children, className }) {
  return (
    <motion.div
      className={cx('stat-grid', className)}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}

export default StatCard;
