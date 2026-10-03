import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, ClipboardList, ClipboardPlus, DoorOpen, House, MapPin, PackagePlus, Truck, UserPlus, Users } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, Skeleton, StatSkeleton } from '../../components/ui/Feedback';
import { Ring } from '../../components/charts/Charts';
import { ActivityTimeline, DashboardHero, LowStockList, QuickActions, SectionLink, ShelterOccupancy } from './Widgets';
import { AdmitModal } from '../modules/forms';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import {
  admissionsService,
  dashboardService,
  distributionService,
  familiesService,
  inventoryService,
  loadAll,
  requestsService,
  sheltersService,
} from '../../services/api';
import { ROLES } from '../../utils/constants';
import { formatNumber, formatRelativeTime } from '../../utils/helpers';

export function ShelterManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admitOpen, setAdmitOpen] = useState(false);

  const { data, error, loading, refreshing, refetch } = useFetch(() =>
    loadAll({
      summary: dashboardService.getSummary,
      families: familiesService.list,
      shelters: sheltersService.mine,
      requests: requestsService.list,
      lowStock: inventoryService.lowStock,
      distributions: distributionService.list,
      admissions: admissionsService.list,
    })
  );

  const families = useMemo(() => data?.families || [], [data]);
  const shelters = useMemo(() => data?.shelters || [], [data]);
  const requests = useMemo(() => data?.requests || [], [data]);
  const admissions = useMemo(() => data?.admissions || [], [data]);

  // /shelters/mine returns only the shelters this manager is assigned to
  const myShelters = shelters;
  const myShelterIds = useMemo(() => new Set(shelters.map((s) => s.shelter_id)), [shelters]);
  const focus = myShelters[0];

  // Requests and inventory are already scoped to the manager's shelters by the API
  const relevantRequests = requests;
  const openRequests = relevantRequests.filter((r) => ['REQUESTED', 'APPROVED', 'PARTIALLY_DELIVERED'].includes(r.status));
  const needsShelter = families.filter((f) => f.status === 'NEEDS_SHELTER' || f.status === 'WAITING_FOR_SHELTER');
  const myLowStock = (data?.lowStock || []).filter((r) => myShelterIds.has(r.shelter_id));

  const timeline = useMemo(() => {
    const items = [
      ...admissions.map((a) => ({
        id: `a-${a.admission_id}`,
        action: 'CREATE',
        icon: DoorOpen,
        tone: 'success',
        title: `${a.family_code || `Family #${a.family_id}`} admitted`,
        description: `${a.admitted_member_count} member(s) → ${a.shelter_name}`,
        at: a.admitted_at,
        actor: a.admitted_by_name,
      })),
      ...families.map((f) => ({
        id: `f-${f.family_id}`,
        action: 'CREATE',
        icon: UserPlus,
        title: `${f.family_code} registered`,
        description: `${f.current_area ? `${f.current_area}, ` : ''}${f.current_district} · ${f.priority?.toLowerCase()} priority`,
        at: f.registered_at,
      })),
    ];
    return items.filter((i) => i.at).sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [admissions, families]);

  if (error && !data) {
    return (
      <Card>
        <ErrorState title="Shelter workspace unavailable" error={error} onRetry={refetch} />
      </Card>
    );
  }

  const occupancy = focus ? Number(focus.current_occupancy) || 0 : 0;
  const capacity = focus ? Number(focus.total_capacity) || 0 : 0;

  return (
    <div className="page-stack">
      <DashboardHero
        user={user}
        role={ROLES.SHELTER_MANAGER}
        subtitle={
          focus
            ? `You're managing ${focus.shelter_name}${myShelters.length > 1 ? ` and ${myShelters.length - 1} more` : ''}. Keep families safe and supplies stocked.`
            : 'Register families, admit them to shelters, and request the supplies your shelter needs.'
        }
        onRefresh={refetch}
        refreshing={refreshing}
        actions={
          <>
            <Button variant="secondary" leftIcon={<UserPlus />} to="/shelter-manager/families/register">
              Register family
            </Button>
            <Button variant="primary" leftIcon={<ClipboardPlus />} to="/shelter-manager/requests/create">
              New request
            </Button>
          </>
        }
      />

      {loading && !data ? (
        <div className="stat-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <StatGrid>
          <StatCard label="Registered families" value={families.length} icon={Users} hint="In the relief registry" onClick={() => navigate('/families')} />
          <StatCard
            label="Need shelter"
            value={needsShelter.length}
            icon={House}
            tone="var(--danger)"
            hint="Waiting for a place"
            delta={needsShelter.length ? 'Admit now' : undefined}
            deltaTone="warn"
            onClick={() => setAdmitOpen(true)}
          />
          <StatCard label="Open requests" value={openRequests.length} icon={ClipboardList} tone="var(--warning)" hint="Requested, approved or in delivery" onClick={() => navigate('/requests')} />
          <StatCard label="Low-stock items" value={myLowStock.length} icon={Boxes} tone="var(--serious)" hint="Restock before running out" onClick={() => navigate('/shelter-manager/inventory')} />
        </StatGrid>
      )}

      <div className="dash-grid">
        <Card className="span-4" delay={0.05}>
          <CardHeader icon={House} title={focus ? 'Your shelter' : 'Shelter capacity'} subtitle={focus ? focus.shelter_code : 'Across the network'} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={200} />
            ) : focus ? (
              <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
                <Ring value={occupancy} max={capacity || 1} size={150} stroke={12} sublabel="occupied" />
                <div>
                  <div className="profile__name">{focus.shelter_name}</div>
                  <div className="profile__sub" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <MapPin size={14} aria-hidden="true" /> {[focus.upazila, focus.district].filter(Boolean).join(', ')}
                  </div>
                </div>
                <div className="kv" style={{ width: '100%' }}>
                  <div className="kv__item">
                    <div className="kv__label">Occupied</div>
                    <div className="kv__value tabular">{formatNumber(occupancy)}</div>
                  </div>
                  <div className="kv__item">
                    <div className="kv__label">Free places</div>
                    <div className="kv__value tabular">{formatNumber(Math.max(0, capacity - occupancy))}</div>
                  </div>
                </div>
              </div>
            ) : (
              <ShelterOccupancy shelters={shelters} limit={4} />
            )}
          </CardBody>
        </Card>

        <Card className="span-8" delay={0.08}>
          <CardHeader icon={ClipboardList} title="Your relief requests" subtitle="Track supplies you've asked for" action={<SectionLink to="/requests" />} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={220} />
            ) : relevantRequests.length === 0 ? (
              <EmptyState
                icon={ClipboardPlus}
                title="No requests yet"
                description="Request supplies when your shelter runs low."
                action={
                  <Button variant="primary" size="sm" to="/shelter-manager/requests/create" leftIcon={<ClipboardPlus />}>
                    Create request
                  </Button>
                }
                compact
              />
            ) : (
              <ul className="queue">
                {relevantRequests.slice(0, 5).map((r) => (
                  <li key={r.request_id} className="queue__item">
                    <div className="queue__main">
                      <div className="queue__top">
                        <span className="code-chip">{r.request_code}</span>
                        <PriorityBadge priority={r.priority} size="sm" />
                        <StatusBadge status={r.status} size="sm" />
                      </div>
                      <div className="queue__title">{r.shelter_name}</div>
                      <div className="queue__sub">
                        Requested {formatRelativeTime(r.requested_at)}
                        {r.notes ? ` · ${r.notes}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="span-5" delay={0.1}>
          <CardHeader icon={Users} title="Families needing shelter" subtitle="Highest priority first" action={<SectionLink to="/families" />} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={200} />
            ) : needsShelter.length === 0 ? (
              <EmptyState icon={House} tone="success" title="Everyone is sheltered" description="No registered family is waiting for a place." compact />
            ) : (
              <ul className="queue">
                {[...needsShelter]
                  .sort((a, b) => ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].indexOf(a.priority) - ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].indexOf(b.priority))
                  .slice(0, 4)
                  .map((f) => (
                    <li key={f.family_id} className={`queue__item${f.priority === 'CRITICAL' ? ' is-critical' : ''}`}>
                      <div className="queue__main">
                        <div className="queue__top">
                          <span className="code-chip">{f.family_code}</span>
                          <PriorityBadge priority={f.priority} size="sm" />
                        </div>
                        <div className="queue__sub" style={{ marginTop: 8 }}>
                          {[f.current_area, f.current_district].filter(Boolean).join(', ')} · {f.contact_phone}
                        </div>
                      </div>
                      <div className="queue__actions">
                        <Button variant="outline" size="sm" leftIcon={<DoorOpen />} onClick={() => setAdmitOpen(true)}>
                          Admit
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="span-4" delay={0.12}>
          <CardHeader icon={Boxes} title="Low-stock alerts" action={<SectionLink to="/shelter-manager/inventory" />} />
          <CardBody>{loading && !data ? <Skeleton height={200} /> : <LowStockList rows={myLowStock} limit={3} />}</CardBody>
        </Card>

        <Card className="span-3" delay={0.14}>
          <CardHeader title="Recent activity" />
          <CardBody>{loading && !data ? <Skeleton height={200} /> : <ActivityTimeline items={timeline} limit={4} />}</CardBody>
        </Card>

        <Card className="span-12" delay={0.16}>
          <CardHeader title="Quick actions" />
          <CardBody>
            <QuickActions
              actions={[
                { label: 'Register family', description: 'Add a new household', icon: UserPlus, to: '/shelter-manager/families/register' },
                { label: 'Admit family', description: 'Check a family into a shelter', icon: DoorOpen, onClick: () => setAdmitOpen(true), tone: 'var(--success)' },
                { label: 'Request supplies', description: 'Raise a relief request', icon: ClipboardPlus, to: '/shelter-manager/requests/create', tone: 'var(--warning)' },
                { label: 'Shelter inventory', description: 'Stock on hand', icon: PackagePlus, to: '/shelter-manager/inventory', tone: 'var(--info)' },
                { label: 'Distributions', description: 'Deliveries to your shelter', icon: Truck, to: '/shelter-manager/distributions', tone: 'var(--violet)' },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <AdmitModal open={admitOpen} onClose={() => setAdmitOpen(false)} onCreated={refetch} families={needsShelter.length ? needsShelter : families} />
    </div>
  );
}

export default ShelterManagerDashboard;
