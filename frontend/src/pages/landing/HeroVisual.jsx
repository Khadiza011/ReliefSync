import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Activity, CircleCheck, Home, PackageCheck, Radio, ShieldCheck, Truck, Users } from 'lucide-react';
import { Ring } from '../../components/charts/Charts';
import { EASE } from '../../utils/motion';

// Real endpoints / database objects from the ReliefSync backend
const EVENTS = [
  { m: 'POST', p: '/api/requests', s: 201, ms: 38, msg: 'Relief request REQ-2041 created' },
  { m: 'PUT', p: '/api/requests/status', s: 200, ms: 22, msg: 'REQ-2041 → APPROVED' },
  { m: 'POST', p: '/api/distributions', s: 201, ms: 41, msg: 'DIST-7718 dispatched to SH-03' },
  { m: 'POST', p: '/api/distribution-items', s: 201, ms: 57, msg: 'Rice −50 KG · ledger OUT · COMMIT' },
  { m: 'TRG', p: 'trg_admission_after_insert', s: 'OK', ms: 3, msg: 'Shelter occupancy +4' },
  { m: 'PUT', p: '/api/donations/:id/receive', s: 200, ms: 49, msg: 'Water +200 bottles · ledger IN' },
  { m: 'GET', p: '/api/inventory/low-stock', s: 200, ms: 12, msg: '2 items at reorder level' },
  { m: 'JWT', p: 'verifyToken → checkRole(1,3)', s: 'OK', ms: 1, msg: 'role = RELIEF_MANAGER' },
  { m: 'POST', p: '/api/admissions', s: 200, ms: 33, msg: 'FAM-118 admitted · 5 members' },
];

const NODES = [
  { id: 'hub', x: 180, y: 116, label: 'DEPOT', tone: 'hub' },
  { id: 'n1', x: 62, y: 54, label: 'SH-01', tone: 'ok' },
  { id: 'n2', x: 300, y: 50, label: 'SH-02', tone: 'warn' },
  { id: 'n3', x: 50, y: 172, label: 'SH-03', tone: 'ok' },
  { id: 'n4', x: 316, y: 176, label: 'SH-04', tone: 'full' },
  { id: 'n5', x: 186, y: 204, label: 'SH-05', tone: 'ok' },
  { id: 'don', x: 182, y: 26, label: 'DONORS', tone: 'donor' },
];

const edgePath = (a, b, bend = 0.18) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return `M${a.x},${a.y} Q${mx - dy * bend},${my + dx * bend} ${b.x},${b.y}`;
};

const nowStamp = (offset = 0) => {
  const d = new Date(Date.now() - offset * 1000);
  return d.toTimeString().slice(0, 8);
};

