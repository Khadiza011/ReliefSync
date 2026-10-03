import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Building2, Crown, House, LayoutGrid, List, MapPin, Plus, Search, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatusBadge, Badge, PriorityBadge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { Segmented } from '../../components/ui/Segmented';
import { Input, Select } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { Meter, Ring } from '../../components/charts/Charts';
import { MiniStats } from './shared';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { useDebounce } from '../../hooks/useUi';
import { useToast } from '../../context/ToastContext';
import { sheltersService } from '../../services/api';
import { formatDate, formatNumber, percent, sumBy } from '../../utils/helpers';
import { humanize } from '../../utils/constants';
import { EASE } from '../../utils/motion';

const humanizeSafe = (value) => (value ? humanize(value) : '—');

function capacityStatus(s) {
  const occ = Number(s.current_occupancy) || 0;
  const cap = Number(s.total_capacity) || 0;
  if (s.operational_status && s.operational_status !== 'OPEN') return s.operational_status;
  if (cap > 0 && occ >= cap) return 'FULL';
  if (cap > 0 && occ >= cap * 0.8) return 'NEARLY_FULL';
  return 'AVAILABLE';
}

export function SheltersPage() {
  const [view, setView] = useState('grid');
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('all');
  const [type, setType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const debounced = useDebounce(query, 150);

  const { isAdmin } = useRole();
  const { data, error, loading, refetch } = useFetch(() => sheltersService.list());
  const shelters = useMemo(() => (data || []).map((s) => ({ ...s, capacity_status: capacityStatus(s) })), [data]);

  const districts = useMemo(() => [...new Set(shelters.map((s) => s.district).filter(Boolean))].sort(), [shelters]);
  const types = useMemo(() => [...new Set(shelters.map((s) => s.shelter_type).filter(Boolean))].sort(), [shelters]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return shelters.filter(
      (s) =>
        (district === 'all' || s.district === district) &&
        (type === 'all' || s.shelter_type === type) &&
        (!q || [s.shelter_name, s.shelter_code, s.district, s.upazila, s.address].some((v) => v && String(v).toLowerCase().includes(q)))
    );
  }, [shelters, district, type, debounced]);

  const capacity = sumBy(shelters, 'total_capacity');
  const occupied = sumBy(shelters, 'current_occupancy');

  const stats = [
    { label: 'Shelters', value: shelters.length, icon: House },
    { label: 'Total capacity', value: capacity, icon: BedDouble, tone: 'var(--info)' },
    { label: 'People sheltered', value: occupied, icon: Users, tone: 'var(--success)' },
    { label: 'Network occupancy', value: Math.round(percent(occupied, capacity)), suffix: '%', icon: Building2, tone: 'var(--warning)' },
  ];

  const columns = [
    {
      key: 'shelter_name',
      header: 'Shelter',
      render: (s) => (
        <div className="cell-primary">
          <span className="cell-primary__title">{s.shelter_name}</span>
          <span className="cell-primary__sub mono">{s.shelter_code}</span>
        </div>
      ),
    },
    {
      key: 'district',
      header: 'Location',
      render: (s) => (
        <div className="cell-primary">
          <span className="cell-primary__title">{s.district}</span>
          <span className="cell-primary__sub">{s.upazila || '—'}</span>
        </div>
      ),
    },
    { key: 'shelter_type', header: 'Type', render: (s) => <Badge tone="neutral" size="sm">{humanizeSafe(s.shelter_type)}</Badge> },
    {
      key: 'current_occupancy',
      header: 'Occupancy',
      sortValue: (s) => percent(s.current_occupancy, s.total_capacity),
      render: (s) => (
        <div style={{ minWidth: 180 }}>
          <Meter value={Number(s.current_occupancy) || 0} max={Number(s.total_capacity) || 1} size="sm" detail={`${formatNumber(s.current_occupancy || 0)} / ${formatNumber(s.total_capacity)}`} />
        </div>
      ),
    },
    { key: 'capacity_status', header: 'Status', render: (s) => <StatusBadge status={s.capacity_status} size="sm" /> },
  ];

  const filterControls = (
    <>
      <FilterSelect label="District" value={district} onChange={setDistrict} options={[{ value: 'all', label: 'All districts' }, ...districts.map((d) => ({ value: d, label: d }))]} />
      <FilterSelect label="Type" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...types.map((t) => ({ value: t, label: humanizeSafe(t) }))]} />
    </>
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations"
        eyebrowIcon={House}
        title="Shelters"
        description="Capacity and occupancy across the shelter network. Occupancy updates automatically when families are admitted."
        actions={
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            {isAdmin && (
              <Button variant="primary" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={() => setCreateOpen(true)}>
                Add shelter
              </Button>
            )}
            <Segmented
              ariaLabel="View"
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: 'Cards', icon: LayoutGrid },
                { value: 'table', label: 'Table', icon: List },
              ]}
            />
          </div>
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <Card delay={0.08}>
        {view === 'table' ? (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey="shelter_id"
            loading={loading}
            error={error}
            onRetry={refetch}
            searchKeys={['shelter_name', 'shelter_code', 'district', 'upazila']}
            searchPlaceholder="Search shelters…"
            filters={filterControls}
            onRowClick={setSelected}
            exportName="shelters"
            empty={{ icon: House, title: 'No shelters yet', description: 'Shelters added to the database appear here.' }}
          />
        ) : (
          <>
            <div className="table-toolbar">
              <div className="table-toolbar__search">
                <Input icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shelters…" aria-label="Search shelters" type="search" />
              </div>
              <div className="table-toolbar__filters">{filterControls}</div>
              <div className="table-toolbar__meta">
                <span className="tabular">{filtered.length} shelters</span>
              </div>
            </div>
            {loading && !data ? (
              <div className="shelter-grid">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={220} radius={16} />
                ))}
              </div>
            ) : error && !data ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : filtered.length === 0 ? (
              <EmptyState icon={House} title={shelters.length ? 'No matching shelters' : 'No shelters yet'} description="Try a different search or filter." />
            ) : (
              <div className="shelter-grid">
                {filtered.map((s, i) => {
                  const occ = Number(s.current_occupancy) || 0;
                  const cap = Number(s.total_capacity) || 0;
                  return (
                    <motion.button
                      type="button"
                      key={s.shelter_id}
                      className="shelter-card"
                      onClick={() => setSelected(s)}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: EASE, delay: i * 0.05 }}
                    >
                      <div className="shelter-card__head">
                        <div style={{ minWidth: 0 }}>
                          <div className="shelter-card__name">{s.shelter_name}</div>
                          <div className="shelter-card__loc">
                            <MapPin aria-hidden="true" />
                            {[s.upazila, s.district].filter(Boolean).join(', ')}
                          </div>
                        </div>
                        <StatusBadge status={s.capacity_status} size="sm" />
                      </div>
                      <div className="shelter-card__body">
                        <Ring value={occ} max={cap || 1} size={92} stroke={8} sublabel="full" />
                        <div className="shelter-card__facts">
                          <div>
                            <div className="fact__label">Occupied</div>
                            <div className="fact__value">{formatNumber(occ)}</div>
                          </div>
                          <div>
                            <div className="fact__label">Capacity</div>
                            <div className="fact__value">{formatNumber(cap)}</div>
                          </div>
                          <div>
                            <div className="fact__label">Free</div>
                            <div className="fact__value">{formatNumber(Math.max(0, cap - occ))}</div>
                          </div>
                          <div>
                            <div className="fact__label">Type</div>
                            <div className="fact__value" style={{ fontSize: 'var(--text-sm)' }}>{humanizeSafe(s.shelter_type)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="shelter-card__foot">
                        <span className="mono">{s.shelter_code}</span>
                        <span>{s.address || 'Address not set'}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Card>

      <ShelterDrawer shelter={selected} onClose={() => setSelected(null)} />
      <CreateShelterModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

function CreateShelterModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    shelter_name: '',
    shelter_type: 'COLLECTIVE',
    district: '',
    upazila: '',
    address: '',
    total_capacity: '',
  });

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const close = () => {
    if (saving) return;
    setForm({ shelter_name: '', shelter_type: 'COLLECTIVE', district: '', upazila: '', address: '', total_capacity: '' });
    onClose?.();
  };

  const submit = async (e) => {
    e.preventDefault();
    const capacity = Number(form.total_capacity);
    if (!form.shelter_name.trim() || !form.district.trim() || !Number.isInteger(capacity) || capacity < 1) {
      toast.error('Missing shelter details', 'Shelter name, district and a valid capacity are required.');
      return;
    }

    setSaving(true);
    try {
      const result = await sheltersService.create({
        ...form,
        shelter_name: form.shelter_name.trim(),
        district: form.district.trim(),
        upazila: form.upazila.trim(),
        address: form.address.trim(),
        total_capacity: capacity,
      });
      toast.success('Shelter added', `${result.shelter_code || 'New shelter'} is ready to use.`);
      setForm({ shelter_name: '', shelter_type: 'COLLECTIVE', district: '', upazila: '', address: '', total_capacity: '' });
      onCreated?.();
    } catch (err) {
      toast.error('Could not add shelter', err?.response?.data?.message || err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      as="form"
      onSubmit={submit}
      title="Add shelter"
      description="Create a new shelter. Its code is generated automatically and occupancy starts at zero."
      icon={House}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>Add shelter</Button>
        </>
      }
    >
      <div className="form-grid">
        <Input
          label="Shelter name"
          required
          value={form.shelter_name}
          onChange={setField('shelter_name')}
          placeholder="e.g. Feni Community Shelter"
          data-autofocus
        />
        <Select
          label="Shelter type"
          required
          value={form.shelter_type}
          onChange={setField('shelter_type')}
          options={[
            { value: 'COLLECTIVE', label: 'Collective' },
            { value: 'TEMPORARY', label: 'Temporary' },
            { value: 'TRANSITIONAL', label: 'Transitional' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
        <Input label="District" required value={form.district} onChange={setField('district')} placeholder="e.g. Feni" />
        <Input label="Upazila" value={form.upazila} onChange={setField('upazila')} placeholder="e.g. Feni Sadar" />
        <Input
          label="Total capacity"
          required
          type="number"
          min="1"
          step="1"
          value={form.total_capacity}
          onChange={setField('total_capacity')}
          placeholder="e.g. 300"
        />
        <Input label="Address" value={form.address} onChange={setField('address')} placeholder="School, road or building" />
      </div>
    </Modal>
  );
}

function ShelterDrawer({ shelter, onClose }) {
  const { isManager } = useRole();
  const { data: capacity, loading } = useFetch(() => (shelter ? sheltersService.capacity(shelter.shelter_id) : Promise.resolve(null)), [shelter?.shelter_id]);
  const occ = Number(capacity?.current_occupancy ?? shelter?.current_occupancy) || 0;
  const cap = Number(capacity?.total_capacity ?? shelter?.total_capacity) || 0;

  return (
    <Drawer
      open={!!shelter}
      onClose={onClose}
      eyebrow="Shelter"
      title={shelter?.shelter_name}
      meta={
        shelter && (
          <>
            <span className="code-chip">{shelter.shelter_code}</span>
            <StatusBadge status={capacity?.status || shelter.capacity_status} />
            {shelter.operational_status && <StatusBadge status={shelter.operational_status} />}
          </>
        )
      }
    >
      {shelter && (
        <>
          <div className="row" style={{ gap: 24 }}>
            <Ring value={occ} max={cap || 1} size={130} stroke={11} sublabel="occupied" />
            <div className="stack" style={{ gap: 10, flex: 1 }}>
              <div>
                <div className="fact__label">Live occupancy</div>
                <div className="fact__value" style={{ fontSize: 'var(--text-xl)' }}>
                  {loading ? '…' : `${formatNumber(occ)} / ${formatNumber(cap)}`}
                </div>
              </div>
              <div>
                <div className="fact__label">Free places</div>
                <div className="fact__value" style={{ fontSize: 'var(--text-xl)', color: 'var(--success)' }}>
                  {formatNumber(capacity?.available_space ?? Math.max(0, cap - occ))}
                </div>
              </div>
            </div>
          </div>
          <KeyValue
            items={[
              { label: 'District', value: shelter.district },
              { label: 'Upazila', value: shelter.upazila },
              { label: 'Type', value: humanizeSafe(shelter.shelter_type) },
              { label: 'Opened', value: formatDate(shelter.created_at) },
              ...(shelter.active_family_count != null ? [{ label: 'Active families', value: formatNumber(shelter.active_family_count) }] : []),
              { label: 'Address', value: shelter.address, wide: true },
            ]}
          />
          {isManager && <ShelterFamilies key={shelter.shelter_id} shelterId={shelter.shelter_id} />}
        </>
      )}
    </Drawer>
  );
}

/** Families currently admitted to a shelter, with their members. Hidden when the viewer may not see them. */
function ShelterFamilies({ shelterId }) {
  const { data, loading, error } = useFetch(() => sheltersService.families(shelterId), [shelterId]);
  if (error) return null;
  const families = data?.families || [];

  return (
    <div style={{ marginTop: 24 }}>
      <div className="row" style={{ gap: 8, alignItems: 'center', color: 'var(--text-1)', fontWeight: 600, marginBottom: 12 }}>
        <Users size={16} aria-hidden="true" />
        Families in this shelter
        <Badge tone="neutral" size="sm">{loading && !data ? '…' : families.length}</Badge>
      </div>
      {loading && !data ? (
        <Skeleton height={64} />
      ) : families.length === 0 ? (
        <p className="muted">No families are currently admitted to this shelter.</p>
      ) : (
        families.map((f) => (
          <div key={f.admission_id} style={{ padding: 12, border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)', marginBottom: 10 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontWeight: 600 }}>{f.family_code}</span>
              <span className="row" style={{ gap: 8, alignItems: 'center' }}>
                <PriorityBadge priority={f.priority} size="sm" />
                <Badge tone="neutral" size="sm">{formatNumber(f.admitted_member_count)} admitted</Badge>
              </span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {[f.current_area, f.current_district].filter(Boolean).join(', ') || '—'}
              {f.contact_phone ? ` · ${f.contact_phone}` : ''}
            </div>
            {f.members?.length > 0 && (
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                {f.members.map((m) => (
                  <span key={m.member_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
                    {Number(m.is_head) === 1 && <Crown size={12} style={{ color: 'var(--warning)' }} aria-hidden="true" />}
                    {m.full_name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default SheltersPage;
