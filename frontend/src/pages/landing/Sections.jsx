import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Command,
  Database,
  HandHeart,
  House,
  KeyRound,
  Layers,
  MonitorSmartphone,
  PackageCheck,
  ScrollText,
  Server,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCountUp, useSpotlight } from '../../hooks/useUi';
import { EASE } from '../../utils/motion';

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-80px' } };

export function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  return (
    <motion.div className={`section-heading section-heading--${align}`} variants={reveal} {...inView}>
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </motion.div>
  );
}

/* ---------------- Metrics strip ---------------- */
const METRICS = [
  { value: 5, label: 'Role-based workspaces', sub: 'Admin → Donor' },
  { value: 17, label: 'REST API modules', sub: 'Express · JWT · RBAC' },
  { value: 34, label: 'Relational tables', sub: 'Normalised MySQL schema' },
  { value: 23, label: 'SQL migrations', sub: 'Triggers · procedures · views' },
];

export function MetricsStrip() {
  return (
    <motion.section
      className="metrics"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      aria-label="Platform at a glance"
    >
      {METRICS.map((m) => (
        <Metric key={m.label} {...m} />
      ))}
    </motion.section>
  );
}

function Metric({ value, label, sub }) {
  const [ref, display] = useCountUp(value, { duration: 1.4 });
  return (
    <motion.div className="metric" variants={reveal}>
      <div className="metric__value" ref={ref}>
        {display}
      </div>
      <div className="metric__label">{label}</div>
      <div className="metric__sub">{sub}</div>
    </motion.div>
  );
}

/* ---------------- Feature bento ---------------- */
function BentoCard({ className = '', icon: Icon, title, text, children }) {
  const onMove = useSpotlight();
  return (
    <motion.article className={`bento-card spotlight ${className}`} variants={reveal} onMouseMove={onMove}>
      <div className="bento-card__visual">{children}</div>
      <div className="bento-card__text">
        <span className="bento-card__icon" aria-hidden="true">
          <Icon />
        </span>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </motion.article>
  );
}

