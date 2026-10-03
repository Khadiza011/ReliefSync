import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, CalendarDays, CircleCheck, ClipboardList, House, Mail, MapPin, Phone, Sparkles, UserRound, Users } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Segmented';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, Skeleton, StatSkeleton } from '../../components/ui/Feedback';
import { BarList } from '../../components/charts/Charts';
import { ActivityTimeline, DashboardHero, SectionLink } from './Widgets';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { inventoryService, loadAll, volunteerService } from '../../services/api';
import { ROLES, ROLE_COLORS, stockState } from '../../utils/constants';
import { formatDate, formatNumber } from '../../utils/helpers';

export function VolunteerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, refreshing, refetch } = useFetch(() =>
    loadAll({
      me: volunteerService.me,
      inventory: inventoryService.list,
    })
  );

  const profile = data?.me?.volunteer;
  const skills = data?.me?.skills || [];
  const assignments = useMemo(() => data?.me?.assignments || [], [data]);
  const inventory = useMemo(() => data?.inventory || [], [data]);

  const active = assignments.filter((a) => a.status === 'ACTIVE');
  const completed = assignments.filter((a) => a.status === 'COMPLETED');
  const shelters = new Set(assignments.map((a) => a.shelter_id));
  const activeShelters = useMemo(() => {
    const unique = new Map();
    active.forEach((a) => {
      if (!unique.has(a.shelter_id)) unique.set(a.shelter_id, a);
    });
    return [...unique.values()];
  }, [active]);
  const peopleAtActiveShelters = activeShelters.reduce((sum, a) => sum + (Number(a.current_occupancy) || 0), 0);
  const lowLines = inventory.filter((r) => stockState(r.quantity, r.reorder_level) !== 'IN_STOCK');
  const currentShelter = active[0] || assignments[0] || null;

  const stockBars = useMemo(
    () =>
      [...inventory]
        .sort((a, b) => Number(b.quantity) - Number(a.quantity))
        .slice(0, 6)
        .map((r) => ({ label: `${r.item_name} · ${r.shelter_name}`, value: Number(r.quantity) || 0, sub: r.unit })),
    [inventory]
  );

  const timeline = assignments.map((a) => ({
    id: a.assignment_id,
    action: a.status === 'COMPLETED' ? 'COMPLETE' : 'CREATE',
    icon: a.status === 'COMPLETED' ? CircleCheck : ClipboardList,
    tone: a.status === 'COMPLETED' ? 'success' : a.status === 'CANCELLED' ? 'danger' : 'cyan',
    title: a.task_title,
    description: `${a.shelter_name}${a.task_description ? ` — ${a.task_description}` : ''}`,
    at: a.completed_at || a.assigned_at,
  }));

  if (error && !data) {
    return (
      <Card>
        <ErrorState title="Volunteer hub unavailable" error={error} onRetry={refetch} />
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <DashboardHero
        user={user}
        role={ROLES.VOLUNTEER}
        subtitle="Your assignments, the shelters you serve, and the supplies on site — all in one place."
        onRefresh={refetch}
        refreshing={refreshing}
      />

      {loading && !data ? (
        <div className="stat-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <StatGrid>
          <StatCard label="Active assignments" value={active.length} icon={ClipboardList} tone="var(--role-volunteer)" hint="Open task details" onClick={() => navigate('/volunteer/assignments?status=ACTIVE')} />
          <StatCard label="Completed tasks" value={completed.length} icon={CircleCheck} tone="var(--success)" hint="View completed work" onClick={() => navigate('/volunteer/assignments?status=COMPLETED')} />
          <StatCard label="Shelters served" value={shelters.size} icon={House} tone="var(--accent)" hint="View assignment history" onClick={() => navigate('/volunteer/assignments')} />
          <StatCard label="People at your shelters" value={peopleAtActiveShelters} icon={Users} tone="var(--accent)" hint="Current occupancy" onClick={() => navigate('/volunteer/assignments?status=ACTIVE')} />
          <StatCard label="Supplies to watch" value={lowLines.length} icon={Boxes} tone="var(--warning)" hint="Open shelter inventory" onClick={() => navigate('/inventory')} />
        </StatGrid>
      )}

      <div className="dash-grid">
        <Card className="span-4" delay={0.05}>
          <CardHeader icon={UserRound} title="Volunteer profile" />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={200} />
            ) : profile ? (
              <div className="stack">
                <div className="profile">
                  <Avatar name={profile.volunteer_name} tone={ROLE_COLORS[ROLES.VOLUNTEER]} size={56} />
                  <div>
                    <div className="profile__name">{profile.volunteer_name}</div>
                    <div className="profile__sub mono">{profile.volunteer_code}</div>
                  </div>
                </div>
                <div className="kv">
                  <div className="kv__item">
                    <div className="kv__label">Availability</div>
                    <div className="kv__value">
                      <StatusBadge status={profile.availability} size="sm" />
                    </div>
                  </div>
                  <div className="kv__item">
                    <div className="kv__label">Joined</div>
                    <div className="kv__value">{formatDate(profile.created_at)}</div>
                  </div>
                  <div className="kv__item kv__item--wide">
                    <div className="kv__label">
                      <House size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Assigned shelter
                    </div>
                    <div className="kv__value">{currentShelter?.shelter_name || 'Not assigned yet'}</div>
                  </div>
                  <div className="kv__item kv__item--wide">
                    <div className="kv__label">
                      <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Phone
                    </div>
                    <div className="kv__value">{profile.phone || '—'}</div>
                  </div>
                  <div className="kv__item kv__item--wide">
                    <div className="kv__label">
                      <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Email
                    </div>
                    <div className="kv__value">{profile.email || user?.email || '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="section-label">Skills</div>
                  {skills.length ? (
                    <div className="chips">
                      {skills.map((s) => (
                        <Badge key={s.skill_id} tone="cyan" icon={Sparkles}>
                          {s.skill_name || s.name || `Skill #${s.skill_id}`}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                      No skills recorded yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={UserRound}
                title="Profile not linked yet"
                description={`Ask an administrator to link a volunteer profile to ${user?.email || 'your account email'}. Your assignments will appear here automatically.`}
                compact
              />
            )}
          </CardBody>
        </Card>

        <Card className="span-8" delay={0.08}>
          <CardHeader icon={CalendarDays} title="Your assignments" subtitle="Newest first" action={<SectionLink to="/volunteer/assignments">View all</SectionLink>} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={220} />
            ) : (
              <ActivityTimeline items={timeline} limit={8} emptyText="When a relief manager assigns you a task, it will appear here." />
            )}
          </CardBody>
        </Card>

        <Card className="span-12" delay={0.1}>
          <CardHeader
            icon={Boxes}
            title="Supplies at your shelters"
            subtitle={inventory.length ? `${formatNumber(inventory.length)} stock lines at shelters you're actively assigned to` : 'Visible once you have an active assignment'}
            action={<SectionLink to="/inventory">Full inventory</SectionLink>}
          />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={180} />
            ) : inventory.length === 0 ? (
              <EmptyState icon={MapPin} title="No shelter inventory to show" description="Inventory appears for shelters where you hold an active assignment." compact />
            ) : (
              <BarList data={stockBars} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default VolunteerDashboard;
