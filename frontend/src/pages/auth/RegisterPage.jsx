import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, CircleAlert, Eye, EyeOff, HandHeart, Lock, Mail, Phone, User, Users } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cx } from '../../utils/helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The backend only allows self-registration for these two roles
const ROLE_OPTIONS = [
  { value: 'VOLUNTEER', label: 'Volunteer', icon: Users, text: 'Help on the ground at shelters and distributions.', tone: 'var(--role-volunteer)' },
  { value: 'DONOR', label: 'Donor', icon: HandHeart, text: 'Pledge supplies and follow where they land.', tone: 'var(--role-donor)' },
];

function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

const STRENGTH = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '', role: 'VOLUNTEER' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const score = useMemo(() => passwordScore(form.password), [form.password]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.full_name.trim()) next.full_name = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 6) next.password = 'Use at least 6 characters';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    const result = await register({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password,
      role: form.role,
    });
    setSubmitting(false);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    if (form.role === 'VOLUNTEER') {
      toast.success('Registration submitted', 'An administrator must approve your volunteer account before you can sign in.');
    } else {
      toast.success('Account created', 'You can now sign in to your workspace.');
    }
    navigate('/login', { replace: true, state: { email: form.email.trim(), registered: true } });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the response as a volunteer or donor. Staff accounts are issued by an administrator."
      asideTitle="Every pair of hands. Every box of supplies."
      asideText="Volunteers see the shelters they serve. Donors follow every pledge from submission to shelter shelf."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={onSubmit} noValidate>
        <div className="role-picker" role="radiogroup" aria-label="Account type">
          {ROLE_OPTIONS.map((opt) => {
            const selected = form.role === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cx('role-picker__option', selected && 'is-selected')}
                style={{ '--tone': opt.tone }}
                onClick={() => set('role')(opt.value)}
              >
                <span className="role-picker__icon" aria-hidden="true">
                  <opt.icon />
                </span>
                <span className="role-picker__text">
                  <span className="role-picker__label">{opt.label}</span>
                  <span className="role-picker__desc">{opt.text}</span>
                </span>
                <span className="role-picker__check" aria-hidden="true">
                  <Check />
                </span>
              </button>
            );
          })}
        </div>

        <Input label="Full name" icon={User} placeholder="e.g. Nusrat Jahan" value={form.full_name} onChange={set('full_name')} error={errors.full_name} autoComplete="name" required />
        <div className="form-grid">
          <Input label="Email" type="email" icon={Mail} placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" required />
          <Input label="Phone" type="tel" icon={Phone} placeholder="01XXXXXXXXX" value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" hint="Optional" />
        </div>
        <div className="form-grid">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            autoComplete="new-password"
            required
            suffix={
              <button type="button" className="auth__eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
          />
          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Repeat password"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            autoComplete="new-password"
            required
          />
        </div>

        {form.password && (
          <div className="strength" aria-live="polite">
            <div className="strength__bars">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={cx('strength__bar', score >= n && `is-on is-${score}`)} />
              ))}
            </div>
            <span className="strength__label">{STRENGTH[score]}</span>
          </div>
        )}

        <AnimatePresence>
          {formError && (
            <motion.div className="inline-alert inline-alert--danger" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <CircleAlert aria-hidden="true" />
              <span>{formError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" variant="primary" size="lg" block loading={submitting} rightIcon={<ArrowRight />}>
          {submitting ? 'Creating account…' : `Create ${form.role === 'DONOR' ? 'donor' : 'volunteer'} account`}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
