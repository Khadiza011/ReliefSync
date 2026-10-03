import { useMemo, useState } from 'react';
import { Check, ClipboardCheck, ClipboardList, ClipboardPlus, Package, Siren, Truck, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { Segmented } from '../../components/ui/Segmented';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Meter } from '../../components/charts/Charts';
import { RequestModal } from './forms';
import { MiniStats } from './shared';
import { useNewParam } from '../../hooks/useNewParam';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { useToast } from '../../context/ToastContext';
import { requestsService, sheltersService } from '../../services/api';
import { PRIORITIES, PRIORITY_META } from '../../utils/constants';
import { countBy, formatDateTime, formatNumber, formatRelativeTime, truncate } from '../../utils/helpers';
import { notifyDataChanged } from '../../utils/events';

const PRIORITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const OPEN = ['REQUESTED', 'APPROVED', 'PARTIALLY_DELIVERED'];

export function ReliefRequestsPage() {
  const { can, isShelterManager } = useRole();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useNewParam();
  const [tab, setTab] = useState('open');
  const [priority, setPriority] = useState('all');
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const canReview = can('reviewRequest');

  const { data, error, loading, refetch } = useFetch(() => requestsService.list());
  const { data: mySheltersData } = useFetch(
    () => (isShelterManager ? sheltersService.mine() : Promise.resolve([])),
    [isShelterManager]
  );
  const requestShelterOptions = isShelterManager ? (mySheltersData || []) : undefined;
  const requests = useMemo(() => data || [], [data]);
  const counts = useMemo(() => countBy(requests, 'status'), [requests]);

  const rows = requests.filter((r) => {
    const tabOk =
      tab === 'all' ||
      (tab === 'open' && OPEN.includes(r.status)) ||
      (tab === 'closed' && !OPEN.includes(r.status)) ||
      r.status === tab;
    return tabOk && (priority === 'all' || r.priority === priority);
  });

  const stats = [
    { label: 'All requests', value: requests.length, icon: ClipboardList },
    { label: 'Awaiting approval', value: counts.REQUESTED || 0, icon: ClipboardCheck, tone: 'var(--warning)' },
    { label: 'Critical & open', value: requests.filter((r) => r.priority === 'CRITICAL' && OPEN.includes(r.status)).length, icon: Siren, tone: 'var(--danger)' },
    { label: 'Delivered', value: counts.DELIVERED || 0, icon: Truck, tone: 'var(--success)' },
  ];

  const onReview = async () => {
    setBusy(true);
    try {
      await requestsService.updateStatus(review.request.request_id, review.status);
      toast.success(review.status === 'APPROVED' ? 'Request approved' : 'Request cancelled', `${review.request.request_code} · ${review.request.shelter_name}`);
      setReview(null);
      setSelected(null);
      notifyDataChanged();
      refetch();
    } catch (err) {
      toast.error('Could not update request', err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'request_code', header: 'Request', render: (r) => <span className="code-chip">{r.request_code}</span> },
    {
      key: 'shelter_name',
      header: 'Shelter',
      render: (r) => (
        <div className="cell-primary">
          <span className="cell-primary__title">{r.shelter_name}</span>
          <span className="cell-primary__sub truncate" style={{ maxWidth: 240 }} title={r.notes || undefined}>
            {r.notes ? truncate(r.notes, 36) : [r.upazila, r.district].filter(Boolean).join(', ')}
          </span>
        </div>
      ),
    },
    { key: 'priority', header: 'Priority', sortValue: (r) => PRIORITY_RANK[r.priority], render: (r) => <PriorityBadge priority={r.priority} size="sm" /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'requested_at', header: 'Requested', render: (r) => <span title={formatDateTime(r.requested_at)}>{formatRelativeTime(r.requested_at)}</span> },
    ...(canReview
      ? [
          {
            key: 'actions',
            header: '',
            sortable: false,
            csv: false,
            align: 'right',
            render: (r) =>
              r.status === 'REQUESTED' ? (
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <Button variant="danger-soft" size="sm" iconOnly aria-label={`Cancel ${r.request_code}`} title="Cancel" onClick={() => setReview({ request: r, status: 'CANCELLED' })}>
                    <X />
                  </Button>
                  <Button variant="success-soft" size="sm" leftIcon={<Check />} onClick={() => setReview({ request: r, status: 'APPROVED' })}>
                    Approve
                  </Button>
                </div>
              ) : (r.status === 'APPROVED' || r.status === 'PARTIALLY_DELIVERED') && can('createDistribution') ? (
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" leftIcon={<Truck />} to={`/distributions?new=1&request=${r.request_id}`}>
                    {r.status === 'PARTIALLY_DELIVERED' ? 'Dispatch remaining' : 'Dispatch'}
                  </Button>
                </div>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations"
        eyebrowIcon={ClipboardList}
        title="Relief requests"
        description="Supply needs raised by shelters. Relief managers approve them; distributions fulfil them item by item."
        actions={
          can('createRequest') && (
            <Button variant="primary" leftIcon={<ClipboardPlus />} onClick={() => setCreateOpen(true)}>
              New request
            </Button>
          )
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <Card delay={0.08}>
        <div className="tab-row">
          <Segmented
            ariaLabel="Request status"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'open', label: 'Open', count: requests.filter((r) => OPEN.includes(r.status)).length },
              { value: 'REQUESTED', label: 'Awaiting approval', count: counts.REQUESTED || 0 },
              { value: 'APPROVED', label: 'Approved', count: counts.APPROVED || 0 },
              { value: 'closed', label: 'Closed', count: requests.filter((r) => !OPEN.includes(r.status)).length },
              { value: 'all', label: 'All', count: requests.length },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="request_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['request_code', 'shelter_name', 'district', 'notes']}
          searchPlaceholder="Search code, shelter, notes…"
          initialSort={{ key: 'requested_at', dir: 'desc' }}
          onRowClick={setSelected}
          exportName="relief-requests"
          filters={
            <FilterSelect
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={[{ value: 'all', label: 'All priorities' }, ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))]}
            />
          }
          empty={{
            icon: ClipboardList,
            title: tab === 'REQUESTED' ? 'Nothing awaiting approval' : 'No requests here',
            description: 'Relief requests created by shelter managers will show up in this list.',
            action: can('createRequest') ? (
              <Button variant="primary" size="sm" leftIcon={<ClipboardPlus />} onClick={() => setCreateOpen(true)}>
                New request
              </Button>
            ) : null,
          }}
        />
      </Card>

      <RequestDrawer
        request={selected}
        onClose={() => setSelected(null)}
        canReview={canReview}
        canDispatch={can('createDistribution')}
        onReview={(status) => setReview({ request: selected, status })}
      />

      <RequestModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} shelterOptions={requestShelterOptions} />

      <ConfirmDialog
        open={!!review}
        onClose={() => setReview(null)}
        onConfirm={onReview}
        loading={busy}
        tone={review?.status === 'CANCELLED' ? 'danger' : 'primary'}
        title={review?.status === 'APPROVED' ? 'Approve this request?' : 'Cancel this request?'}
        description={review ? `${review.request.request_code} · ${review.request.shelter_name}` : ''}
        confirmLabel={review?.status === 'APPROVED' ? 'Approve request' : 'Cancel request'}
      >
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          {review?.status === 'APPROVED'
            ? 'Approved requests can be fulfilled through distributions. Your account is recorded as approver.'
            : 'Cancelled requests are closed and cannot be distributed.'}
        </p>
      </ConfirmDialog>
    </div>
  );
}

function RequestDrawer({ request, onClose, canReview, canDispatch, onReview }) {
  const { data: items, loading } = useFetch(
    () => (request ? requestsService.items(request.request_id) : Promise.resolve([])),
    [request?.request_id]
  );
  const list = items || [];
  const requested = list.reduce((s, i) => s + Number(i.requested_qty || 0), 0);
  const fulfilled = list.reduce((s, i) => s + Number(i.fulfilled_qty || 0), 0);

  return (
    <Drawer
      open={!!request}
      onClose={onClose}
      eyebrow="Relief request"
      title={<span className="mono">{request?.request_code}</span>}
      meta={
        request && (
          <>
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </>
        )
      }
      footer={
        request && (
          <>
            {canReview && request.status === 'REQUESTED' && (
              <>
                <Button variant="danger-soft" leftIcon={<X />} onClick={() => onReview('CANCELLED')}>
                  Cancel
                </Button>
                <Button variant="primary" leftIcon={<Check />} onClick={() => onReview('APPROVED')}>
                  Approve
                </Button>
              </>
            )}
            {canDispatch && (request.status === 'APPROVED' || request.status === 'PARTIALLY_DELIVERED') && (
              <Button variant="primary" leftIcon={<Truck />} to={`/distributions?new=1&request=${request.request_id}`}>
                {request.status === 'PARTIALLY_DELIVERED' ? 'Dispatch remaining items' : 'Dispatch distribution'}
              </Button>
            )}
          </>
        )
      }
    >
      {request && (
        <>
          <KeyValue
            items={[
              { label: 'Shelter', value: request.shelter_name, wide: true },
              { label: 'District', value: request.district },
              { label: 'Upazila', value: request.upazila },
              { label: 'Requested', value: formatDateTime(request.requested_at) },
              { label: 'Approved', value: request.approved_at ? formatDateTime(request.approved_at) : 'Not yet' },
              { label: 'Notes', value: request.notes || '—', wide: true },
            ]}
          />

          <div>
            <div className="split" style={{ marginBottom: 12 }}>
              <div className="section-label" style={{ margin: 0 }}>
                Requested items
              </div>
              {list.length > 0 && (
                <span className="muted tabular" style={{ fontSize: 'var(--text-xs)' }}>
                  {formatNumber(fulfilled)} / {formatNumber(requested)} units fulfilled
                </span>
              )}
            </div>
            {loading ? (
              <Skeleton height={120} />
            ) : list.length === 0 ? (
              <EmptyState icon={Package} title="No items on this request" description="Items added to the request appear here with delivery progress." compact />
            ) : (
              <div className="req-items">
                {list.map((it) => (
                  <div key={it.request_item_id} className="req-item">
                    <Meter
                      value={Number(it.fulfilled_qty)}
                      max={Number(it.requested_qty) || 1}
                      label={it.item_name}
                      detail={`${formatNumber(it.fulfilled_qty)} / ${formatNumber(it.requested_qty)} ${it.unit || ''}`}
                      thresholds={[101, 101]}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}

export default ReliefRequestsPage;
