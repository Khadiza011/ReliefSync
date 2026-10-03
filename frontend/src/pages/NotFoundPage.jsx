import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { EASE } from '../utils/motion';
import './pages.css';

export function NotFoundPage() {
  const { homePath } = useAuth();
  const location = useLocation();
  return (
    <div className="not-found">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <div className="not-found__code">404</div>
        <h1 style={{ marginTop: 12, fontSize: 'var(--text-2xl)' }}>This page drifted off the map</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Nothing lives at <span className="mono">{location.pathname}</span>.
        </p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
          <Button variant="secondary" leftIcon={<ArrowLeft />} onClick={() => window.history.back()}>
            Go back
          </Button>
          <Button variant="primary" leftIcon={<Compass />} to={homePath}>
            Back to my workspace
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default NotFoundPage;