export function HeroVisual() {
  const reduce = useReducedMotion();
  const [feed, setFeed] = useState(() =>
    EVENTS.slice(0, 4).map((e, i) => ({ ...e, key: i, at: nowStamp((4 - i) * 3) }))
  );
  const [kpis, setKpis] = useState({ families: 1284, shelters: 42, inflight: 18 });

  // Stream a new event every ~1.9s and nudge the live counters
  useEffect(() => {
    if (reduce) return undefined;
    let n = 4;
    const t = setInterval(() => {
      const e = EVENTS[n % EVENTS.length];
      n += 1;
      setFeed((prev) => [...prev.slice(-4), { ...e, key: n, at: nowStamp() }]);
      setKpis((k) => ({
        families: k.families + (e.p.includes('admissions') ? 5 : Math.random() < 0.4 ? 1 : 0),
        shelters: k.shelters,
        inflight: Math.max(9, k.inflight + (e.p === '/api/requests' ? 1 : e.p.includes('distribution-items') ? -1 : 0)),
      }));
    }, 1900);
    return () => clearInterval(t);
  }, [reduce]);

  // Pointer parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-5, 5]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [4, -4]);
  const nearX = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const nearY = useTransform(sy, [-0.5, 0.5], [-14, 14]);
  const farX = useTransform(sx, [-0.5, 0.5], [10, -10]);
  const farY = useTransform(sy, [-0.5, 0.5], [8, -8]);

  const onMove = (e) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const hub = NODES[0];

  return (
    <div className="hero-visual" onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="hero-visual__glow" aria-hidden="true" />

      <motion.div
        className="console"
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.35 }}
        aria-label="Illustration of the ReliefSync command center"
        role="img"
      >
        <div className="console__chrome">
          <span className="console__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="console__url">
            <ShieldCheck aria-hidden="true" />
            reliefsync.app/command-center
          </span>
          <span className="console__live">
            <span className="status-dot" aria-hidden="true" /> LIVE
          </span>
        </div>

        <div className="console__kpis">
          <Kpi icon={Users} label="Families sheltered" value={kpis.families} />
          <Kpi icon={Home} label="Open shelters" value={kpis.shelters} />
          <Kpi icon={Truck} label="Requests in flight" value={kpis.inflight} />
        </div>

        <div className="console__body">
          <div className="console__map">
            <div className="console__panel-title">
              <Radio aria-hidden="true" /> Supply network
            </div>
            <svg viewBox="0 0 360 230" className="netmap" aria-hidden="true">
              <defs>
                <radialGradient id="hubGlow">
                  <stop offset="0" stopColor="#22d3ee" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
                <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="rgba(148,176,220,0.16)" />
                </pattern>
              </defs>
              <rect width="360" height="230" fill="url(#dots)" />
              <ellipse cx="180" cy="116" rx="150" ry="92" fill="none" stroke="rgba(148,176,220,0.06)" />
              <ellipse cx="180" cy="116" rx="100" ry="60" fill="none" stroke="rgba(148,176,220,0.06)" />

              {NODES.slice(1).map((node, i) => {
                const inbound = node.id === 'don';
                const d = inbound ? edgePath(node, hub, 0.1) : edgePath(hub, node, i % 2 ? 0.16 : -0.16);
                return (
                  <g key={node.id}>
                    <path id={`edge-${node.id}`} d={d} className={inbound ? 'netmap__edge netmap__edge--in' : 'netmap__edge'} />
                    {!reduce && (
                      <circle r="2.6" className={inbound ? 'netmap__pulse netmap__pulse--in' : 'netmap__pulse'}>
                        <animateMotion dur={`${2.4 + i * 0.45}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                          <mpath href={`#edge-${node.id}`} />
                        </animateMotion>
                      </circle>
                    )}
                  </g>
                );
              })}

              <circle cx={hub.x} cy={hub.y} r="34" fill="url(#hubGlow)" />
              {NODES.map((node) => (
                <g key={node.id} className={`netmap__node netmap__node--${node.tone}`}>
                  {node.tone !== 'hub' && <circle cx={node.x} cy={node.y} r="9" className="netmap__halo" />}
                  <circle cx={node.x} cy={node.y} r={node.tone === 'hub' ? 7 : 4} className="netmap__core" />
                  <text x={node.x} y={node.y + (node.y > 150 ? 20 : -13)} textAnchor="middle" className="netmap__label">
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
            <div className="netmap__legend">
              <span><i className="lg-ok" /> Available</span>
              <span><i className="lg-warn" /> Nearly full</span>
              <span><i className="lg-full" /> Full</span>
            </div>
          </div>

          <div className="console__stream">
            <div className="console__panel-title">
              <Activity aria-hidden="true" /> Event stream
            </div>
            <ul className="stream">
              <AnimatePresence initial={false}>
                {feed.map((e) => (
                  <motion.li
                    key={e.key}
                    layout
                    className="stream__line"
                    initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <div className="stream__row">
                      <span className="stream__time">{e.at}</span>
                      <span className={`stream__method stream__method--${e.m.toLowerCase()}`}>{e.m}</span>
                      <span className="stream__status">{e.s}</span>
                    </div>
                    <div className="stream__path">{e.p}</div>
                    <div className="stream__msg">
                      ↳ {e.msg} <span className="stream__ms">{e.ms}ms</span>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="stream__cursor" aria-hidden="true">
              <span>$</span> tail -f audit_logs<span className="caret" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="float-card float-card--approve"
        style={{ x: nearX, y: nearY }}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 1.1 }}
        aria-hidden="true"
      >
        <div className="float-card__bob">
          <span className="float-card__icon float-card__icon--success">
            <CircleCheck />
          </span>
          <div>
            <div className="float-card__title">Request approved</div>
            <div className="float-card__sub">REQ-2041 · Central Shelter</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="float-card float-card--capacity"
        style={{ x: farX, y: farY }}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 1.3 }}
        aria-hidden="true"
      >
        <div className="float-card__bob float-card__bob--slow">
          <Ring value={82} size={58} stroke={6} />
          <div>
            <div className="float-card__title">Shelter capacity</div>
            <div className="float-card__sub">Riverside Camp · 410/500</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="float-card float-card--ledger"
        style={{ x: nearX, y: farY }}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 1.5 }}
        aria-hidden="true"
      >
        <div className="float-card__bob">
          <span className="float-card__icon">
            <PackageCheck />
          </span>
          <div>
            <div className="float-card__title">Ledger balanced</div>
            <div className="float-card__sub mono">COMMIT · 4 rows</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="kpi">
      <span className="kpi__icon" aria-hidden="true">
        <Icon />
      </span>
      <div>
        <div className="kpi__label">{label}</div>
        <motion.div key={value} className="kpi__value" initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          {value.toLocaleString()}
        </motion.div>
      </div>
    </div>
  );
}

export default HeroVisual;
