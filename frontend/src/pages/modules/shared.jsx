import { motion } from 'framer-motion';
import { useCountUp } from '../../hooks/useUi';
import { fadeUp, stagger } from '../../utils/motion';
import '../pages.css';

/** Compact KPI strip used at the top of module pages. stats: [{ label, value, icon, tone, suffix }] */
export function MiniStats({ stats, loading }) {
  return (
    <motion.div className="mini-stats" variants={stagger(0.05)} initial="hidden" animate="show">
      {stats.map((s) => (
        <MiniStat key={s.label} {...s} loading={loading} />
      ))}
    </motion.div>
  );
}

function MiniStat({ label, value, icon: Icon, tone, suffix, loading }) {
  const numeric = typeof value === 'number' || (!Number.isNaN(Number(value)) && value !== '' && value !== null);
  const [ref, display] = useCountUp(numeric ? Number(value) : 0);
  return (
    <motion.div className="mini-stat" style={tone ? { '--tone': tone } : undefined} variants={fadeUp}>
      {Icon && (
        <span className="mini-stat__icon" aria-hidden="true">
          <Icon />
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="mini-stat__value tabular" ref={ref}>
          {loading ? '—' : numeric ? display : value}
          {suffix && !loading && <span style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginLeft: 3 }}>{suffix}</span>}
        </div>
        <div className="mini-stat__label">{label}</div>
      </div>
    </motion.div>
  );
}
