import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Database, KeyRound, LogIn, ScrollText, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { ParticleField } from './landing/ParticleField';
import { HeroVisual } from './landing/HeroVisual';
import { ArchitectureSection, FeatureBento, MetricsStrip, RolesSection, WorkflowSection } from './landing/Sections';
import { EASE } from '../utils/motion';
import { cx } from '../utils/helpers';
import './landing/welcome.css';

const HEADLINE = ['Coordinate', 'relief', 'at', 'the'];
const HEADLINE_ACCENT = ['speed', 'of', 'crisis.'];

const NAV_LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#roles', label: 'Roles' },
];

export function WelcomePage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroFade = useTransform(scrollY, [0, 500], [1, 0.25]);
  const heroShift = useTransform(scrollY, [0, 500], [0, 60]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing">
      <div className="landing__bg" aria-hidden="true">
        <div className="aurora aurora--1" />
        <div className="aurora aurora--2" />
        <div className="aurora aurora--3" />
        <div className="landing__grid" />
        <ParticleField className="landing__particles" />
        <div className="landing__noise" />
      </div>

      <header className={cx('landing-nav', scrolled && 'is-scrolled')}>
        <div className="landing-nav__inner">
          <Link to="/" aria-label="ReliefSync home">
            <Logo size={30} />
          </Link>
          <nav className="landing-nav__links" aria-label="Sections">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="landing-nav__actions">
            <Button variant="ghost" size="sm" to="/login" leftIcon={<LogIn />}>
              Sign in
            </Button>
            <Button variant="primary" size="sm" to="/register" rightIcon={<ArrowRight />}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <motion.div className="hero__copy" style={{ opacity: heroFade, y: heroShift }}>
            <motion.a
              href="#workflow"
              className="hero__pill"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span className="hero__pill-tag">
                <Sparkles aria-hidden="true" /> v2.0
              </span>
              <span>The operating system for disaster relief</span>
              <ArrowRight className="hero__pill-arrow" aria-hidden="true" />
            </motion.a>

            <h1 className="hero__title" aria-label="Coordinate relief at the speed of crisis.">
              {HEADLINE.map((w, i) => (
                <Word key={w + i} delay={0.15 + i * 0.07}>
                  {w}
                </Word>
              ))}
              <br className="hero__br" />
              {HEADLINE_ACCENT.map((w, i) => (
                <Word key={w + i} delay={0.45 + i * 0.08} accent>
                  {w}
                </Word>
              ))}
            </h1>

            <motion.p
              className="hero__subtitle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
            >
              ReliefSync unifies shelters, families, inventory, requests, donations and distributions into one real-time
              command layer — built on a transactional database core with role-based access for every responder.
            </motion.p>

            <motion.div
              className="hero__ctas"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.9 }}
            >
              <Button variant="primary" size="lg" to="/login" rightIcon={<ArrowRight />} className="hero__cta-main">
                Launch console
              </Button>
              <Button variant="secondary" size="lg" to="/register">
                Create free account
              </Button>
            </motion.div>

            <motion.ul
              className="hero__trust"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 1.05 } } }}
            >
              {[
                { icon: KeyRound, label: 'JWT authentication' },
                { icon: ShieldCheck, label: 'Role-based access' },
                { icon: Database, label: 'ACID transactions' },
                { icon: ScrollText, label: 'Full audit trail' },
              ].map((t) => (
                <motion.li
                  key={t.label}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
                >
                  <t.icon aria-hidden="true" />
                  {t.label}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <HeroVisual />
        </section>

        <div className="landing-container">
          <MetricsStrip />
          <FeatureBento />
          <WorkflowSection />
          <ArchitectureSection />
          <RolesSection />

          <motion.section
            className="cta"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="cta__glow" aria-hidden="true" />
            <div className="cta__rings" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="section-eyebrow">Ready when it matters</span>
            <h2 className="cta__title">
              The next storm won't wait.
              <br />
              <span className="text-gradient">Your response doesn't have to.</span>
            </h2>
            <p className="cta__text">Sign in to your workspace, or join as a volunteer or donor in under a minute.</p>
            <div className="hero__ctas" style={{ justifyContent: 'center' }}>
              <Button variant="primary" size="lg" to="/login" rightIcon={<ArrowRight />}>
                Launch console
              </Button>
              <Button variant="secondary" size="lg" to="/register">
                Join as volunteer or donor
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div>
            <Logo size={26} />
            <p>Smart disaster relief coordination — shelters, supplies and people, in sync.</p>
          </div>
          <nav aria-label="Footer">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
            <Link to="/login">Sign in</Link>
          </nav>
          <p className="landing-footer__copy">© {new Date().getFullYear()} ReliefSync · Disaster Relief Management System</p>
        </div>
      </footer>
    </div>
  );
}

function Word({ children, delay, accent = false }) {
  return (
    <span className="hero__word-mask">
      <motion.span
        className={cx('hero__word', accent && 'text-gradient')}
        initial={{ y: '110%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default WelcomePage;
