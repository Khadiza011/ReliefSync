import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, ClipboardCheck, ClipboardList, HandHeart, PackageCheck, PackagePlus, Siren, Truck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, Skeleton, StatSkeleton } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ColumnChart, StackedBar } from '../../components/charts/Charts';
import { ActivityTimeline, DashboardHero, LowStockList, QuickActions, RequestQueue, SectionLink } from './Widgets';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { dashboardService, distributionService, donationService, inventoryService, loadAll, requestsService } from '../../services/api';
import { ROLES } from '../../utils/constants';
import { countBy, dailySeries, formatNumber, formatRelativeTime } from '../../utils/helpers';
import { notifyDataChanged } from '../../utils/events';

export function ReliefManagerDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, error, loading, refreshing, refetch } = useFetch(() =>
    loadAll({
      summary: dashboardService.getSummary,
      requests: requestsService.list,
      lowStock: inventoryService.lowStock,
      donations: donationService.list,
      distributions: distributionService.list,
    })
  );

  const summary = data?.summary || {};
  const requests = useMemo(() => data?.requests || [], [data]);
  const donations = useMemo(() => data?.donations || [], [data]);
  const distributions = useMemo(() => data?.distributions || [], [data]);

  const pending = requests.filter((r) => r.status === 'REQUESTED');
  const approved = requests.filter((r) => r.status === 'APPROVED' || r.status === 'PARTIALLY_DELIVERED');
  const pendingDonations = donations.filter((d) => d.status === 'PENDING');

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

  const dispatchSeries = useMemo(() => dailySeries(distributions, 'distributed_at', 14), [distributions]);

  const timeline = useMemo(() => {
    const items = [
      ...requests.map((r) => ({
        id: `r-${r.request_id}`,
        action: r.status === 'APPROVED' ? 'APPROVE' : r.status === 'CANCELLED' ? 'CANCEL' : 'CREATE',
        title: `${r.request_code} · ${r.status === 'REQUESTED' ? 'requested' : r.status.toLowerCase().replace(/_/g, ' ')}`,
        description: `${r.shelter_name}${r.notes ? ` — ${r.notes}` : ''}`,
        at: r.approved_at || r.requested_at,
      })),
      ...distributions.map((d) => ({
        id: `d-${d.distribution_id}`,
        action: 'DISTRIBUTE',
        icon: Truck,
        tone: 'violet',
        title: `${d.distribution_code} dispatched`,
        description: `${d.shelter_name} · request ${d.request_code}`,
        at: d.distributed_at,
        actor: d.distributed_by_name,
      })),
    ];
    return items.filter((i) => i.at).sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [requests, distributions]);

  const onConfirmReview = async () => {
    setBusy(true);
    try {
      await requestsService.updateStatus(review.request.request_id, review.status);
      toast.success(review.status === 'APPROVED' ? 'Request approved' : 'Request cancelled', review.request.request_code);
      setReview(null);
      notifyDataChanged();
      refetch();
    } catch (err) {
      toast.error('Could not update request', err.message);
    } finally {
      setBusy(false);
    }
  };

  const onConfirmReceive = async () => {
    setBusy(true);
    try {
      await donationService.receive(receiving.donation_id);
      toast.success('Donation received', `${receiving.donation_code} added to ${receiving.shelter_name} inventory.`);
      setReceiving(null);
      notifyDataChanged();
      refetch();
    } catch (err) {
      toast.error('Could not receive donation', err.message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) {
    return (
      <Card>
        <ErrorState title="Relief operations unavailable" error={error} onRetry={refetch} />
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <DashboardHero
        user={user}
        role={ROLES.RELIEF_MANAGER}
        subtitle="Approve incoming needs, dispatch supplies, and keep donations flowing into inventory."
        onRefresh={refetch}
        refreshing={refreshing}
        actions={
          <Button variant="primary" leftIcon={<Truck />} to="/distributions?new=1">
            Dispatch distribution
          </Button>
        }
        stats={
          data
            ? [
                { label: 'Awaiting decision', value: formatNumber(pending.length) },
                { label: 'Ready to dispatch', value: formatNumber(approved.length) },
                { label: 'Donations to receive', value: formatNumber(pendingDonations.length) },
              ]
            : []
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
          <StatCard label="Pending approvals" value={pending.length} icon={ClipboardList} tone="var(--warning)" hint="Requests in your queue" onClick={() => navigate('/requests')} />
          <StatCard
            label="Critical open"
            value={summary.critical_requests}
            icon={Siren}
            tone="var(--danger)"
            delta={summary.critical_requests ? 'Act first' : undefined}
            deltaTone="bad"
            hint={summary.critical_requests ? 'highest priority' : 'Nothing critical'}
          />
          <StatCard label="Ready to dispatch" value={approved.length} icon={ClipboardCheck} tone="var(--success)" hint="Approved, not yet delivered" onClick={() => navigate('/distributions?new=1')} />
          <StatCard label="Low-stock items" value={summary.low_stock_items} icon={Boxes} tone="var(--danger)" hint="At or below reorder level" onClick={() => navigate('/inventory')} />
        </StatGrid>
      )}

      <div className="dash-grid">
        <Card className="span-7" delay={0.05}>
          <CardHeader icon={ClipboardList} title="Approval queue" subtitle="Approve or cancel incoming relief requests" action={<SectionLink to="/requests" />} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={260} />
            ) : (
              <RequestQueue requests={pending} canReview onReview={(request, status) => setReview({ request, status })} busyId={busy ? review?.request.request_id : null} limit={5} />
            )}
          </CardBody>
        </Card>

        <Card className="span-5" delay={0.08}>
          <CardHeader icon={ClipboardList} title="Request pipeline" subtitle={`${formatNumber(requests.length)} requests in total`} />
          <CardBody>
            {loading && !data ? <Skeleton height={160} /> : <StackedBar segments={pipeline} />}
          </CardBody>
        </Card>

        <Card className="span-6" delay={0.1}>
          <CardHeader icon={Truck} title="Ready to dispatch" subtitle="Approved requests awaiting distribution" action={<SectionLink to="/distributions" />} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={200} />
            ) : approved.length === 0 ? (
              <EmptyState icon={Truck} title="Nothing waiting" description="Approve a request to make it available for dispatch." compact />
            ) : (
              <ul className="queue">
                {approved.slice(0, 5).map((r) => (
                  <li key={r.request_id} className="queue__item">
                    <div className="queue__main">
                      <div className="queue__top">
                        <span className="code-chip">{r.request_code}</span>
                        <PriorityBadge priority={r.priority} size="sm" />
                      </div>
                      <div className="queue__title">{r.shelter_name}</div>
                      <div className="queue__sub">Approved {formatRelativeTime(r.approved_at)}</div>
                    </div>
                    <div className="queue__actions">
                      <Button variant="outline" size="sm" leftIcon={<Truck />} to={`/distributions?new=1&request=${r.request_id}`}>
                        Dispatch
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="span-6" delay={0.12}>
          <CardHeader icon={HandHeart} title="Donations to receive" subtitle="Confirm arrival to add stock to inventory" action={<SectionLink to="/donations" />} />
          <CardBody>
            {loading && !data ? (
              <Skeleton height={200} />
            ) : pendingDonations.length === 0 ? (
              <EmptyState icon={PackageCheck} tone="success" title="All donations received" description="New pledges will appear here." compact />
            ) : (
              <ul className="queue">
                {pendingDonations.slice(0, 5).map((d) => (
                  <li key={d.donation_id} className="queue__item">
                    <div className="queue__main">
                      <div className="queue__top">
                        <span className="code-chip">{d.donation_code}</span>
                        <StatusBadge status={d.status} size="sm" />
                      </div>
                      <div className="queue__title">{d.donor_name}</div>
                      <div className="queue__sub">
                        → {d.shelter_name} · {formatNumber(d.item_count)} item(s), {formatNumber(d.total_quantity)} units
                      </div>
                    </div>
                    <div className="queue__actions">
                      <Button variant="success-soft" size="sm" leftIcon={<PackageCheck />} onClick={() => setReceiving(d)}>
                        Receive
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="span-8" delay={0.14}>
          <CardHeader icon={Truck} title="Dispatch activity" subtitle="Distributions per day · last 14 days" />
          <CardBody>{loading && !data ? <Skeleton height={180} /> : <ColumnChart data={dispatchSeries} valueLabel="distributions" />}</CardBody>
        </Card>

        <Card className="span-4" delay={0.16}>
          <CardHeader icon={Boxes} title="Low-stock alerts" action={<SectionLink to="/inventory" />} />
          <CardBody>{loading && !data ? <Skeleton height={180} /> : <LowStockList rows={data?.lowStock || []} limit={3} />}</CardBody>
        </Card>

        <Card className="span-6" delay={0.18}>
          <CardHeader title="Recent operations" subtitle="Requests and dispatches, newest first" />
          <CardBody>{loading && !data ? <Skeleton height={200} /> : <ActivityTimeline items={timeline} limit={6} />}</CardBody>
        </Card>

        <Card className="span-6" delay={0.2}>
          <CardHeader title="Quick actions" />
          <CardBody>
            <QuickActions
              actions={[
                { label: 'Review requests', description: 'Open the full request list', icon: ClipboardCheck, to: '/requests' },
                { label: 'Dispatch supplies', description: 'Create a distribution', icon: Truck, to: '/distributions?new=1', tone: 'var(--info)' },
                { label: 'Add stock', description: 'Record received supplies', icon: PackagePlus, to: '/inventory?new=1', tone: 'var(--success)' },
                { label: 'Donations', description: 'Track incoming pledges', icon: HandHeart, to: '/donations', tone: 'var(--violet)' },
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
      />

      <ConfirmDialog
        open={!!receiving}
        onClose={() => setReceiving(null)}
        onConfirm={onConfirmReceive}
        loading={busy}
        title="Mark donation as received?"
        description={receiving ? `${receiving.donation_code} · ${receiving.donor_name}` : ''}
        confirmLabel="Receive & add to stock"
      >
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          All donated items will be added to <strong style={{ color: 'var(--text-1)' }}>{receiving?.shelter_name}</strong> inventory and logged
          as ledger IN transactions.
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default ReliefManagerDashboard;
