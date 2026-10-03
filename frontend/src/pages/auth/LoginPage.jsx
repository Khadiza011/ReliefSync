import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { ArrowRight, CircleAlert, CircleCheck, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLE_NAMES, ROLE_ROUTES } from '../../utils/constants';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const shakeControls = useAnimationControls();
  const shake = () => shakeControls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
  const registered = location.state?.registered;

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) {
      shake();
      return;
    }
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setFormError(result.error);
      shake();
      return;
    }

    const { user } = result;
    toast.success(`Welcome back, ${user.full_name?.split(' ')[0] || 'there'}`, `Signed in as ${ROLE_NAMES[user.role_id] || 'user'}.`);
    const from = location.state?.from?.pathname;
    navigate(from && from !== '/login' ? from : ROLE_ROUTES[user.role_id] || '/dashboard', { replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your relief coordination workspace."
      asideTitle="One command center for every responder."
      asideText="Shelters, families, supplies and people — synchronised in real time across your whole operation."
      footer={
        <>
          New to ReliefSync?{' '}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </>
      }
    >
      <AnimatePresence>
        {registered && !formError && (
          <motion.div className="inline-alert" style={{ marginBottom: 20, background: 'var(--success-soft)', borderColor: 'rgba(52,211,153,0.25)' }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <CircleCheck style={{ color: 'var(--success)' }} aria-hidden="true" />
            <span>Account created. Sign in with your new credentials.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        className="auth__form"
        onSubmit={onSubmit}
        noValidate
        animate={shakeControls}
      >
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          size="lg"
          placeholder="you@organisation.org"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
          }}
          error={errors.email}
          disabled={submitting}
          data-autofocus
          autoFocus
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          size="lg"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
          }}
          error={errors.password}
          disabled={submitting}
          suffix={
            <button
              type="button"
              className="auth__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          }
        />

        <AnimatePresence>
          {formError && (
            <motion.div
              className="inline-alert inline-alert--danger"
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CircleAlert aria-hidden="true" />
              <span>{formError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" variant="primary" size="lg" block loading={submitting} rightIcon={<ArrowRight />}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </motion.form>

      <div className="auth__roles">
        <span>Workspaces</span>
        <div>
          {Object.values(ROLE_NAMES).map((r) => (
            <span key={r} className="auth__role-chip">
              {r}
            </span>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
