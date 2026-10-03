import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { House, MapPin, Users, ClipboardList } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { useFetch } from '../../hooks/useFetch';
import { volunteerService } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';

export default function VolunteerShelterPage() {
  const { data, error, loading, refetch } = useFetch(volunteerService.me);
  const [people, setPeople] = useState(null);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState(null);

  const assignments = useMemo(() => data?.assignments || [], [data]);
  const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');
  const current = activeAssignments[0] || assignments[0] || null;

  const loadPeople = async () => {
    if (!current?.shelter_id) return;
    setPeopleLoading(true);
    setPeopleError(null);
    try {
      setPeople(await volunteerService.shelterPeople(current.shelter_id));
    } catch (err) {
      setPeopleError(err);
    } finally {
      setPeopleLoading(false);
    }
  };

  if (error && !data) return <Card><ErrorState title="Shelter unavailable" error={error} onRetry={refetch} /></Card>;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Volunteer" eyebrowIcon={House} title="My shelter" description="Your assigned shelter, active tasks, and currently admitted families." />

      {loading && !data ? <Skeleton height={260} /> : !current ? (
        <Card><EmptyState icon={House} title="No shelter assigned yet" description="Your shelter will appear here after an administrator assigns you a task." /></Card>
      ) : (
        <>
          <Card>
            <CardHeader icon={House} title={current.shelter_name} subtitle={current.district || '—'} action={<StatusBadge status={current.status} size="sm" />} />
            <CardBody>
              <div className="kv">
                <div className="kv__item"><div className="kv__label">District</div><div className="kv__value">{current.district || '—'}</div></div>
                <div className="kv__item"><div className="kv__label">Recorded admitted people</div><div className="kv__value">{formatNumber(current.recorded_occupancy || 0)}</div></div>
                <div className="kv__item"><div className="kv__label">Active families</div><div className="kv__value">{formatNumber(current.active_family_count || 0)}</div></div>
                <div className="kv__item"><div className="kv__label">Shelter capacity</div><div className="kv__value">{formatNumber(current.total_capacity || 0)}</div></div>
              </div>
              <div style={{ marginTop: 14 }}>
                <Button onClick={loadPeople} loading={peopleLoading}>View admitted families</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={ClipboardList} title="My tasks at this shelter" subtitle={`${activeAssignments.filter(a => a.shelter_id === current.shelter_id).length} active`} />
            <CardBody>
              <div className="stack">
                {assignments.filter(a => a.shelter_id === current.shelter_id).map(a => (
                  <div key={a.assignment_id} className="row" style={{ justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border-2)' }}>
                    <div><strong>{a.task_title}</strong><div style={{ color:'var(--text-3)', marginTop:3 }}>{a.task_description || 'No description'} · {formatDate(a.assigned_at)}</div></div>
                    <StatusBadge status={a.status} size="sm" />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {peopleError && <Card><ErrorState title="Could not load admitted families" error={peopleError} /></Card>}
          {people && (
            <Card>
              <CardHeader icon={Users} title="Currently admitted families" subtitle={`${people.families?.length || 0} unique active families`} />
              <CardBody>
                {people.families?.length ? <div className="stack">
                  {people.families.map(f => (
                    <div key={f.family_id} style={{ padding:'12px', border:'1px solid var(--border-2)', borderRadius:12 }}>
                      <div className="row" style={{ justifyContent:'space-between', gap:10 }}><strong>{f.family_code}</strong><Badge tone="cyan">{f.admitted_member_count} admitted</Badge></div>
                      <div style={{ color:'var(--text-3)', marginTop:5 }}><MapPin size={13} style={{ display:'inline', marginRight:4 }} />{f.current_area || '—'} · {f.contact_phone || '—'}</div>
                      <div style={{ marginTop:9, color:'var(--text-2)' }}>{(f.members || []).map(m => m.full_name).join(', ') || 'No member records yet'}</div>
                    </div>
                  ))}
                </div> : <EmptyState icon={Users} title="No active families" description="There are no unique active family admissions for this shelter." compact />}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
