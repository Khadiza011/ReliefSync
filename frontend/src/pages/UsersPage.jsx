import { useState } from 'react';
import { Building2, Power, Trash2, UserPlus, Users, X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input, Select } from '../components/ui/Field';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { useFetch } from '../hooks/useFetch';
import { useLookups } from '../hooks/useLookups';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/api';
import { ROLE_NAMES } from '../utils/constants';
import './pages.css';

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' }, { value: 'SHELTER_MANAGER', label: 'Shelter Manager' },
  { value: 'RELIEF_MANAGER', label: 'Relief Manager' }, { value: 'VOLUNTEER', label: 'Volunteer' }, { value: 'DONOR', label: 'Donor' },
];

const EMPTY = { full_name: '', email: '', phone: '', password: '', role: 'SHELTER_MANAGER', shelter_id: '' };

export default function UsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const { data, loading, error, refetch } = useFetch(userService.list);
  const { data: deletionData, loading: deletionLoading, error: deletionError, refetch: refetchDeletion } = useFetch(userService.deletionRequests);
  const { shelters = [] } = useLookups(['shelters']);
  const users = data || [];
  const deletionRequests = deletionData || [];
  const shelterOptions = shelters.map((s) => ({ value: String(s.shelter_id), label: s.shelter_name }));

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState(EMPTY);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignShelter, setAssignShelter] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (v.role === 'SHELTER_MANAGER' && !v.shelter_id) {
      toast.error('Choose a shelter', 'A shelter manager must be assigned to a shelter.');
      return;
    }
    setSaving(true);
    try {
      await userService.create({ ...v, shelter_id: v.role === 'SHELTER_MANAGER' ? Number(v.shelter_id) : undefined });
      toast.success('User created', `${v.full_name} can now sign in.`);
      setOpen(false);
      setV(EMPTY);
      refetch();
    } catch (err) {
      toast.error('Could not create user', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmStatus = async () => {
    const next = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusSaving(true);
    try {
      await userService.setStatus(statusTarget.user_id, next);
      toast.success(next === 'ACTIVE' ? 'Account activated' : 'Account deactivated', statusTarget.full_name);
      setStatusTarget(null);
      refetch();
    } catch (err) {
      toast.error('Could not update account', err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  const openAssign = (row) => {
    setAssignTarget(row);
    setAssignShelter(row.shelter_ids ? String(row.shelter_ids).split(',')[0] : '');
  };

  const saveAssign = async (e) => {
    e.preventDefault();
    if (!assignShelter) return;
    setAssignSaving(true);
    try {
      await userService.assignShelter(assignTarget.user_id, Number(assignShelter));
      toast.success('Shelter assigned', `${assignTarget.full_name} now manages the selected shelter.`);
      setAssignTarget(null);
      refetch();
    } catch (err) {
      toast.error('Could not assign shelter', err.message);
    } finally {
      setAssignSaving(false);
    }
  };


  const reviewDeletion = async () => {
    if (!reviewTarget) return;
    setReviewSaving(true);
    try {
      await userService.resolveDeletionRequest(reviewTarget.request_id, reviewTarget.decision);
      toast.success(
        reviewTarget.decision === 'APPROVED' ? 'Account deleted' : 'Request rejected',
        reviewTarget.decision === 'APPROVED'
          ? `${reviewTarget.full_name}'s account has been closed.`
          : `${reviewTarget.full_name}'s account access has been restored.`,
      );
      setReviewTarget(null);
      refetch();
      refetchDeletion();
    } catch (err) {
      toast.error('Could not review request', err.message);
    } finally {
      setReviewSaving(false);
    }
  };

  const deletionColumns = [
    { key: 'full_name', header: 'User' },
    { key: 'email', header: 'Email' },
    { key: 'role_id', header: 'Role', render: (r) => ROLE_NAMES[r.role_id] || `Role ${r.role_id}` },
    { key: 'reason', header: 'Reason', render: (r) => r.reason || '—' },
    { key: 'requested_at', header: 'Requested', render: (r) => new Date(r.requested_at).toLocaleString() },
    {
      key: 'review',
      header: 'Review',
      render: (r) => (
        <div className="row" style={{ gap: 8 }}>
          <Button
            size="sm"
            variant="danger-soft"
            leftIcon={<Trash2 />}
            disabled={Number(r.user_id) === Number(me?.user_id)}
            onClick={() => setReviewTarget({ ...r, decision: 'APPROVED' })}
          >
            Approve deletion
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<X />}
            disabled={Number(r.user_id) === Number(me?.user_id)}
            onClick={() => setReviewTarget({ ...r, decision: 'REJECTED' })}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const columns = [
    { key: 'full_name', header: 'User' },
    { key: 'email', header: 'Email' },
    { key: 'role_id', header: 'Role', render: (r) => ROLE_NAMES[r.role_id] || `Role ${r.role_id}` },
    { key: 'shelter_names', header: 'Shelter', render: (r) => (r.role_id === 2 ? r.shelter_names || <Badge tone="warning">Unassigned</Badge> : '—') },
    { key: 'phone', header: 'Phone', render: (r) => r.phone || '—' },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="row" style={{ gap: 8 }}>
          {r.role_id === 2 && !r.shelter_ids && (
            <Button size="sm" variant="outline" leftIcon={<Building2 />} onClick={() => openAssign(r)}>Shelter</Button>
          )}
          {r.user_id !== me?.user_id && (
            <Button
              size="sm"
              variant={r.status === 'ACTIVE' ? 'danger-soft' : 'success-soft'}
              leftIcon={<Power />}
              onClick={() => setStatusTarget(r)}
            >
              {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Administration"
        eyebrowIcon={Users}
        title="Users"
        description="Create staff accounts, assign shelter managers to shelters, and activate or deactivate accounts."
        actions={<Button variant="primary" leftIcon={<UserPlus />} onClick={() => setOpen(true)}>Add user</Button>}
      />
      {deletionRequests.length > 0 && (
        <Card>
          <div style={{ padding: '18px 20px 0' }}>
            <h3 style={{ margin: 0 }}>Account deletion requests</h3>
            <p style={{ margin: '5px 0 0', color: 'var(--text-3)' }}>
              Staff and volunteer accounts stay paused until an administrator approves or rejects the request. An admin cannot review their own request.
            </p>
          </div>
          <DataTable
            columns={deletionColumns}
            rows={deletionRequests}
            rowKey="request_id"
            loading={deletionLoading}
            error={deletionError}
            onRetry={refetchDeletion}
            searchKeys={['full_name', 'email', 'reason']}
            searchPlaceholder="Search deletion requests…"
          />
        </Card>
      )}

      <Card>
        <DataTable
          columns={columns}
          rows={users}
          rowKey="user_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['full_name', 'email', 'phone', 'shelter_names']}
          searchPlaceholder="Search users…"
          exportName="reliefsync-users"
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        as="form"
        onSubmit={submit}
        icon={UserPlus}
        title="Create user"
        description="Admins can create any ReliefSync role. Public sign-up remains limited to volunteer and donor."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={saving}>Create user</Button></>}
      >
        <div className="form-grid">
          <div className="span-2"><Input label="Full name" required value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} /></div>
          <div className="span-2"><Input label="Email" type="email" required value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></div>
          <div><Input label="Phone" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></div>
          <div><Select label="Role" required value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} options={roleOptions} /></div>
          {v.role === 'SHELTER_MANAGER' && (
            <div className="span-2">
              <Select label="Shelter to manage" required value={v.shelter_id} onChange={(e) => setV({ ...v, shelter_id: e.target.value })} options={shelterOptions} placeholder="Select a shelter" />
            </div>
          )}
          <div className="span-2"><Input label="Temporary password" type="password" required hint="Minimum 6 characters" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></div>
        </div>
      </Modal>

      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        as="form"
        onSubmit={saveAssign}
        icon={Building2}
        title="Assign shelter"
        description={assignTarget ? `Choose the shelter ${assignTarget.full_name} will manage.` : ''}
        footer={<><Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button><Button type="submit" variant="primary" loading={assignSaving} disabled={!assignShelter}>Save</Button></>}
      >
        <Select label="Shelter" required value={assignShelter} onChange={(e) => setAssignShelter(e.target.value)} options={shelterOptions} placeholder="Select a shelter" />
      </Modal>

      <ConfirmDialog
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onConfirm={reviewDeletion}
        loading={reviewSaving}
        tone={reviewTarget?.decision === 'APPROVED' ? 'danger' : 'primary'}
        title={reviewTarget?.decision === 'APPROVED' ? 'Approve account deletion?' : 'Reject deletion request?'}
        description={
          reviewTarget?.decision === 'APPROVED'
            ? `${reviewTarget?.full_name}'s account will be permanently closed and removed from the active user list.`
            : `${reviewTarget?.full_name}'s account will be restored and they can sign in again.`
        }
        confirmLabel={reviewTarget?.decision === 'APPROVED' ? 'Approve deletion' : 'Reject request'}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmStatus}
        loading={statusSaving}
        tone={statusTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        title={statusTarget?.status === 'ACTIVE' ? 'Deactivate this account?' : 'Activate this account?'}
        description={
          statusTarget?.status === 'ACTIVE'
            ? `${statusTarget?.full_name} will be signed out and will not be able to log in until you activate the account again.`
            : `${statusTarget?.full_name} will be able to sign in again.`
        }
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}
