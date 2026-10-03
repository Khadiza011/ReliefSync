import { useMemo, useState } from 'react';
import { DoorOpen, House, MapPin, Phone, Siren, Trash2, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { Avatar } from '../../components/ui/Segmented';
import { AdmitModal, FamilyModal } from './forms';
import { FamilyMembers } from './FamilyMembers';
import { MiniStats } from './shared';
import { useNewParam } from '../../hooks/useNewParam';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { familiesService } from '../../services/api';
import { FAMILY_STATUSES, PRIORITIES, PRIORITY_META, humanize } from '../../utils/constants';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/helpers';

const PRIORITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

export function FamiliesPage() {
  const { can } = useRole();
  const toast = useToast();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [createOpen, setCreateOpen] = useNewParam();
  const [admitFamily, setAdmitFamily] = useState(null);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [district, setDistrict] = useState('all');

  const { data, error, loading, refetch } = useFetch(() => familiesService.list());
  const families = useMemo(() => data || [], [data]);

  const districts = useMemo(() => [...new Set(families.map((f) => f.current_district).filter(Boolean))].sort(), [families]);

  const rows = useMemo(
    () =>
      families.filter(
        (f) =>
          (status === 'all' || f.status === status) &&
          (priority === 'all' || f.priority === priority) &&
          (district === 'all' || f.current_district === district)
      ),
    [families, status, priority, district]
  );

  const removeFamily = async () => {
    setRemoving(true);
    try {
      await familiesService.remove(selected.family_id);
      toast.success('Family removed', `${selected.family_code} and its records were deleted.`);
      setRemoveOpen(false);
      setSelected(null);
      await refetch();
    } catch (err) {
      toast.error('Could not remove family', err.message);
    } finally {
      setRemoving(false);
    }
  };

  const stats = [
    { label: 'Registered families', value: families.length, icon: Users },
    { label: 'Need shelter', value: families.filter((f) => f.status === 'NEEDS_SHELTER' || f.status === 'WAITING_FOR_SHELTER').length, icon: House, tone: 'var(--danger)' },
    { label: 'Critical / high priority', value: families.filter((f) => f.priority === 'CRITICAL' || f.priority === 'HIGH').length, icon: Siren, tone: 'var(--warning)' },
    { label: 'Sheltered', value: families.filter((f) => f.status === 'SHELTERED').length, icon: DoorOpen, tone: 'var(--success)' },
  ];

  const columns = [
    {
      key: 'family_code',
      header: 'Family',
      render: (f) => (
        <div className="cell-with-icon">
          <Avatar name={f.family_code.replace(/[^A-Za-z0-9]/g, ' ')} tone={PRIORITY_META[f.priority]?.color} size={32} />
          <div className="cell-primary">
            <span className="cell-primary__title mono">{f.family_code}</span>
            <span className="cell-primary__sub">Registered {formatRelativeTime(f.registered_at)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'current_district',
      header: 'Location',
      render: (f) => (
        <div className="cell-primary">
          <span className="cell-primary__title">{f.current_district}</span>
          <span className="cell-primary__sub">{f.current_area || '—'}</span>
        </div>
      ),
    },
    { key: 'contact_phone', header: 'Contact', render: (f) => <span className="mono">{f.contact_phone || '—'}</span> },
    { key: 'priority', header: 'Priority', sortValue: (f) => PRIORITY_RANK[f.priority] || 0, render: (f) => <PriorityBadge priority={f.priority} size="sm" /> },
    { key: 'status', header: 'Status', render: (f) => <StatusBadge status={f.status} size="sm" /> },
    {
      key: 'actions',
      header: '',
      sortable: false,
      csv: false,
      align: 'right',
      render: (f) =>
        can('admitFamily') && f.status !== 'SHELTERED' && f.status !== 'CLOSED' ? (
          <div className="row-actions">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<DoorOpen />}
              onClick={(e) => {
                e.stopPropagation();
                setAdmitFamily(f);
              }}
            >
              Admit
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations"
        eyebrowIcon={Users}
        title="Families"
        description="Every affected household in the relief registry — prioritised, located and tracked through to shelter."
        actions={
          can('createFamily') && (
            <Button variant="primary" leftIcon={<UserPlus />} onClick={() => setCreateOpen(true)}>
              Register family
            </Button>
          )
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <Card delay={0.08}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="family_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['family_code', 'contact_phone', 'current_district', 'current_area']}
          searchPlaceholder="Search code, phone, district…"
          initialSort={{ key: 'priority', dir: 'desc' }}
          onRowClick={setSelected}
          exportName="families"
          filters={
            <>
              <FilterSelect
                label="Filter by status"
                value={status}
                onChange={setStatus}
                options={[{ value: 'all', label: 'All statuses' }, ...FAMILY_STATUSES.map((s) => ({ value: s, label: humanize(s) }))]}
              />
              <FilterSelect
                label="Filter by priority"
                value={priority}
                onChange={setPriority}
                options={[{ value: 'all', label: 'All priorities' }, ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))]}
              />
              {districts.length > 1 && (
                <FilterSelect
                  label="Filter by district"
                  value={district}
                  onChange={setDistrict}
                  options={[{ value: 'all', label: 'All districts' }, ...districts.map((d) => ({ value: d, label: d }))]}
                />
              )}
            </>
          }
          empty={{
            icon: Users,
            title: 'No families registered yet',
            description: 'Register the first affected household to start coordinating shelter and relief.',
            action: can('createFamily') ? (
              <Button variant="primary" size="sm" leftIcon={<UserPlus />} onClick={() => setCreateOpen(true)}>
                Register family
              </Button>
            ) : null,
          }}
        />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Family record"
        title={<span className="mono">{selected?.family_code}</span>}
        meta={
          selected && (
            <>
              <PriorityBadge priority={selected.priority} />
              <StatusBadge status={selected.status} />
            </>
          )
        }
        footer={
          selected && (
            <>
              {can('removeFamily') && (
                <Button variant="danger-soft" leftIcon={<Trash2 />} onClick={() => setRemoveOpen(true)}>
                  Remove family
                </Button>
              )}
              {can('admitFamily') && selected.status !== 'SHELTERED' && (
                <Button
                  variant="primary"
                  leftIcon={<DoorOpen />}
                  onClick={() => {
                    setAdmitFamily(selected);
                    setSelected(null);
                  }}
                >
                  Admit to shelter
                </Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <>
            <KeyValue
              items={[
                { label: 'District', value: selected.current_district },
                { label: 'Area', value: selected.current_area },
                {
                  label: 'Contact phone',
                  value: (
                    <a className="link" href={`tel:${selected.contact_phone}`}>
                      <Phone size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                      {selected.contact_phone}
                    </a>
                  ),
                },
                { label: 'Registered', value: formatDate(selected.registered_at) },
                { label: 'Registered at', value: formatDateTime(selected.registered_at), wide: true },
              ]}
            />
            <FamilyMembers key={selected.family_id} family={selected} canAdd={can('createFamily')} canRemove={can('removeFamily')} onChanged={refetch} />
            <div className="inline-alert" style={{ marginTop: 24 }}>
              <MapPin aria-hidden="true" />
              <span>
                {selected.status === 'SHELTERED'
                  ? 'This family is currently sheltered. Admissions are listed on the Admissions page.'
                  : 'This family still needs a shelter place. Admit them to a shelter with free capacity.'}
              </span>
            </div>
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={removeOpen && !!selected}
        onClose={() => setRemoveOpen(false)}
        onConfirm={removeFamily}
        loading={removing}
        tone="danger"
        title="Remove this family?"
        description={selected ? `${selected.family_code}, its members, admissions and medical requests will be permanently deleted. Any shelter places it holds will be released.` : ''}
        confirmLabel="Remove family"
      />

      <FamilyModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
      <AdmitModal open={!!admitFamily} family={admitFamily} onClose={() => setAdmitFamily(null)} onCreated={refetch} />
    </div>
  );
}

export default FamiliesPage;
