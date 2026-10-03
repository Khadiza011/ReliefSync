import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Phone, Save, ShieldCheck, Trash2, UserRound, Wrench } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Field';
import { Avatar } from '../components/ui/Segmented';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { volunteerService } from '../services/api';
import { ROLE_COLORS, ROLE_NAMES } from '../utils/constants';
import './pages.css';

export default function ProfilePage() {
  const { user, updateStoredUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(() => Number(user?.role_id) === 4);
  const [savingSkills, setSavingSkills] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authService
      .getProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setProfileForm({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
        });
        updateStoredUser(data);
      })
      .catch((err) => !cancelled && toast.error('Could not load profile', err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toast, updateStoredUser]);

  useEffect(() => {
    if (Number(user?.role_id) !== 4) return undefined;

    let cancelled = false;

    Promise.all([volunteerService.me(), volunteerService.skillCatalog()])
      .then(([volunteerData, catalog]) => {
        if (cancelled) return;
        setSkillCatalog(Array.isArray(catalog) ? catalog : []);
        setSelectedSkillIds(
          Array.isArray(volunteerData?.skills)
            ? volunteerData.skills.map((skill) => Number(skill.skill_id))
            : [],
        );
      })
      .catch((err) => !cancelled && toast.error('Could not load volunteer skills', err.message))
      .finally(() => !cancelled && setSkillsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [toast, user?.role_id]);

  const toggleSkill = (skillId) => {
    const id = Number(skillId);
    setSelectedSkillIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const saveSkills = async () => {
    setSavingSkills(true);
    try {
      const result = await volunteerService.updateMySkills(selectedSkillIds);
      setSelectedSkillIds((result.skills || []).map((skill) => Number(skill.skill_id)));
      toast.success('Skills updated', 'Your volunteer skills were saved to your profile.');
    } catch (err) {
      toast.error('Could not update skills', err.message);
    } finally {
      setSavingSkills(false);
    }
  };

  const setProfileValue = (key) => (e) => {
    setProfileForm((v) => ({ ...v, [key]: e.target.value }));
    setProfileErrors((x) => ({ ...x, [key]: undefined }));
  };

  const setPasswordValue = (key) => (e) => {
    setPasswordForm((v) => ({ ...v, [key]: e.target.value }));
    setPasswordErrors((x) => ({ ...x, [key]: undefined }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const next = {};
    if (!profileForm.full_name.trim()) next.full_name = 'Name is required';
    if (!profileForm.email.trim()) next.email = 'Email is required';
    setProfileErrors(next);
    if (Object.keys(next).length) return;

    setSavingProfile(true);
    try {
      const result = await authService.updateProfile({
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      });
      setProfile(result.user);
      updateStoredUser(result.user);
      toast.success('Profile updated', 'Your account details were saved successfully.');
    } catch (err) {
      toast.error('Could not update profile', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const submitDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error('Password required', 'Enter your current password to continue.');
      return;
    }

    setDeleting(true);
    try {
      const result = await authService.deleteAccount({
        current_password: deletePassword,
        reason: deleteReason.trim(),
      });

      if (Number(user?.role_id) === 5) {
        toast.success('Account deleted', 'Your donor account has been closed.');
      } else {
        toast.success('Request sent', 'Your account is paused while an administrator reviews your deletion request.');
      }

      setDeleteOpen(false);
      logout();
      navigate('/login', { replace: true, state: { accountMessage: result.message } });
    } catch (err) {
      toast.error('Could not delete account', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const next = {};
    if (!passwordForm.current_password) next.current_password = 'Enter your current password';
    if (!passwordForm.new_password) next.new_password = 'Enter a new password';
    else if (passwordForm.new_password.length < 6) next.new_password = 'Use at least 6 characters';
    if (passwordForm.confirm_password !== passwordForm.new_password) next.confirm_password = 'Passwords do not match';
    setPasswordErrors(next);
    if (Object.keys(next).length) return;

    setSavingPassword(true);
    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed', 'Use the new password the next time you sign in.');
    } catch (err) {
      toast.error('Could not change password', err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Account"
        eyebrowIcon={UserRound}
        title="My profile"
        description="View and update your own ReliefSync account details."
      />

      <div className="dash-grid">
        <Card className="span-4" spotlight>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, padding: '10px 0' }}>
              <Avatar name={profile?.full_name || user?.full_name || user?.email} tone={ROLE_COLORS[user?.role_id]} size={72} />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{profile?.full_name || user?.full_name || 'User'}</h2>
                <p style={{ margin: '5px 0 0', color: 'var(--text-3)' }}>{profile?.email || user?.email}</p>
              </div>
              <div className="popover__role" style={{ '--tone': ROLE_COLORS[user?.role_id] }}>
                <ShieldCheck aria-hidden="true" />
                {ROLE_NAMES[user?.role_id]} access
              </div>
              {profile?.created_at && (
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
                  Account #{profile.user_id}
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="span-8">
          <CardHeader title="Personal information" subtitle="Change your name, email address or phone number." icon={UserRound} />
          <CardBody>
            <form onSubmit={saveProfile}>
              <div className="form-grid">
                <div className="span-2">
                  <Input
                    label="Full name"
                    required
                    icon={UserRound}
                    value={profileForm.full_name}
                    onChange={setProfileValue('full_name')}
                    error={profileErrors.full_name}
                    disabled={loading}
                  />
                </div>
                <div className="span-2">
                  <Input
                    label="Email"
                    type="email"
                    required
                    icon={Mail}
                    value={profileForm.email}
                    onChange={setProfileValue('email')}
                    error={profileErrors.email}
                    disabled={loading}
                  />
                </div>
                <div className="span-2">
                  <Input
                    label="Phone"
                    icon={Phone}
                    value={profileForm.phone}
                    onChange={setProfileValue('phone')}
                    placeholder="Optional"
                    disabled={loading}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <Button type="submit" variant="primary" loading={savingProfile} leftIcon={<Save />}>
                  Save profile
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {Number(user?.role_id) === 4 && (
          <Card className="span-12">
            <CardHeader
              title="Volunteer skills"
              subtitle="Select the skills you can contribute. These are saved to your volunteer record and visible to coordinators."
              icon={Wrench}
            />
            <CardBody>
              {skillsLoading ? (
                <p style={{ margin: 0, color: 'var(--text-3)' }}>Loading skills…</p>
              ) : skillCatalog.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-3)' }}>No skills are configured yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {skillCatalog.map((skill) => {
                    const checked = selectedSkillIds.includes(Number(skill.skill_id));
                    return (
                      <label
                        key={skill.skill_id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '12px 14px',
                          border: '1px solid var(--border-2)',
                          borderRadius: 12,
                          cursor: 'pointer',
                          background: checked ? 'var(--surface-2)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSkill(skill.skill_id)}
                          style={{ marginTop: 3 }}
                        />
                        <span>
                          <strong style={{ display: 'block' }}>{skill.skill_name}</strong>
                          {skill.description && (
                            <span style={{ display: 'block', marginTop: 3, color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
                              {skill.description}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <Button
                  type="button"
                  variant="primary"
                  loading={savingSkills}
                  disabled={skillsLoading}
                  leftIcon={<Save />}
                  onClick={saveSkills}
                >
                  Save skills
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="span-12">
          <CardHeader title="Change password" subtitle="For security, confirm your current password before setting a new one." icon={KeyRound} />
          <CardBody>
            <form onSubmit={savePassword}>
              <div className="form-grid">
                <div>
                  <Input
                    label="Current password"
                    type="password"
                    required
                    value={passwordForm.current_password}
                    onChange={setPasswordValue('current_password')}
                    error={passwordErrors.current_password}
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <Input
                    label="New password"
                    type="password"
                    required
                    value={passwordForm.new_password}
                    onChange={setPasswordValue('new_password')}
                    error={passwordErrors.new_password}
                    hint="Minimum 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Input
                    label="Confirm new password"
                    type="password"
                    required
                    value={passwordForm.confirm_password}
                    onChange={setPasswordValue('confirm_password')}
                    error={passwordErrors.confirm_password}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <Button type="submit" variant="primary" loading={savingPassword} leftIcon={<KeyRound />}>
                  Change password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="span-12">
          <CardHeader
            title={Number(user?.role_id) === 5 ? 'Delete account' : 'Leave ReliefSync'}
            subtitle={
              Number(user?.role_id) === 5
                ? 'Donors may permanently close their own account without administrator approval.'
                : 'Admin, shelter manager, relief manager and volunteer accounts require another administrator to approve deletion.'
            }
            icon={Trash2}
          />
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 720 }}>
                <strong style={{ display: 'block', marginBottom: 5 }}>This action removes your access to ReliefSync.</strong>
                <span style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
                  {Number(user?.role_id) === 5
                    ? 'Your donor account will be closed immediately. Historical donation records are retained.'
                    : 'Submitting a request signs you out and pauses your account. An administrator can approve the deletion or reject it and restore your access.'}
                </span>
              </div>
              <Button type="button" variant="danger" leftIcon={<Trash2 />} onClick={() => setDeleteOpen(true)}>
                {Number(user?.role_id) === 5 ? 'Delete my account' : 'Request account deletion'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        as="form"
        onSubmit={submitDeleteAccount}
        icon={Trash2}
        title={Number(user?.role_id) === 5 ? 'Delete your account?' : 'Request account deletion?'}
        description={
          Number(user?.role_id) === 5
            ? 'This closes your donor account immediately.'
            : 'Your account will be paused now and deleted only after another administrator approves the request.'
        }
        footer={<>
          <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button type="submit" variant="danger" loading={deleting}>
            {Number(user?.role_id) === 5 ? 'Delete account' : 'Send deletion request'}
          </Button>
        </>}
      >
        <div className="form-grid">
          <div className="span-2">
            <Input
              label="Current password"
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {Number(user?.role_id) !== 5 && (
            <div className="span-2">
              <Input
                label="Reason for leaving"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Optional"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
