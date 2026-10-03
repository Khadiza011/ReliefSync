import { useMemo, useState } from 'react';
import { Activity, CalendarDays, List, ScrollText, ShieldCheck, Users, Waypoints } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { Segmented } from '../../components/ui/Segmented';
import { Skeleton } from '../../components/ui/Feedback';
import { BarList, ColumnChart } from '../../components/charts/Charts';
import { ActivityTimeline } from '../dashboards/Widgets';
import { actionTone, auditToTimeline } from '../../utils/audit';
import { MiniStats } from './shared';
import { InventoryTransactionsCard } from './InventoryTransactionsCard';
import { useFetch } from '../../hooks/useFetch';
import { auditService } from '../../services/api';
import { countBy, dailySeries, formatDateTime, formatRelativeTime, truncate } from '../../utils/helpers';

export function AuditLogsPage() {
  const [view, setView] = useState('table');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [selected, setSelected] = useState(null);

  const { data, error, loading, refetch } = useFetch(() => auditService.list());
  const logs = useMemo(() => data || [], [data]);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action_type).filter(Boolean))].sort(), [logs]);
  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity_type).filter(Boolean))].sort(), [logs]);
  const rows = logs.filter((l) => (action === 'all' || l.action_type === action) && (entity === 'all' || l.entity_type === entity));

  const today = new Date().toDateString();
  const series = useMemo(() => dailySeries(logs, 'created_at', 14), [logs]);
  const byEntity = useMemo(
    () =>
      Object.entries(countBy(logs, 'entity_type'))
        .map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [logs]
  );

  const stats = [
    { label: 'Events recorded', value: logs.length, icon: ScrollText },
    { label: 'Today', value: logs.filter((l) => new Date(l.created_at).toDateString() === today).length, icon: CalendarDays, tone: 'var(--info)' },
    { label: 'Distinct users', value: new Set(logs.map((l) => l.user_id).filter(Boolean)).size, icon: Users, tone: 'var(--violet)' },
    { label: 'Entity types', value: entities.length, icon: Waypoints, tone: 'var(--success)' },
  ];

  const columns = [
    { key: 'created_at', header: 'Time', render: (l) => <span title={formatDateTime(l.created_at)} className="tabular">{formatDateTime(l.created_at)}</span> },
    { key: 'email', header: 'User', render: (l) => l.email || <span className="muted">{l.user_id ? `User #${l.user_id}` : 'System'}</span> },
    { key: 'action_type', header: 'Action', render: (l) => <Badge tone={actionTone(l.action_type)} size="sm">{l.action_type}</Badge> },
    {
      key: 'entity_type',
      header: 'Entity',
      render: (l) => (
        <span className="mono" style={{ color: 'var(--text-1)' }}>
          {l.entity_type}
          {l.entity_id ? <span className="muted">#{l.entity_id}</span> : null}
        </span>
      ),
    },
    { key: 'description', header: 'Description', sortable: false, render: (l) => <span className="truncate" style={{ display: 'inline-block', maxWidth: 320 }}>{truncate(l.description, 70) || '—'}</span> },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Oversight"
        eyebrowIcon={ShieldCheck}
        title="Audit logs"
        description="An immutable trail of who changed what, and when — captured by database triggers and the API."
        actions={
          <Segmented
            ariaLabel="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'table', label: 'Table', icon: List },
              { value: 'timeline', label: 'Timeline', icon: Activity },
            ]}
          />
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <div className="dash-grid">
        <Card className="span-8" delay={0.05}>
          <CardHeader icon={Activity} title="Event volume" subtitle="Audit events per day · last 14 days" />
          <CardBody>{loading && !data ? <Skeleton height={180} /> : <ColumnChart data={series} valueLabel="events" />}</CardBody>
        </Card>
        <Card className="span-4" delay={0.08}>
          <CardHeader icon={Waypoints} title="Most changed entities" />
          <CardBody>{loading && !data ? <Skeleton height={180} /> : <BarList data={byEntity} emptyLabel="No events yet" />}</CardBody>
        </Card>
      </div>

      <Card delay={0.1}>
        {view === 'table' ? (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey="audit_id"
            loading={loading}
            error={error}
            onRetry={refetch}
            searchKeys={['email', 'action_type', 'entity_type', 'description', 'entity_id']}
            searchPlaceholder="Search user, action, entity…"
            pageSize={15}
            onRowClick={setSelected}
            exportName="audit-logs"
            filters={
              <>
                <FilterSelect label="Action" value={action} onChange={setAction} options={[{ value: 'all', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: a }))]} />
                <FilterSelect label="Entity" value={entity} onChange={setEntity} options={[{ value: 'all', label: 'All entities' }, ...entities.map((e) => ({ value: e, label: e }))]} />
              </>
            }
            empty={{ icon: ScrollText, title: 'No audit events yet', description: 'Changes to requests, inventory and other records will be logged here.' }}
          />
        ) : (
          <>
            <CardHeader title="Timeline" subtitle={`${rows.length} events · newest first`} />
            <CardBody>
              {loading && !data ? <Skeleton height={300} /> : <ActivityTimeline items={auditToTimeline(rows)} limit={40} />}
            </CardBody>
          </>
        )}
      </Card>

      <InventoryTransactionsCard />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Audit event"
        title={selected ? `#${selected.audit_id}` : ''}
        meta={selected && <Badge tone={actionTone(selected.action_type)}>{selected.action_type}</Badge>}
      >
        {selected && (
          <KeyValue
            items={[
              { label: 'User', value: selected.email || (selected.user_id ? `User #${selected.user_id}` : 'System'), wide: true },
              { label: 'Entity', value: <span className="mono">{selected.entity_type}</span> },
              { label: 'Entity ID', value: selected.entity_id ?? '—' },
              { label: 'When', value: formatDateTime(selected.created_at) },
              { label: 'Relative', value: formatRelativeTime(selected.created_at) },
              { label: 'Description', value: selected.description || '—', wide: true },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}

export default AuditLogsPage;
