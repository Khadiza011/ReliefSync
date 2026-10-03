import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cx, formatNumber, percent } from '../../utils/helpers';
import { EASE } from '../../utils/motion';
import './charts.css';

/**
 * Lightweight SVG/HTML charts that follow one visual system:
 * thin marks, 4px rounded data-ends, recessive grid, hover tooltips,
 * text in text tokens (never in series color), validated palette.
 */

/* ---------- Horizontal bar list: magnitude by category (single hue) ---------- */
export function BarList({ data, valueFormat = formatNumber, color = 'var(--series-1)', max, emptyLabel = 'No data yet' }) {
  const [hover, setHover] = useState(null);
  const top = max ?? Math.max(1, ...data.map((d) => Number(d.value) || 0));

  if (!data.length) return <p className="chart-empty">{emptyLabel}</p>;

  return (
    <ul className="barlist" role="list">
      {data.map((d, i) => {
        const pct = percent(d.value, top);
        return (
          <li
            key={d.label}
            className={cx('barlist__row', hover === i && 'is-hover')}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="barlist__meta">
              <span className="barlist__label">
                {d.icon && <d.icon aria-hidden="true" />}
                {d.label}
              </span>
              <span className="barlist__value tabular">{valueFormat(d.value)}</span>
            </div>
            <div className="barlist__track" aria-hidden="true">
              <motion.span
                className="barlist__fill"
                style={{ background: d.color || color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, d.value > 0 ? 2 : 0)}%` }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.05 }}
              />
            </div>
            {d.sub && <span className="barlist__sub">{d.sub}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Column chart: change over time (single series) ---------- */
export function ColumnChart({ data, height = 180, color = 'var(--series-1)', valueLabel = 'events', ariaLabel }) {
  const [hover, setHover] = useState(null);
  const width = 640;
  const padL = 30;
  const padB = 24;
  const padT = 12;
  const innerW = width - padL - 8;
  const innerH = height - padB - padT;
  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(maxVal);
  const ticks = [0, niceMax / 2, niceMax];
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(24, slot * 0.58);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="colchart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel || `Column chart, ${total} ${valueLabel}`}>
        {ticks.map((t) => {
          const y = padT + innerH - (t / niceMax) * innerH;
          return (
            <g key={t}>
              <line x1={padL} x2={width - 8} y1={y} y2={y} className={t === 0 ? 'chart-baseline' : 'chart-grid'} />
              <text x={padL - 8} y={y + 3.5} className="chart-tick" textAnchor="end">
                {formatNumber(t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / niceMax) * innerH;
          const x = padL + slot * i + (slot - barW) / 2;
          const y = padT + innerH - h;
          const showLabel = i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2);
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={cx('colchart__col', hover !== null && hover !== i && 'is-dim')}
            >
              <rect x={padL + slot * i} y={padT} width={slot} height={innerH} fill="transparent" />
              {d.value > 0 && (
                <motion.path
                  d={roundedTopBar(x, y, barW, h, 4)}
                  fill={color}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  style={{ transformOrigin: `${x + barW / 2}px ${padT + innerH}px`, transformBox: 'view-box' }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.05 + i * 0.025 }}
                />
              )}
              {showLabel && (
                <text x={x + barW / 2} y={height - 6} className="chart-tick" textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((padL + slot * hover + slot / 2) / width) * 100}%`,
            top: `${((padT + innerH - (data[hover].value / niceMax) * innerH) / height) * 100}%`,
          }}
          role="status"
        >
          <span className="chart-tooltip__label">{data[hover].label}</span>
          <span className="chart-tooltip__value">
            <span className="chart-swatch" style={{ background: color }} />
            {formatNumber(data[hover].value)} {valueLabel}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- 100% stacked bar: part-to-whole for ordered categories ---------- */
export function StackedBar({ segments, height = 12, valueLabel = '' }) {
  const [hover, setHover] = useState(null);
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div className="stacked">
      <div className="stacked__bar" style={{ height }} role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        {total === 0 ? (
          <span className="stacked__empty" />
        ) : (
          visible.map((s, i) => (
            <motion.span
              key={s.label}
              className={cx('stacked__seg', hover !== null && hover !== s.label && 'is-dim')}
              style={{ background: s.color }}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: s.value }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.06 }}
              onMouseEnter={() => setHover(s.label)}
              onMouseLeave={() => setHover(null)}
              title={`${s.label}: ${formatNumber(s.value)} (${Math.round(percent(s.value, total))}%)`}
            />
          ))
        )}
      </div>
      <ul className="legend" role="list">
        {segments.map((s) => (
          <li
            key={s.label}
            className={cx('legend__item', hover === s.label && 'is-active')}
            onMouseEnter={() => setHover(s.label)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="chart-swatch" style={{ background: s.color }} aria-hidden="true" />
            <span className="legend__label">{s.label}</span>
            <span className="legend__value tabular">
              {formatNumber(s.value)}
              {valueLabel && ` ${valueLabel}`}
              <span className="legend__pct">{total ? `${Math.round(percent(s.value, total))}%` : '0%'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Meter: a single ratio with severity fill ---------- */
export function Meter({ value, max = 100, label, detail, thresholds = [70, 90], size = 'md', tone: toneOverride }) {
  const pct = percent(value, max);
  const tone = toneOverride || (pct >= thresholds[1] ? 'danger' : pct >= thresholds[0] ? 'warning' : 'ok');
  return (
    <div className={cx('meter', `meter--${tone}`, size === 'sm' && 'meter--sm')}>
      {(label || detail) && (
        <div className="meter__meta">
          <span className="meter__label">{label}</span>
          <span className="meter__detail tabular">{detail ?? `${Math.round(pct)}%`}</span>
        </div>
      )}
      <div className="meter__track" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <motion.span
          className="meter__fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: EASE, delay: 0.15 }}
        />
      </div>
    </div>
  );
}

/* ---------- Ring gauge: single headline ratio ---------- */
export function Ring({ value, max = 100, size = 120, stroke = 10, label, sublabel, thresholds = [70, 90] }) {
  const pct = percent(value, max);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = pct >= thresholds[1] ? 'var(--danger)' : pct >= thresholds[0] ? 'var(--warning)' : 'var(--accent)';
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label || ''} ${Math.round(pct)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.1 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring__center">
        <span className="ring__value tabular">{Math.round(pct)}%</span>
        {sublabel && <span className="ring__sub">{sublabel}</span>}
      </div>
    </div>
  );
}

/* ---------- Sparkline: tiny trend (de-emphasised, current point accented) ---------- */
export function Sparkline({ values, width = 120, height = 36, color = 'var(--accent)' }) {
  const path = useMemo(() => {
    if (!values.length) return '';
    const max = Math.max(1, ...values);
    const step = width / Math.max(1, values.length - 1);
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - 4 - (v / max) * (height - 8)).toFixed(1)}`)
      .join(' ');
  }, [values, width, height]);

  if (!values.length) return null;
  const max = Math.max(1, ...values);
  const lastX = width;
  const lastY = height - 4 - (values[values.length - 1] / max) * (height - 8);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={color} opacity="0.1" />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <circle cx={lastX} cy={lastY} r="4" fill={color} stroke="var(--surface-1)" strokeWidth="2" />
    </svg>
  );
}

function niceCeil(value) {
  if (value <= 4) return 4;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function roundedTopBar(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}
