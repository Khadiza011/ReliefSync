import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ClipboardList,
  ClipboardPlus,
  HandHeart,
  House,
  PackagePlus,
  ScrollText,
  Siren,
  Truck,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ErrorState, StatSkeleton, Skeleton } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { BarList, ColumnChart, StackedBar } from '../../components/charts/Charts';
import {
  ActivityTimeline,
  DashboardHero,
  LowStockList,
  QuickActions,
  RequestQueue,
  SectionLink,
  ShelterOccupancy,
} from './Widgets';
import { auditToTimeline } from '../../utils/audit';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import {
  auditService,
  dashboardService,
  distributionService,
  donationService,
  inventoryService,
  loadAll,
  requestsService,
  sheltersService,
} from '../../services/api';
import { PRIORITY_META, ROLES } from '../../utils/constants';
import { countBy, dailySeries, formatNumber, percent, sumBy } from '../../utils/helpers';
import { notifyDataChanged } from '../../utils/events';

export function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [review, setReview] = useState(null); // { request, status }
  const [busy, setBusy] = useState(false);

  const { data, error, loading, refreshing, refetch } = useFetch(() =>
    loadAll({
      summary: dashboardService.getSummary,
      requests: requestsService.list,
      lowStock: inventoryService.lowStock,
      donations: donationService.list,
      audit: auditService.list,
      shelters: sheltersService.list,
      inventory: inventoryService.list,
      distributions: distributionService.list,
    })
  );

  const summary = data?.summary || {};
  const requests = useMemo(() => data?.requests || [], [data]);
  const shelters = data?.shelters || [];
  const inventory = useMemo(() => data?.inventory || [], [data]);
  const audit = useMemo(() => data?.audit || [], [data]);

  const pipeline = useMemo(() => {
    const c = countBy(requests, 'status');
    return [
      { label: 'Requested', value: c.REQUESTED || 0, color: 'var(--series-1)' },
      { label: 'Approved', value: c.APPROVED || 0, color: 'var(--series-2)' },
      { label: 'Partially delivered', value: c.PARTIALLY_DELIVERED || 0, color: 'var(--series-3)' },
      { label: 'Delivered', value: c.DELIVERED || 0, color: 'var(--series-4)' },
      { label: 'Closed', value: (c.CANCELLED || 0) + (c.REJECTED || 0), color: 'var(--series-5)' },
    ];
  }, [requests]);

  const priorityMix = useMemo(() => {
    const open = requests.filter((r) => ['REQUESTED', 'APPROVED', 'PARTIALLY_DELIVERED'].includes(r.status));
    const c = countBy(open, 'priority');
    return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => ({ label: PRIORITY_META[p].label, value: c[p] || 0, color: PRIORITY_META[p].color }));
  }, [requests]);

  const activity = useMemo(() => {
    const source = audit.length ? audit : requests;
    return dailySeries(source, audit.length ? 'created_at' : 'requested_at', 14);
  }, [audit, requests]);

  const stockByItem = useMemo(() => {
    const byItem = new Map();
    inventory.forEach((row) => {
      const key = row.item_name;
      const prev = byItem.get(key) || { label: key, value: 0, unit: row.unit };
      prev.value += Number(row.quantity) || 0;
      byItem.set(key, prev);
    });
    return [...byItem.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((d) => ({ ...d, sub: d.unit ? `Unit: ${d.unit}` : undefined }));
  }, [inventory]);

  const pending = requests.filter((r) => r.status === 'REQUESTED');
  const totalCapacity = sumBy(shelters, 'total_capacity');
  const occupied = sumBy(shelters, 'current_occupancy');

  const onConfirmReview = async () => {
    if (!review) return;
    setBusy(true);
    try {
      await requestsService.updateStatus(review.request.request_id, review.status);
      toast.success(
        review.status === 'APPROVED' ? 'Request approved' : 'Request cancelled',
        `${review.request.request_code} · ${review.request.shelter_name}`
      );
      setReview(null);
      notifyDataChanged();
      refetch();
    } catch (err) {
      toast.error('Could not update request', err.message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) {
    return (
      <Card>
        <ErrorState title="Command center unavailable" error={error} onRetry={refetch} />
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <DashboardHero
        user={user}
        role={ROLES.ADMIN}
        subtitle="Here's the live state of the relief operation across every shelter, warehouse and team."
        onRefresh={refetch}
        refreshing={refreshing}
        stats={
          data
            ? [
                { label: 'Bed occupancy', value: `${Math.round(percent(occupied, totalCapacity))}%` },
                { label: 'People sheltered', value: formatNumber(occupied) },
                { label: 'Open requests', value: formatNumber(requests.filter((r) => ['REQUESTED', 'APPROVED', 'PARTIALLY_DELIVERED'].includes(r.status)).length) },
              ]
            : []
        }
      />

      {loading && !data ? (
        <div className="stat-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <StatGrid>
          <StatCard label="Registered families" value={summary.total_families} icon={Users} hint="Across all districts" onClick={() => navigate('/families')} />
          <StatCard
            label="Shelters"
            value={summary.total_shelters}
            icon={House}
            tone="var(--success)"
            hint={`${formatNumber(summary.available_shelters)} with free capacity`}
            meter={percent(summary.available_shelters, summary.total_shelters)}
            onClick={() => navigate('/shelters')}
          />
          <StatCard
            label="Pending requests"
            value={summary.pending_requests}
            icon={ClipboardList}
            tone="var(--warning)"
            delta={summary.critical_requests ? `${summary.critical_requests} critical` : undefined}
            deltaTone={summary.critical_requests ? 'bad' : 'neutral'}
            hint={!summary.critical_requests ? 'No critical requests' : 'need a decision'}
            onClick={() => navigate('/requests')}
          />
          <StatCard
            label="Low-stock items"
            value={summary.low_stock_items}
            icon={Boxes}
            tone="var(--danger)"
            hint={`of ${formatNumber(summary.total_inventory_items)} stock lines`}
            meter={100 - percent(summary.low_stock_items, summary.total_inventory_items)}
            onClick={() => navigate('/inventory')}
          />
          <StatCard
            label="Donations"
            value={summary.total_donations}
            icon={HandHeart}
            tone="var(--violet)"
            hint={`${formatNumber(summary.pending_donations)} awaiting receipt`}
            onClick={() => navigate('/donations')}
          />
          <StatCard label="Distributions" value={summary.total_distributions} icon={Truck} tone="var(--info)" hint="Dispatched to shelters" onClick={() => navigate('/distributions')} />
          <StatCard label="Available volunteers" value={summary.active_volunteers} icon={UserCheck} tone="var(--role-volunteer)" hint="Ready for assignment" onClick={() => navigate('/volunteers')} />
          <StatCard
            label="Active users"
            value={summary.total_users}
            icon={Siren}
            tone="var(--cyan-300)"
            hint="Accounts with access"
            onClick={() => navigate('/users')}
          />
        </StatGrid>
      )}

      <div className="dash-grid">
        <Card className="span-8" delay={0.05}>
          <CardHeader
            icon={ScrollText}
            title="Operational activity"
            subtitle={audit.length ? 'Audit events per day · last 14 days' : 'Relief requests per day · last 14 days'}
            action={<SectionLink to="/audit-logs">Audit log</SectionLink>}
          />
          <CardBody className="chart-card-body">
            {loading && !data ? <Skeleton height={180} /> : <ColumnChart data={activity} valueLabel={audit.length ? 'events' : 'requests'} />}
          </CardBody>
        </Card>

        <Card className="span-4" delay={0.1}>
          <CardHeader icon={ClipboardList} title="Request pipeline" subtitle={`${formatNumber(requests.length)} requests all-time`} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={140} />
            ) : (
              <>
                <div className="donut-legend-total">
                  <strong className="tabular">{formatNumber(pending.length)}</strong>
                  <span>awaiting approval</span>
                </div>
                <StackedBar segments={pipeline} />
              </>
            )}
          </CardBody>
        </Card>

        <Card className="span-7" delay={0.12}>
          <CardHeader
            icon={ClipboardList}
            title="Approval queue"
            subtitle="Newest requests waiting for a decision"
            action={<SectionLink to="/requests" />}
          />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={220} />
            ) : (
              <RequestQueue requests={pending} canReview onReview={(request, status) => setReview({ request, status })} busyId={busy ? review?.request.request_id : null} />
            )}
          </CardBody>
        </Card>

        <Card className="span-5" delay={0.14}>
          <CardHeader icon={ScrollText} title="Recent activity" subtitle="Live audit trail" action={<SectionLink to="/audit-logs" />} />
          <CardBody>
            {loading && !data ? <Skeleton height={220} /> : <ActivityTimeline items={auditToTimeline(audit)} limit={6} />}
          </CardBody>
        </Card>

        <Card className="span-4" delay={0.16}>
          <CardHeader icon={House} title="Shelter occupancy" subtitle="Fullest shelters first" action={<SectionLink to="/shelters" />} />
          <CardBody>{loading && !data ? <Skeleton height={180} /> : <ShelterOccupancy shelters={shelters} limit={5} />}</CardBody>
        </Card>

        <Card className="span-4" delay={0.18}>
          <CardHeader icon={Boxes} title="Low-stock alerts" subtitle="At or below reorder level" action={<SectionLink to="/inventory" />} />
          <CardBody>{loading && !data ? <Skeleton height={180} /> : <LowStockList rows={data?.lowStock || []} limit={4} />}</CardBody>
        </Card>

        <Card className="span-4" delay={0.2}>
          <CardHeader icon={Siren} title="Open requests by priority" subtitle="Requested, approved or in delivery" />
          <CardBody>
            {loading && !data ? <Skeleton height={120} /> : <StackedBar segments={priorityMix} valueLabel="" />}
            <div style={{ marginTop: 24 }}>
              <div className="section-label">Stock on hand by item</div>
              {loading && !data ? <Skeleton height={120} /> : <BarList data={stockByItem} emptyLabel="No inventory recorded" />}
            </div>
          </CardBody>
        </Card>

        <Card className="span-12" delay={0.22}>
          <CardHeader title="Quick actions" subtitle="Jump straight into the most common tasks" />
          <CardBody>
            <QuickActions
              actions={[
                { label: 'Register family', description: 'Add an affected household', icon: UserPlus, to: '/families?new=1' },
                { label: 'New relief request', description: 'Request supplies for a shelter', icon: ClipboardPlus, to: '/requests?new=1', tone: 'var(--warning)' },
                { label: 'Add stock', description: 'Record supplies received', icon: PackagePlus, to: '/inventory?new=1', tone: 'var(--success)' },
                { label: 'Dispatch distribution', description: 'Deliver an approved request', icon: Truck, to: '/distributions?new=1', tone: 'var(--info)' },
                { label: 'Record donation', description: 'Log incoming supplies', icon: HandHeart, to: '/donations?new=1', tone: 'var(--violet)' },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={!!review}
        onClose={() => setReview(null)}
        onConfirm={onConfirmReview}
        loading={busy}
        tone={review?.status === 'CANCELLED' ? 'danger' : 'primary'}
        title={review?.status === 'APPROVED' ? 'Approve this request?' : 'Cancel this request?'}
        description={review ? `${review.request.request_code} · ${review.request.shelter_name}` : ''}
        confirmLabel={review?.status === 'APPROVED' ? 'Approve request' : 'Cancel request'}
      >
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          {review?.status === 'APPROVED'
            ? 'Approved requests become available for distribution. Your name is recorded as the approver.'
            : 'Cancelled requests are closed and cannot be distributed.'}
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default AdminDashboard;
