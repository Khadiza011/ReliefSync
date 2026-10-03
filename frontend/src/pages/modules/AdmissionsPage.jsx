import { useMemo, useState } from 'react';
import { CalendarDays, DoorOpen, House, LogOut, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { AdmitModal } from './forms';
import { MiniStats } from './shared';
import { useNewParam } from '../../hooks/useNewParam';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { admissionsService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, formatNumber, formatRelativeTime, sumBy, isWithinDays } from '../../utils/helpers';

export function AdmissionsPage() {
  const { can } = useRole();
  const toast = useToast();
  const [admitOpen, setAdmitOpen] = useNewParam();
  const [selected, setSelected] = useState(null);
  const [shelter, setShelter] = useState('all');
  const [status, setStatus] = useState('all');
  const [discharging, setDischarging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, error, loading, refetch } = useFetch(() => admissionsService.list());
  const admissions = useMemo(() => data || [], [data]);
  const shelterNames = useMemo(() => [...new Set(admissions.map((a) => a.shelter_name))].sort(), [admissions]);

  const rows = admissions.filter((a) => (shelter === 'all' || a.shelter_name === shelter) && (status === 'all' || a.status === status));
  const active = admissions.filter((a) => a.status === 'ACTIVE');

  const stats = [
    { label: 'Total admissions', value: admissions.length, icon: DoorOpen },
    { label: 'Active stays', value: active.length, icon: House, tone: 'var(--success)' },
    { label: 'People in shelters', value: sumBy(active, 'admitted_member_count'), icon: Users, tone: 'var(--info)' },
    { label: 'Admitted this week', value: admissions.filter((a) => isWithinDays(a.admitted_at, 7)).length, icon: CalendarDays, tone: 'var(--violet)' },
  ];

  const handleDischarge = async () => {
    if (!selected || selected.status !== 'ACTIVE') return;

    setDischarging(true);
    try {
      await admissionsService.discharge(selected.admission_id);
      toast.success('Family discharged', 'Shelter occupancy and family status were updated.');
      setConfirmOpen(false);
      setSelected(null);
      await refetch();
    } catch (err) {
      toast.error('Could not discharge family', err?.message || 'Please try again.');
    } finally {
      setDischarging(false);
    }
  };

  const columns = [
    { key: 'admission_id', header: 'Admission', render: (a) => <span className="code-chip">ADM-{String(a.admission_id).padStart(4, '0')}</span> },
    {
      key: 'family_code',
      header: 'Family',
      render: (a) => (
        <div className="cell-primary">
          <span className="cell-primary__title mono">{a.family_code || `#${a.family_id}`}</span>
          {a.family_priority && (
            <span className="cell-primary__sub">
              <PriorityBadge priority={a.family_priority} size="sm" />
            </span>
          )}
        </div>
      ),
    },
    { key: 'shelter_name', header: 'Shelter', render: (a) => <span style={{ color: 'var(--text-1)' }}>{a.shelter_name}</span> },
    { key: 'admitted_member_count', header: 'Members', align: 'right', render: (a) => <span className="tabular" style={{ color: 'var(--text-1)', fontWeight: 600 }}>{formatNumber(a.admitted_member_count)}</span> },
    { key: 'admitted_by_name', header: 'Admitted by', render: (a) => a.admitted_by_name || `User #${a.admitted_by}` },
    { key: 'admitted_at', header: 'When', render: (a) => <span title={formatDateTime(a.admitted_at)}>{formatRelativeTime(a.admitted_at)}</span> },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} size="sm" /> },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations"
        eyebrowIcon={DoorOpen}
        title="Admissions"
        description="Shelter check-ins for registered families. Each admission updates shelter occupancy through a database trigger."
        actions={
          can('admitFamily') && (
            <Button variant="primary" leftIcon={<DoorOpen />} onClick={() => setAdmitOpen(true)}>
              Admit family
            </Button>
          )
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <Card delay={0.08}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="admission_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['family_code', 'shelter_name', 'admitted_by_name', (a) => `ADM-${String(a.admission_id).padStart(4, '0')}`]}
          searchPlaceholder="Search family, shelter…"
          onRowClick={setSelected}
          exportName="admissions"
          filters={
            <>
              <FilterSelect label="Shelter" value={shelter} onChange={setShelter} options={[{ value: 'all', label: 'All shelters' }, ...shelterNames.map((s) => ({ value: s, label: s }))]} />
              <FilterSelect
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'DISCHARGED', label: 'Discharged' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />
            </>
          }
          empty={{
            icon: DoorOpen,
            title: 'No admissions yet',
            description: 'Admit a registered family to a shelter to see it here.',
            action: can('admitFamily') ? (
              <Button variant="primary" size="sm" leftIcon={<DoorOpen />} onClick={() => setAdmitOpen(true)}>
                Admit family
              </Button>
            ) : null,
          }}
        />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Admission"
        title={selected ? `ADM-${String(selected.admission_id).padStart(4, '0')}` : ''}
        meta={selected && <StatusBadge status={selected.status} />}
      >
        {selected && (
          <>
            <KeyValue
              items={[
                { label: 'Family', value: <span className="mono">{selected.family_code || `#${selected.family_id}`}</span> },
                { label: 'Members admitted', value: formatNumber(selected.admitted_member_count) },
                { label: 'Shelter', value: selected.shelter_name, wide: true },
                { label: 'Admitted by', value: selected.admitted_by_name || `User #${selected.admitted_by}` },
                { label: 'Admitted at', value: formatDateTime(selected.admitted_at) },
                { label: 'Discharged at', value: formatDateTime(selected.discharged_at) },
              ]}
            />

            {selected.status === 'ACTIVE' && can('admitFamily') && (
              <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-2)' }}>
                <Button
                  variant="danger-soft"
                  leftIcon={<LogOut />}
                  onClick={() => setConfirmOpen(true)}
                  block
                >
                  Discharge family
                </Button>
              </div>
            )}
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmOpen && !!selected}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDischarge}
        loading={discharging}
        tone="danger"
        title="Discharge this family?"
        description={selected ? `${selected.family_code || `Family #${selected.family_id}`} will leave ${selected.shelter_name} and ${selected.admitted_member_count} shelter place(s) will be released.` : ''}
        confirmLabel="Discharge family"
      />

      <AdmitModal open={admitOpen} onClose={() => setAdmitOpen(false)} onCreated={refetch} />
    </div>
  );
}

export default AdmissionsPage;
