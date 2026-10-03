import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, ClipboardPlus, HeartPulse, Plus, Siren, Stethoscope, UserCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { MiniStats } from './shared';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { useOnOpen } from '../../hooks/useUi';
import { familiesService, medicalService, volunteerService } from '../../services/api';
import { humanize } from '../../utils/constants';
import { notifyDataChanged } from '../../utils/events';
import { formatDateTime, formatRelativeTime } from '../../utils/helpers';

const PRIORITY_TONE = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'serious', EMERGENCY: 'danger' };
const STATUS_TONE = { PENDING: 'warning', ASSIGNED: 'cyan', COMPLETED: 'success' };
const PRIORITY_RANK = { EMERGENCY: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].map((p) => ({ value: p, label: humanize(p) }));

/* ---------------- New medical request ---------------- */
function MedicalRequestModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [families, setFamilies] = useState([]);
  const [values, setValues] = useState({ family_id: '', priority: 'MEDIUM', problem_description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useOnOpen(open, () => {
    setValues({ family_id: '', priority: 'MEDIUM', problem_description: '' });
    setErrors({});
  });

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    familiesService
      .list()
      .then((list) => !cancelled && setFamilies(list))
      .catch(() => !cancelled && setFamilies([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.family_id) next.family_id = 'Select a family';
    if (!values.problem_description.trim()) next.problem_description = 'Describe the medical problem';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await medicalService.create({ family_id: Number(values.family_id), priority: values.priority, problem_description: values.problem_description.trim() });
      toast.success('Medical request created', 'The request is now waiting for medical support.');
      notifyDataChanged();
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error('Could not create request', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={submit}
      icon={ClipboardPlus}
      title="New medical request"
      description="Report a medical problem for a registered family."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} leftIcon={<ClipboardPlus />}>
            Create request
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2">
          <Select
            label="Family"
            required
            placeholder="Select family"
            value={values.family_id}
            onChange={set('family_id')}
            error={errors.family_id}
            options={families.map((f) => ({ value: String(f.family_id), label: `${f.family_code} · ${f.current_district || ''}` }))}
          />
        </div>
        <div className="span-2">
          <Select label="Priority" required value={values.priority} onChange={set('priority')} options={PRIORITY_OPTIONS} />
        </div>
        <div className="span-2">
          <Textarea label="Problem description" required rows={3} value={values.problem_description} onChange={set('problem_description')} error={errors.problem_description} />
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Assign team / volunteer ---------------- */
function AssignModal({ open, request, onClose, onDone }) {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [values, setValues] = useState({ medical_team_id: '', volunteer_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useOnOpen(open, () => {
    setValues({ medical_team_id: request?.medical_team_id ? String(request.medical_team_id) : '', volunteer_id: request?.volunteer_id ? String(request.volunteer_id) : '' });
    setError('');
  });

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    medicalService
      .teams()
      .then((l) => !cancelled && setTeams(l))
      .catch(() => !cancelled && setTeams([]));
    volunteerService
      .available()
      .then((l) => !cancelled && setVolunteers(l))
      .catch(() => !cancelled && setVolunteers([]));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!values.medical_team_id && !values.volunteer_id) {
      setError('Select a medical team or a volunteer');
      return;
    }
    setSaving(true);
    try {
      await medicalService.assign({
        medical_request_id: request.medical_request_id,
        medical_team_id: values.medical_team_id ? Number(values.medical_team_id) : null,
        volunteer_id: values.volunteer_id ? Number(values.volunteer_id) : null,
      });
      toast.success('Medical support assigned', `Request #${request.medical_request_id} now has support.`);
      notifyDataChanged();
      onDone?.();
      onClose();
    } catch (err) {
      toast.error('Assignment failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={submit}
      icon={UserCheck}
      title="Assign medical support"
      description={request ? `${request.family_code} · ${request.problem_description}` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} leftIcon={<UserCheck />}>
            Assign
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2">
          <Select
            label="Medical team"
            placeholder="No team"
            value={values.medical_team_id}
            onChange={(e) => {
              setValues((v) => ({ ...v, medical_team_id: e.target.value }));
              setError('');
            }}
            error={error}
            hint="A medical team becomes busy at 5 active cases"
            options={teams.map((t) => ({
              value: String(t.medical_team_id),
              label: `${t.name} · ${humanize(t.role)} · ${humanize(t.availability)} · ${Number(t.active_case_count || 0)}/5 active`,
              disabled:
                String(t.medical_team_id) !== String(request?.medical_team_id || '') &&
                t.availability !== 'AVAILABLE',
            }))}
          />
        </div>
        <div className="span-2">
          <Select
            label="Volunteer (optional)"
            placeholder="No volunteer"
            value={values.volunteer_id}
            onChange={(e) => setValues((v) => ({ ...v, volunteer_id: e.target.value }))}
            hint="Only available volunteers are listed"
            options={volunteers.map((v) => ({ value: String(v.volunteer_id), label: `${v.volunteer_name} (${v.volunteer_code})` }))}
          />
        </div>
      </div>
    </Modal>
  );
}


/* ---------------- Add medical team ---------------- */
function MedicalTeamModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [values, setValues] = useState({ name: '', role: 'DOCTOR', phone: '', location: '', availability: 'AVAILABLE' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useOnOpen(open, () => {
    setValues({ name: '', role: 'DOCTOR', phone: '', location: '', availability: 'AVAILABLE' });
    setErrors({});
  });

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Enter a name';
    if (!values.role) next.role = 'Select a role';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await medicalService.createTeam({
        name: values.name.trim(),
        role: values.role,
        phone: values.phone.trim(),
        location: values.location.trim(),
        availability: values.availability,
      });
      toast.success('Medical team added', `${values.name.trim()} is now available for assignment.`);
      notifyDataChanged();
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error('Could not add medical team', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={submit}
      icon={Stethoscope}
      title="Add medical team"
      description="Create a doctor, nurse or medical volunteer entry for future assignments."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving} leftIcon={<Plus />}>Add medical team</Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2"><Input label="Name" required value={values.name} onChange={set('name')} error={errors.name} placeholder="e.g. Dr. Hasan" /></div>
        <Select label="Role" required value={values.role} onChange={set('role')} error={errors.role} options={[
          { value: 'DOCTOR', label: 'Doctor' },
          { value: 'NURSE', label: 'Nurse' },
          { value: 'MEDICAL_VOLUNTEER', label: 'Medical volunteer' },
        ]} />
        <Select label="Availability" value={values.availability} onChange={set('availability')} options={[
          { value: 'AVAILABLE', label: 'Available' },
          { value: 'BUSY', label: 'Busy' },
          { value: 'OFFLINE', label: 'Offline' },
        ]} />
        <Input label="Phone" value={values.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
        <Input label="Location" value={values.location} onChange={set('location')} placeholder="e.g. Feni" />
      </div>
    </Modal>
  );
}

/* ---------------- Page ---------------- */
export function MedicalPage() {
  const toast = useToast();
  const { isAdmin, isReliefManager } = useRole();
  const canAssign = isAdmin || isReliefManager;

  const [createOpen, setCreateOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [assignFor, setAssignFor] = useState(null);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');

  const { data, error, loading, refetch } = useFetch(() => medicalService.requests());
  const requests = useMemo(() => data || [], [data]);
  const rows = requests.filter((r) => (status === 'all' || r.status === status) && (priority === 'all' || r.priority === priority));

  const complete = async (r) => {
    try {
      await medicalService.updateStatus(r.assignment_id, 'COMPLETED');
      toast.success('Marked as completed', `Request #${r.medical_request_id} is closed.`);
      notifyDataChanged();
      refetch();
    } catch (err) {
      toast.error('Could not update status', err.message);
    }
  };

  const stats = [
    { label: 'Medical requests', value: requests.length, icon: HeartPulse },
    { label: 'Waiting for support', value: requests.filter((r) => r.status === 'PENDING').length, icon: Siren, tone: 'var(--warning)' },
    { label: 'In progress', value: requests.filter((r) => r.status === 'ASSIGNED').length, icon: Stethoscope, tone: 'var(--info)' },
    { label: 'Completed', value: requests.filter((r) => r.status === 'COMPLETED').length, icon: CheckCheck, tone: 'var(--success)' },
  ];

  const columns = [
    { key: 'medical_request_id', header: 'Request', render: (r) => <span className="code-chip">MED-{String(r.medical_request_id).padStart(4, '0')}</span> },
    {
      key: 'family_code',
      header: 'Family',
      render: (r) => (
        <div className="cell-primary">
          <span className="cell-primary__title mono">{r.family_code}</span>
          <span className="cell-primary__sub">{r.current_district}</span>
        </div>
      ),
    },
    { key: 'problem_description', header: 'Problem', sortable: false, render: (r) => <span style={{ display: 'inline-block', maxWidth: 260 }}>{r.problem_description}</span> },
    { key: 'priority', header: 'Priority', sortValue: (r) => PRIORITY_RANK[r.priority] || 0, render: (r) => <Badge tone={PRIORITY_TONE[r.priority] || 'neutral'} size="sm">{humanize(r.priority)}</Badge> },
    {
      key: 'assigned_medical_team',
      header: 'Medical team',
      render: (r) =>
        r.assigned_medical_team ? (
          <div className="cell-primary">
            <span className="cell-primary__title">{r.assigned_medical_team}</span>
            <span className="cell-primary__sub">{humanize(r.team_role)}</span>
          </div>
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      key: 'assigned_volunteer',
      header: 'Volunteer',
      render: (r) =>
        r.assigned_volunteer ? (
          <div className="cell-primary">
            <span className="cell-primary__title">{r.assigned_volunteer}</span>
            <span className="cell-primary__sub">{r.volunteer_code}</span>
          </div>
        ) : (
          <span className="muted">—</span>
        ),
    },
    ...(canAssign
      ? [
          {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            csv: false,
            width: 230,
            render: (r) => {
              if (r.status === 'COMPLETED') return <span className="muted">Completed</span>;

              if (r.status === 'PENDING') {
                return (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserCheck />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssignFor(r);
                    }}
                  >
                    Assign
                  </Button>
                );
              }

              if (r.status === 'ASSIGNED' && r.assignment_id) {
                return (
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" leftIcon={<UserCheck />} onClick={() => setAssignFor(r)}>
                      Reassign
                    </Button>
                    <Button variant="success-soft" size="sm" leftIcon={<CheckCheck />} onClick={() => complete(r)}>
                      Complete
                    </Button>
                  </div>
                );
              }

              return <span className="muted">—</span>;
            },
          },
        ]
      : []),
    { key: 'assigned_at', header: 'Assigned', render: (r) => (r.assigned_at ? <span title={formatDateTime(r.assigned_at)}>{formatRelativeTime(r.assigned_at)}</span> : <span className="muted">—</span>) },
    { key: 'requested_at', header: 'Requested', render: (r) => <span title={formatDateTime(r.requested_at)}>{formatRelativeTime(r.requested_at)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status] || 'neutral'} size="sm" dot>{humanize(r.status)}</Badge> },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations"
        eyebrowIcon={Stethoscope}
        title="Medical support"
        description="Medical requests from families and the full history of which team or volunteer handled each one."
        actions={
          <>
            {isAdmin && (
              <Button variant="outline" leftIcon={<Plus />} onClick={() => setTeamOpen(true)}>
                Add medical team
              </Button>
            )}
            <Button variant="primary" leftIcon={<ClipboardPlus />} onClick={() => setCreateOpen(true)}>
              New request
            </Button>
          </>
        }
      />
      <MiniStats stats={stats} loading={loading && !data} />
      <Card delay={0.08}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="medical_request_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['family_code', 'problem_description', 'assigned_medical_team', 'assigned_volunteer', 'current_district']}
          searchPlaceholder="Search family, problem, team…"
          initialSort={{ key: 'priority', dir: 'desc' }}
          exportName="medical-history"
          filters={
            <>
              <FilterSelect
                label="Status"
                value={status}
                onChange={setStatus}
                options={[{ value: 'all', label: 'All statuses' }, { value: 'PENDING', label: 'Pending' }, { value: 'ASSIGNED', label: 'Assigned' }, { value: 'COMPLETED', label: 'Completed' }]}
              />
              <FilterSelect label="Priority" value={priority} onChange={setPriority} options={[{ value: 'all', label: 'All priorities' }, ...PRIORITY_OPTIONS]} />
            </>
          }
          empty={{ icon: Stethoscope, title: 'No medical requests yet', description: 'Create a request when a family needs medical help.' }}
        />
      </Card>
      <MedicalRequestModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
      <MedicalTeamModal open={teamOpen} onClose={() => setTeamOpen(false)} />
      <AssignModal open={!!assignFor} request={assignFor} onClose={() => setAssignFor(null)} onDone={refetch} />
    </div>
  );
}

export default MedicalPage;
