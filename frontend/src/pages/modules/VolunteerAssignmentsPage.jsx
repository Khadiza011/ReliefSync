import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { CalendarDays, CheckCircle2, ClipboardList, House, MapPin, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton, StatSkeleton } from '../../components/ui/Feedback';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { volunteerService } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';

function AssignmentCard({ assignment, onComplete, completing }) {
  return (
    <Card animate={false} className="span-12">
      <CardHeader
        icon={ClipboardList}
        title={assignment.task_title || `Assignment #${assignment.assignment_id}`}
        subtitle={`${assignment.shelter_name || 'Shelter'}${assignment.district ? ` · ${assignment.district}` : ''}`}
        action={<StatusBadge status={assignment.status} size="sm" />}
      />
      <CardBody>
        <div className="stack">
          <p style={{ margin: 0, color: 'var(--text-2)', lineHeight: 1.7 }}>
            {assignment.task_description || 'No additional task description was provided.'}
          </p>

          <div className="kv">
            <div className="kv__item">
              <div className="kv__label">Assigned</div>
              <div className="kv__value">{formatDate(assignment.assigned_at)}</div>
            </div>
            <div className="kv__item">
              <div className="kv__label">Completed</div>
              <div className="kv__value">{assignment.completed_at ? formatDate(assignment.completed_at) : '—'}</div>
            </div>
            <div className="kv__item">
              <div className="kv__label">People at shelter</div>
              <div className="kv__value">{formatNumber(assignment.recorded_occupancy ?? assignment.current_occupancy ?? 0)}</div>
            </div>
            <div className="kv__item">
              <div className="kv__label">Shelter capacity</div>
              <div className="kv__value">{formatNumber(assignment.total_capacity || 0)}</div>
            </div>
          </div>

          <div className="row" style={{ flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Badge tone="cyan" icon={House}>{assignment.shelter_name || 'Shelter'}</Badge>
              {assignment.district && <Badge tone="neutral" icon={MapPin}>{assignment.district}</Badge>}
              <Badge tone="neutral" icon={Users}>{formatNumber(assignment.recorded_occupancy ?? assignment.current_occupancy ?? 0)} people</Badge>
            </div>

            {assignment.status === 'ACTIVE' && (
              <Button
                variant="success-soft"
                size="sm"
                leftIcon={<CheckCircle2 size={16} />}
                loading={completing}
                onClick={() => onComplete(assignment)}
              >
                Mark completed
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function PeopleModal({ open, onClose, loading, shelters, error }) {
  const totalFamilies = shelters.reduce((sum, entry) => sum + (entry.families?.length || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="People at your shelters"
      description="Currently admitted families and their recorded family members."
      icon={Users}
      size="lg"
    >
      {loading ? (
        <Skeleton height={320} />
      ) : error ? (
        <ErrorState title="Could not load shelter people" error={error} />
      ) : totalFamilies === 0 ? (
        <EmptyState
          icon={Users}
          title="No active admitted families"
          description="There are currently no active family admissions at your assigned shelter."
          compact
        />
      ) : (
        <div className="stack" style={{ gap: 18 }}>
          {shelters.map(({ shelter, families }) => (
            <div key={shelter.shelter_id} className="stack" style={{ gap: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>{shelter.shelter_name}</strong>
                  <div style={{ color: 'var(--text-3)', fontSize: '.9rem', marginTop: 3 }}>
                    {shelter.district || '—'} · {formatNumber(shelter.recorded_occupancy ?? shelter.current_occupancy ?? 0)} people in active admission records
                  </div>
                </div>
                <Badge tone="cyan" icon={House}>{families.length} families</Badge>
              </div>

              {families.map((family) => (
                <Card key={`${shelter.shelter_id}-${family.admission_id}`} animate={false}>
                  <CardBody>
                    <div className="stack" style={{ gap: 10 }}>
                      <div className="row" style={{ justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <strong>{family.family_code}</strong>
                          <div style={{ color: 'var(--text-3)', fontSize: '.88rem', marginTop: 3 }}>
                            Admitted {formatDate(family.admitted_at)} · {family.admitted_member_count} admitted
                          </div>
                        </div>
                        <StatusBadge status={family.priority} size="sm" />
                      </div>

                      <div className="kv">
                        <div className="kv__item">
                          <div className="kv__label">Area</div>
                          <div className="kv__value">{family.current_area || '—'}</div>
                        </div>
                        <div className="kv__item">
                          <div className="kv__label">Contact</div>
                          <div className="kv__value">{family.contact_phone || '—'}</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-2)', fontWeight: 600, marginBottom: 7 }}>
                          Family members ({family.members?.length || 0})
                        </div>
                        {family.members?.length ? (
                          <div className="stack" style={{ gap: 6 }}>
                            {family.members.map((member) => (
                              <div
                                key={member.member_id}
                                className="row"
                                style={{ justifyContent: 'space-between', gap: 10, padding: '8px 10px', border: '1px solid var(--border-2)', borderRadius: 10 }}
                              >
                                <span><strong>{member.full_name}</strong>{member.is_head ? ' · Head' : ''}</span>
                                <span style={{ color: 'var(--text-3)', fontSize: '.88rem' }}>
                                  {[member.relationship_to_head, member.sex, member.age_years != null ? `${member.age_years} yrs` : null].filter(Boolean).join(' · ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-3)', fontSize: '.9rem' }}>No member records have been added yet.</div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function VolunteerAssignmentsPage() {
  const [searchParams] = useSearchParams();
  const requestedStatus = (searchParams.get('status') || '').toUpperCase();
  const { data, error, loading, refetch } = useFetch(volunteerService.me);
  const toast = useToast();

  const [completingId, setCompletingId] = useState(null);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleData, setPeopleData] = useState([]);
  const [peopleError, setPeopleError] = useState(null);

  const assignments = useMemo(() => data?.assignments || [], [data]);
  const active = assignments.filter((a) => a.status === 'ACTIVE');
  const completed = assignments.filter((a) => a.status === 'COMPLETED');

  const activeShelters = useMemo(() => {
    const unique = new Map();
    active.forEach((a) => {
      if (!unique.has(a.shelter_id)) unique.set(a.shelter_id, a);
    });
    return [...unique.values()];
  }, [active]);

  const peopleAtActiveShelters = activeShelters.reduce((sum, a) => sum + (Number(a.recorded_occupancy) || 0), 0);

  const visible = requestedStatus
    ? assignments.filter((a) => a.status === requestedStatus)
    : assignments;

  const handleComplete = async (assignment) => {
    if (!window.confirm(`Mark “${assignment.task_title}” as completed?`)) return;

    setCompletingId(assignment.assignment_id);
    try {
      await volunteerService.completeAssignment(assignment.assignment_id);
      toast.success('Assignment completed', 'Your task history and availability were updated.');
      await refetch();
    } catch (err) {
      toast.error('Could not complete assignment', err.message);
    } finally {
      setCompletingId(null);
    }
  };

  const openPeople = async () => {
    setPeopleOpen(true);
    setPeopleError(null);

    if (!activeShelters.length) {
      setPeopleData([]);
      return;
    }

    setPeopleLoading(true);
    try {
      const results = await Promise.all(activeShelters.map((s) => volunteerService.shelterPeople(s.shelter_id)));
      setPeopleData(results);
    } catch (err) {
      setPeopleError(err);
    } finally {
      setPeopleLoading(false);
    }
  };

  if (error && !data) {
    return (
      <Card>
        <ErrorState title="Assignments unavailable" error={error} onRetry={refetch} />
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Volunteer" eyebrowIcon={ClipboardList} title="My assignments" description="Task details, assigned shelters, and the current number of people at those shelters." />

      {loading && !data ? (
        <div className="stat-grid">
          {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <StatGrid>
          <StatCard label="Active assignments" value={active.length} icon={ClipboardList} tone="var(--role-volunteer)" hint="Tasks in progress" />
          <StatCard label="Completed tasks" value={completed.length} icon={CheckCircle2} tone="var(--success)" hint="Finished assignments" />
          <StatCard label="Active shelters" value={activeShelters.length} icon={House} tone="var(--accent)" hint="Shelters you currently serve" />
          <StatCard
            label="People at your shelters"
            value={peopleAtActiveShelters}
            icon={Users}
            tone="var(--warning)"
            hint={activeShelters.length ? 'Click to view families & members' : 'No active shelter assignment'}
            onClick={openPeople}
          />
        </StatGrid>
      )}

      <Card>
        <CardHeader
          icon={CalendarDays}
          title={requestedStatus ? `${requestedStatus.toLowerCase()} assignments` : 'Assignment history'}
          subtitle={`${formatNumber(visible.length)} assignment${visible.length === 1 ? '' : 's'}`}
        />
        <CardBody>
          {loading && !data ? (
            <Skeleton height={260} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments to show"
              description={requestedStatus ? `You do not have any ${requestedStatus.toLowerCase()} assignments.` : 'Your assigned tasks will appear here.'}
              compact
            />
          ) : (
            <div className="dash-grid">
              {visible.map((assignment) => (
                <AssignmentCard
                  key={assignment.assignment_id}
                  assignment={assignment}
                  onComplete={handleComplete}
                  completing={completingId === assignment.assignment_id}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <PeopleModal
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        loading={peopleLoading}
        shelters={peopleData}
        error={peopleError}
      />
    </div>
  );
}
