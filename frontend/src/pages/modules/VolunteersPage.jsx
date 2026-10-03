import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardPlus, UserCheck, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Field';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { sheltersService, volunteerService } from '../../services/api';
import { formatDate } from '../../utils/helpers';

export default function VolunteersPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { data, loading, error, refetch } = useFetch(volunteerService.list);
  const { data: sheltersData } = useFetch(sheltersService.list);
  const [selected, setSelected] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [form, setForm] = useState({ shelter_id: '', task_title: '', task_description: '' });

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const shelters = Array.isArray(sheltersData) ? sheltersData : [];
  const shelterOptions = [{ value: '', label: 'Select a shelter' }, ...shelters.map((s) => ({ value: String(s.shelter_id), label: `${s.shelter_name} · ${s.district}` }))];

  const openAssign = (volunteer) => {
    setAssigning(volunteer);
    setForm({ shelter_id: '', task_title: '', task_description: '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await volunteerService.assign(assigning.volunteer_id, { ...form, shelter_id: Number(form.shelter_id) });
      toast.success('Volunteer assigned', `${assigning.volunteer_name} is now assigned to the shelter task.`);
      setAssigning(null);
      setSelected(null);
      await refetch();
    } catch (err) {
      toast.error('Could not assign volunteer', err.message);
    } finally {
      setSaving(false);
    }
  };


  const approve = async (volunteer) => {
    setApprovingId(volunteer.volunteer_id);
    try {
      await volunteerService.approve(volunteer.volunteer_id);
      toast.success('Volunteer approved', `${volunteer.volunteer_name} can now sign in and receive assignments.`);
      setSelected(null);
      await refetch();
    } catch (err) {
      toast.error('Could not approve volunteer', err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const columns = [
    {
      key: 'volunteer_name', header: 'Volunteer', render: (r) => <div className="cell-primary"><span className="cell-primary__title">{r.volunteer_name}</span><span className="cell-primary__sub mono">{r.volunteer_code}</span></div>,
    },
    { key: 'phone', header: 'Contact', render: (r) => r.phone || r.email || '—' },
    { key: 'skills', header: 'Skills', render: (r) => r.skills || '—' },
    { key: 'availability', header: 'Availability', render: (r) => r.account_status === 'INACTIVE' ? <Badge tone="warning">Pending approval</Badge> : <StatusBadge status={r.availability} size="sm" /> },
    { key: 'assigned_shelter', header: 'Current shelter', render: (r) => r.assigned_shelter || '—' },
    {
      key: 'action', header: '', render: (r) => {
        if (r.account_status === 'INACTIVE') {
          return isAdmin
            ? <Button size="sm" variant="primary" leftIcon={<CheckCircle2 />} loading={approvingId === r.volunteer_id} onClick={(e) => { e.stopPropagation(); approve(r); }}>Approve</Button>
            : <Badge tone="warning">Awaiting admin</Badge>;
        }
        return r.availability === 'AVAILABLE'
          ? <Button size="sm" variant="secondary" leftIcon={<ClipboardPlus />} onClick={(e) => { e.stopPropagation(); openAssign(r); }}>Assign</Button>
          : <Badge tone="neutral">{r.active_task ? 'Assigned' : r.availability}</Badge>;
      },
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Operations" eyebrowIcon={Users} title="Volunteers" description="View volunteer availability, skills and current assignments, then assign available volunteers to shelter work." />
      <Card>
        <DataTable columns={columns} rows={rows} rowKey="volunteer_id" loading={loading} error={error} onRetry={refetch} searchKeys={['volunteer_name','volunteer_code','phone','email','skills','assigned_shelter']} searchPlaceholder="Search volunteers…" onRowClick={setSelected} exportName="volunteers" />
      </Card>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} eyebrow="Volunteer" title={selected?.volunteer_name || ''} meta={selected ? (selected.account_status === 'INACTIVE' ? <Badge tone="warning">Pending approval</Badge> : <StatusBadge status={selected.availability} />) : null} footer={selected?.account_status === 'INACTIVE' && isAdmin ? <Button variant="primary" leftIcon={<CheckCircle2 />} loading={approvingId === selected?.volunteer_id} onClick={() => approve(selected)}>Approve volunteer</Button> : selected?.availability === 'AVAILABLE' ? <Button variant="primary" leftIcon={<ClipboardPlus />} onClick={() => openAssign(selected)}>Assign task</Button> : null}>
        {selected && <>
          <KeyValue items={[
            { label: 'Code', value: selected.volunteer_code },
            { label: 'Account', value: selected.account_status === 'INACTIVE' ? 'Pending admin approval' : (selected.account_status || 'Legacy / unlinked') },
            { label: 'Phone', value: selected.phone || '—' },
            { label: 'Email', value: selected.email || '—', wide: true },
            { label: 'Skills', value: selected.skills || 'No skills recorded', wide: true },
            { label: 'Current shelter', value: selected.assigned_shelter || 'Not assigned', wide: true },
            { label: 'Current task', value: selected.active_task || '—', wide: true },
            { label: 'Joined', value: formatDate(selected.created_at) },
          ]} />
        </>}
      </Drawer>

      <Modal open={Boolean(assigning)} onClose={() => setAssigning(null)} as="form" onSubmit={submit} icon={UserCheck} title="Assign volunteer" description={assigning ? `Create a shelter assignment for ${assigning.volunteer_name}.` : ''} footer={<><Button variant="ghost" onClick={() => setAssigning(null)}>Cancel</Button><Button type="submit" variant="primary" loading={saving}>Assign volunteer</Button></>}>
        <div className="form-grid">
          <div className="span-2"><Select label="Shelter" required value={form.shelter_id} onChange={(e) => setForm({ ...form, shelter_id: e.target.value })} options={shelterOptions} /></div>
          <div className="span-2"><Input label="Task title" required value={form.task_title} onChange={(e) => setForm({ ...form, task_title: e.target.value })} placeholder="e.g. Manage inventory desk" /></div>
          <div className="span-2"><Input label="Task description" value={form.task_description} onChange={(e) => setForm({ ...form, task_description: e.target.value })} placeholder="Optional instructions for the volunteer" /></div>
        </div>
      </Modal>
    </div>
  );
}
