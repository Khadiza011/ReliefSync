import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, HandHeart, House, KeyRound, Server, ShieldCheck, Truck, Users } from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { ParticleField } from '../landing/ParticleField';
import { EASE } from '../../utils/motion';
import './auth.css';

const ORBIT = [
  { icon: House, label: 'Shelters' },
  { icon: Users, label: 'Families' },
  { icon: Truck, label: 'Distributions' },
  { icon: HandHeart, label: 'Donations' },
];

const SERVICES = [
  { icon: Server, name: 'REST API', detail: 'Express · :5000' },
  { icon: Database, name: 'Database', detail: 'MySQL · reliefsync' },
  { icon: KeyRound, name: 'Auth', detail: 'JWT · bcrypt' },
];

/** Split-screen frame shared by sign-in and sign-up. */
export function AuthLayout({ title, subtitle, children, footer, asideTitle, asideText }) {
  return (
    <div className="auth">
      <aside className="auth__aside" aria-hidden="true">
        <div className="aurora aurora--1" />
        <div className="aurora aurora--2" />
        <ParticleField className="auth__particles" density={0.00008} />

        <div className="auth__aside-inner">
          <Logo size={34} />

          <div className="orbit">
            <div className="orbit__ring orbit__ring--1" />
            <div className="orbit__ring orbit__ring--2" />
            <div className="orbit__ring orbit__ring--3" />
            <div className="orbit__core">
              <Logo size={56} withWordmark={false} />
            </div>
            <div className="orbit__track">
              {ORBIT.map((o, i) => (
                <span key={o.label} className="orbit__sat" style={{ '--i': i }}>
                  <span className="orbit__sat-inner">
                    <o.icon />
                  </span>
                </span>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}>
            <h2 className="auth__aside-title">{asideTitle}</h2>
            <p className="auth__aside-text">{asideText}</p>
          </motion.div>

          <motion.ul
            className="auth__services"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
          >
            {SERVICES.map((s) => (
              <motion.li
                key={s.name}
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } } }}
              >
                <s.icon />
                <span className="auth__service-name">{s.name}</span>
                <span className="auth__service-detail mono">{s.detail}</span>
                <span className="status-dot" />
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__top">
          <Link to="/" className="auth__back">
            <ArrowLeft aria-hidden="true" /> Back to home
          </Link>
          <span className="auth__secure">
            <ShieldCheck aria-hidden="true" /> Encrypted session
          </span>
        </div>

        <motion.div
          className="auth__panel"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="auth__mobile-logo">
            <Logo size={30} />
          </div>
          <h1 className="auth__title">{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>
          {children}
        </motion.div>

        {footer && <div className="auth__footer">{footer}</div>}
      </main>
    </div>
  );
}

export default AuthLayout;