export function FeatureBento() {
  return (
    <section className="landing-section" id="platform">
      <SectionHeading
        eyebrow="Platform"
        title={
          <>
            Everything a relief operation
            <br />
            <span className="text-gradient">runs on, in one place.</span>
          </>
        }
        description="From the first family registration to the last bag of rice delivered — every module shares one transactional source of truth."
      />

      <motion.div
        className="bento"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        <BentoCard
          className="bento-card--wide"
          icon={House}
          title="Shelter capacity, live"
          text="Occupancy updates the moment a family is admitted — a database trigger keeps every count honest."
        >
          <div className="vis-capacity">
            {[
              { name: 'Central Shelter', pct: 96, used: '480 / 500' },
              { name: 'School Shelter', pct: 74, used: '296 / 400' },
              { name: 'Riverside Camp', pct: 41, used: '123 / 300' },
            ].map((s, i) => (
              <div key={s.name} className="vis-capacity__row">
                <div className="vis-capacity__meta">
                  <span>{s.name}</span>
                  <span className="tabular">{s.used}</span>
                </div>
                <div className="vis-capacity__track">
                  <motion.span
                    className={s.pct >= 90 ? 'is-danger' : s.pct >= 70 ? 'is-warn' : ''}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${s.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: EASE, delay: 0.2 + i * 0.12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard icon={ClipboardList} title="Request pipeline" text="Shelters raise needs, relief managers approve, distributions close the loop.">
          <div className="vis-pipeline">
            {[
              { label: 'Requested', tone: 'warning' },
              { label: 'Approved', tone: 'cyan' },
              { label: 'Delivered', tone: 'success' },
            ].map((s, i) => (
              <motion.span
                key={s.label}
                className={`badge badge--${s.tone}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.25, duration: 0.5, ease: EASE }}
              >
                <span className="badge__dot" />
                {s.label}
              </motion.span>
            ))}
          </div>
        </BentoCard>

        <BentoCard icon={PackageCheck} title="Inventory ledger" text="Every stock movement writes an IN/OUT transaction with the balance after — auditable to the unit.">
          <ul className="vis-ledger">
            {[
              { dir: 'in', item: 'Drinking Water', qty: '+200' },
              { dir: 'out', item: 'Rice (KG)', qty: '−50' },
              { dir: 'in', item: 'Oral Saline', qty: '+120' },
            ].map((l) => (
              <li key={l.item}>
                <span className={`vis-ledger__dir vis-ledger__dir--${l.dir}`}>{l.dir === 'in' ? <ArrowDown /> : <ArrowUp />}</span>
                <span className="vis-ledger__item">{l.item}</span>
                <span className="vis-ledger__qty mono">{l.qty}</span>
              </li>
            ))}
          </ul>
        </BentoCard>

        <BentoCard icon={Users} title="Family registry" text="Priority-ranked households, from needs-shelter to sheltered, searchable in milliseconds.">
          <div className="vis-families">
            {['FAM-001', 'FAM-002', 'FAM-003'].map((code, i) => (
              <div key={code} className="vis-families__row">
                <span className="avatar" style={{ '--avatar-size': '26px', '--tone': ['#22d3ee', '#818cf8', '#34d399'][i] }}>
                  {['KU', 'HA', 'RB'][i]}
                </span>
                <span className="mono">{code}</span>
                <span className={`badge badge--sm badge--${['danger', 'serious', 'info'][i]}`}>{['Critical', 'High', 'Medium'][i]}</span>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard icon={HandHeart} title="Donations that land" text="Pledges become stock the moment they're received — straight into the right shelter's inventory.">
          <div className="vis-donation">
            <span className="vis-donation__node">Donor</span>
            <span className="vis-donation__line">
              <motion.i
                animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </span>
            <span className="vis-donation__node vis-donation__node--accent">Shelter</span>
          </div>
        </BentoCard>

        <BentoCard className="bento-card--wide" icon={ScrollText} title="Audit everything" text="Who did what, to which record, and when — an immutable trail for accountability and review.">
          <div className="vis-audit mono">
            <div><span className="c-dim">09:41:07</span> <span className="c-cyan">INSERT</span> relief_requests <span className="c-dim">#2041 by relief@</span></div>
            <div><span className="c-dim">09:41:52</span> <span className="c-green">UPDATE</span> relief_requests.status <span className="c-dim">→ APPROVED</span></div>
            <div><span className="c-dim">09:43:18</span> <span className="c-violet">INSERT</span> distribution_items <span className="c-dim">qty 50</span></div>
          </div>
        </BentoCard>

        <BentoCard icon={Command} title="Built for speed" text="Keyboard-first: press Ctrl K anywhere to jump to any module or action.">
          <div className="vis-kbd">
            <kbd className="kbd kbd--lg">Ctrl</kbd>
            <span>+</span>
            <kbd className="kbd kbd--lg">K</kbd>
          </div>
        </BentoCard>
      </motion.div>
    </section>
  );
}

/* ---------------- Workflow ---------------- */
const STEPS = [
  { icon: UserPlus, title: 'Register', text: 'Families & shelters enter the system with priority and location.', api: 'POST /api/families' },
  { icon: ClipboardList, title: 'Request', text: 'Shelter managers raise itemised relief requests.', api: 'POST /api/requests' },
  { icon: ClipboardCheck, title: 'Approve', text: 'Relief managers review, approve or cancel in one click.', api: 'PUT /api/requests/status' },
  { icon: Truck, title: 'Distribute', text: 'Stock leaves inventory inside a single ACID transaction.', api: 'POST /api/distribution-items' },
  { icon: ScrollText, title: 'Audit', text: 'Every action is logged for review and accountability.', api: 'GET /api/audit-logs' },
];

export function WorkflowSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const width = useTransform(progress, [0, 1], ['0%', '100%']);

  return (
    <section className="landing-section" id="workflow" ref={ref}>
      <SectionHeading
        eyebrow="Workflow"
        title={
          <>
            From distress call to delivery —
            <br />
            <span className="text-gradient">five steps, zero spreadsheets.</span>
          </>
        }
        description="Each step is a real API call guarded by JWT and role checks. Nothing moves without a record."
      />

      <div className="workflow">
        <div className="workflow__rail" aria-hidden="true">
          <motion.div className="workflow__rail-fill" style={{ width }} />
        </div>
        <motion.ol
          className="workflow__steps"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          {STEPS.map((s, i) => (
            <motion.li key={s.title} className="workflow__step" variants={reveal}>
              <span className="workflow__node">
                <s.icon aria-hidden="true" />
                <span className="workflow__num">{String(i + 1).padStart(2, '0')}</span>
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <code className="workflow__api">{s.api}</code>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

/* ---------------- Architecture ---------------- */
const LAYERS = [
  {
    icon: MonitorSmartphone,
    name: 'Client',
    tech: ['React 19', 'Vite', 'Framer Motion', 'Axios'],
    text: 'Role-aware SPA with protected routes and optimistic, animated UI.',
  },
  {
    icon: Server,
    name: 'API',
    tech: ['Node.js', 'Express 5', 'JWT', 'bcrypt'],
    text: 'REST endpoints behind verifyToken + checkRole middleware.',
  },
  {
    icon: Database,
    name: 'Data',
    tech: ['MySQL / MariaDB', 'Triggers', 'Procedures', 'Views'],
    text: 'Normalised schema with transactions for every stock movement.',
  },
];

export function ArchitectureSection() {
  return (
    <section className="landing-section" id="architecture">
      <SectionHeading
        eyebrow="Under the hood"
        title={
          <>
            Engineered like infrastructure,
            <br />
            <span className="text-gradient">because it is.</span>
          </>
        }
        description="A clean three-tier architecture: stateless API, token-based auth, and a relational core that enforces the rules."
      />

      <div className="arch">
        <motion.div
          className="arch__layers"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
        >
          {LAYERS.map((layer, i) => (
            <motion.div key={layer.name} className="arch__layer-wrap" variants={reveal}>
              <div className="arch__layer">
                <div className="arch__layer-head">
                  <span className="arch__layer-icon" aria-hidden="true">
                    <layer.icon />
                  </span>
                  <div>
                    <div className="arch__layer-tier">Tier {i + 1}</div>
                    <h3>{layer.name}</h3>
                  </div>
                </div>
                <p>{layer.text}</p>
                <div className="arch__tech">
                  {layer.tech.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              {i < LAYERS.length - 1 && (
                <div className="arch__link" aria-hidden="true">
                  <span className="arch__packet" style={{ animationDelay: `${i * 0.6}s` }} />
                  <span className="arch__packet arch__packet--back" style={{ animationDelay: `${i * 0.6 + 1.1}s` }} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="arch__code" variants={reveal} {...inView}>
          <div className="arch__code-head">
            <span className="console__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="mono">approve-request.http</span>
            <span className="badge badge--success badge--sm">200 OK</span>
          </div>
          <pre className="code">
            <code>
              <span className="c-violet">PUT</span> <span className="c-text">/api/requests/status</span>
              {'\n'}
              <span className="c-dim">Authorization:</span> <span className="c-green">Bearer eyJhbGciOiJIUzI1NiIs…</span>
              {'\n'}
              <span className="c-dim">Content-Type:</span> application/json
              {'\n\n'}
              {'{'}
              {'\n  '}
              <span className="c-cyan">"request_id"</span>: <span className="c-amber">2041</span>,
              {'\n  '}
              <span className="c-cyan">"status"</span>: <span className="c-green">"APPROVED"</span>
              {'\n}'}
              {'\n\n'}
              <span className="c-dim">{'// → verifyToken ✓  checkRole(ADMIN, RELIEF_MANAGER) ✓'}</span>
              {'\n'}
              <span className="c-dim">{'// → UPDATE relief_requests SET status, approved_by, approved_at'}</span>
            </code>
          </pre>
          <div className="arch__code-foot">
            <span>
              <KeyRound aria-hidden="true" /> JWT · 1 day expiry
            </span>
            <span>
              <ShieldCheck aria-hidden="true" /> Role-checked
            </span>
            <span>
              <Layers aria-hidden="true" /> Transactional
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Roles ---------------- */
const ROLE_CARDS = [
  { name: 'Admin', color: 'var(--role-admin)', icon: ShieldCheck, items: ['Full command center', 'Audit trail & oversight', 'Every module, every action'] },
  { name: 'Shelter Manager', color: 'var(--role-shelter)', icon: House, items: ['Register & admit families', 'Raise relief requests', 'Track shelter stock'] },
  { name: 'Relief Manager', color: 'var(--role-relief)', icon: ClipboardCheck, items: ['Approve request queue', 'Dispatch distributions', 'Receive donations'] },
  { name: 'Volunteer', color: 'var(--role-volunteer)', icon: Users, items: ['See assigned shelters', 'View on-site inventory', 'Track your tasks'] },
  { name: 'Donor', color: 'var(--role-donor)', icon: HandHeart, items: ['Pledge supplies', 'Follow donation status', 'See your impact'] },
];

export function RolesSection() {
  return (
    <section className="landing-section" id="roles">
      <SectionHeading
        eyebrow="Built for every responder"
        title={
          <>
            Five roles. <span className="text-gradient">One shared picture.</span>
          </>
        }
        description="Each person lands in a workspace designed for their job — and only sees what they're permitted to."
      />
      <motion.div
        className="roles"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {ROLE_CARDS.map((r) => (
          <RoleCard key={r.name} role={r} />
        ))}
      </motion.div>
    </section>
  );
}

function RoleCard({ role }) {
  const onMove = useSpotlight();
  const Icon = role.icon;
  return (
    <motion.article className="role-card spotlight" style={{ '--tone': role.color }} variants={reveal} onMouseMove={onMove}>
      <span className="role-card__icon" aria-hidden="true">
        <Icon />
      </span>
      <h3>{role.name}</h3>
      <ul>
        {role.items.map((it) => (
          <li key={it}>
            <CircleCheck aria-hidden="true" />
            {it}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
