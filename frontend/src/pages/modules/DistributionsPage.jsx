import { useMemo, useState } from 'react';
import { CircleCheck, ClipboardCheck, Package, PackageCheck, Truck, TriangleAlert } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { Select, Textarea } from '../../components/ui/Field';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import { MiniStats } from './shared';
import { useNewParam } from '../../hooks/useNewParam';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { useToast } from '../../context/ToastContext';
import { useOnOpen } from '../../hooks/useUi';
import { distributionService, inventoryService, requestsService } from '../../services/api';
import { DISTRIBUTION_STATUSES, humanize } from '../../utils/constants';
import { formatDateTime, formatNumber, formatRelativeTime, sumBy, isWithinDays } from '../../utils/helpers';
import { notifyDataChanged } from '../../utils/events';

export function DistributionsPage() {
  const { can, isShelterManager } = useRole();
  const [createOpen, setCreateOpen, params] = useNewParam();
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('all');
  const preselect = params.request || '';
  const canCreate = can('createDistribution');

  const { data, error, loading, refetch } = useFetch(() => distributionService.list());
  const distributions = useMemo(() => data || [], [data]);
  const rows = distributions.filter((d) => status === 'all' || d.status === status);

  const stats = [
    { label: 'Distributions', value: distributions.length, icon: Truck },
    { label: 'Units dispatched', value: Math.round(sumBy(distributions, 'total_quantity')), icon: PackageCheck, tone: 'var(--success)' },
    { label: 'Shelters reached', value: new Set(distributions.map((d) => d.shelter_name)).size, icon: ClipboardCheck, tone: 'var(--info)' },
    { label: 'Last 7 days', value: distributions.filter((d) => isWithinDays(d.distributed_at, 7)).length, icon: CircleCheck, tone: 'var(--violet)' },
  ];

  const columns = [
    { key: 'distribution_code', header: 'Distribution', render: (d) => <span className="code-chip">{d.distribution_code}</span> },
    {
      key: 'shelter_name',
      header: 'Destination',
      render: (d) => (
        <div className="cell-primary">
          <span className="cell-primary__title">{d.shelter_name}</span>
          <span className="cell-primary__sub mono">{d.request_code}</span>
        </div>
      ),
    },
    { key: 'request_priority', header: 'Priority', render: (d) => <PriorityBadge priority={d.request_priority} size="sm" /> },
    {
      key: 'total_quantity',
      header: 'Payload',
      align: 'right',
      sortValue: (d) => Number(d.total_quantity),
      render: (d) => (
        <span className="tabular">
          <strong style={{ color: 'var(--text-1)' }}>{formatNumber(d.total_quantity)}</strong> units · {formatNumber(d.item_count)} line(s)
        </span>
      ),
    },
    { key: 'distributed_by_name', header: 'Dispatched by', render: (d) => d.distributed_by_name || '—' },
    { key: 'distributed_at', header: 'When', render: (d) => <span title={formatDateTime(d.distributed_at)}>{formatRelativeTime(d.distributed_at)}</span> },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} size="sm" /> },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={isShelterManager ? 'Shelter' : 'Operations'}
        eyebrowIcon={Truck}
        title="Distributions"
        description="Supplies dispatched against approved relief requests. Stock is deducted and the ledger updated in a single transaction."
        actions={
          canCreate && (
            <Button variant="primary" leftIcon={<Truck />} onClick={() => setCreateOpen(true)}>
              Dispatch distribution
            </Button>
          )
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <Card delay={0.08}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="distribution_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['distribution_code', 'request_code', 'shelter_name', 'distributed_by_name', 'notes']}
          searchPlaceholder="Search code, shelter, request…"
          onRowClick={setSelected}
          exportName="distributions"
          filters={
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[{ value: 'all', label: 'All statuses' }, ...DISTRIBUTION_STATUSES.map((s) => ({ value: s, label: humanize(s) }))]}
            />
          }
          empty={{
            icon: Truck,
            title: 'No distributions yet',
            description: 'Dispatch supplies against an approved relief request to see it here.',
            action: canCreate ? (
              <Button variant="primary" size="sm" leftIcon={<Truck />} onClick={() => setCreateOpen(true)}>
                Dispatch distribution
              </Button>
            ) : null,
          }}
        />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Distribution"
        title={<span className="mono">{selected?.distribution_code}</span>}
        meta={
          selected && (
            <>
              <StatusBadge status={selected.status} />
              <PriorityBadge priority={selected.request_priority} />
            </>
          )
        }
      >
        {selected && (
          <KeyValue
            items={[
              { label: 'Destination shelter', value: selected.shelter_name, wide: true },
              { label: 'Relief request', value: <span className="mono">{selected.request_code}</span> },
              { label: 'Request status', value: <StatusBadge status={selected.request_status} size="sm" /> },
              { label: 'Item lines', value: formatNumber(selected.item_count) },
              { label: 'Units dispatched', value: formatNumber(selected.total_quantity) },
              { label: 'Dispatched by', value: selected.distributed_by_name },
              { label: 'Dispatched at', value: formatDateTime(selected.distributed_at) },
              { label: 'Notes', value: selected.notes || '—', wide: true },
            ]}
          />
        )}
      </Drawer>

      {canCreate && (
        <DispatchModal
          open={createOpen}
          preselect={preselect}
          onClose={() => setCreateOpen(false)}
          onDone={refetch}
        />
      )}
    </div>
  );
}

/* ---------------- Dispatch wizard ---------------- */
function DispatchModal({ open, onClose, onDone, preselect }) {
  const toast = useToast();
  const [requestId, setRequestId] = useState('');
  const [notes, setNotes] = useState('');
  const [edits, setEdits] = useState({}); // quantities the user changed, by request_item_id
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: requests } = useFetch(() => (open ? requestsService.list() : Promise.resolve(null)), [open]);
  const { data: inventory } = useFetch(() => (open ? inventoryService.list() : Promise.resolve(null)), [open]);
  const approved = useMemo(() => (requests || []).filter((r) => r.status === 'APPROVED' || r.status === 'PARTIALLY_DELIVERED'), [requests]);
  const request = approved.find((r) => String(r.request_id) === String(requestId));

  const { data: items, loading: itemsLoading } = useFetch(
    () => (requestId ? requestsService.items(requestId) : Promise.resolve([])),
    [requestId]
  );

  useOnOpen(open, () => {
    setRequestId(preselect ? String(preselect) : '');
    setNotes('');
    setFormError('');
    setEdits({});
  });

  // Pre-fill each line with what's still outstanding, capped by shelter stock
  const lines = useMemo(() => {
    if (!items || !request) return [];
    return items.map((it) => {
      const remaining = Math.max(0, Number(it.requested_qty) - Number(it.fulfilled_qty));
      const stockRow = (inventory || []).find((r) => r.shelter_name === request.shelter_name && String(r.item_id) === String(it.item_id));
      const stock = stockRow ? Number(stockRow.quantity) : 0;
      return { ...it, remaining, stock, hasStockRow: !!stockRow };
    });
  }, [items, inventory, request]);

  const qty = useMemo(() => {
    const out = {};
    lines.forEach((l) => {
      out[l.request_item_id] = edits[l.request_item_id] ?? String(Math.min(l.remaining, l.stock));
    });
    return out;
  }, [lines, edits]);

  const total = lines.reduce((s, l) => s + (Number(qty[l.request_item_id]) || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!request) {
      setFormError('Select an approved request to dispatch.');
      return;
    }
    const toSend = lines.filter((l) => Number(qty[l.request_item_id]) > 0);
    for (const l of toSend) {
      const q = Number(qty[l.request_item_id]);
      if (q > l.remaining) return setFormError(`${l.item_name}: only ${formatNumber(l.remaining)} ${l.unit} still outstanding.`);
      if (q > l.stock) return setFormError(`${l.item_name}: only ${formatNumber(l.stock)} ${l.unit} in stock at ${request.shelter_name}.`);
    }
    if (toSend.length === 0) {
      setFormError('Enter a quantity for at least one item.');
      return;
    }

    setSaving(true);
    try {
      const created = await distributionService.create({ request_id: request.request_id, notes: notes.trim() || undefined });
      const failures = [];
      let finalStatus = null;
      for (const l of toSend) {
        try {
          const res = await distributionService.addItem({
            distribution_id: created.distribution_id,
            request_item_id: l.request_item_id,
            item_id: l.item_id,
            quantity: Number(qty[l.request_item_id]),
          });
          finalStatus = res.status;
        } catch (err) {
          failures.push(`${l.item_name}: ${err.message}`);
        }
      }
      if (failures.length) {
        toast.warning(`${created.distribution_code} created with issues`, failures.join(' · '));
      } else {
        toast.success(
          `${created.distribution_code} dispatched`,
          `${formatNumber(total)} units to ${request.shelter_name}${finalStatus ? ` · request ${humanize(finalStatus).toLowerCase()}` : ''}.`
        );
      }
      notifyDataChanged();
      onDone?.();
      onClose();
    } catch (err) {
      setFormError(err.message);
      toast.error('Dispatch failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={submit}
      size="lg"
      icon={Truck}
      title="Dispatch distribution"
      description="Fulfil an approved request. Stock is deducted from the shelter and logged in one transaction per item."
      footer={
        <>
          <span className="muted" style={{ marginRight: 'auto', fontSize: 'var(--text-sm)' }}>
            {request ? `${formatNumber(total)} units → ${request.shelter_name}` : 'No request selected'}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} leftIcon={<Truck />} disabled={!request || total <= 0}>
            Dispatch now
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 20 }}>
        <Select
          label="Request to dispatch"
          required
          placeholder={requests ? (approved.length ? 'Select a request' : 'No requests waiting for dispatch') : 'Loading requests…'}
          value={requestId}
          onChange={(e) => {
            setRequestId(e.target.value);
            setEdits({});
          }}
          options={approved.map((r) => ({ value: String(r.request_id), label: `${r.request_code} · ${r.shelter_name} · ${r.priority}${r.status === 'PARTIALLY_DELIVERED' ? ' · partially delivered' : ''}` }))}
        />

        {request && (
          <div>
            <div className="split" style={{ marginBottom: 10 }}>
              <div className="section-label" style={{ margin: 0 }}>
                Items to dispatch
              </div>
              <PriorityBadge priority={request.priority} size="sm" />
            </div>
            {itemsLoading ? (
              <Skeleton height={120} />
            ) : lines.length === 0 ? (
              <EmptyState icon={Package} title="This request has no items" description="Items must be added to a request before it can be distributed." compact />
            ) : (
              <div className="req-items">
                {lines.map((l) => {
                  const short = l.stock < l.remaining;
                  return (
                    <div key={l.request_item_id} className="req-item">
                      <div className="split" style={{ alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{l.item_name}</div>
                          <div className="muted" style={{ fontSize: 'var(--text-xs)', marginTop: 2 }}>
                            Outstanding {formatNumber(l.remaining)} {l.unit} · In stock {formatNumber(l.stock)} {l.unit}
                          </div>
                          {short && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--warning)', marginTop: 6 }}>
                              <TriangleAlert size={13} aria-hidden="true" />
                              {l.hasStockRow ? 'Not enough stock to fulfil completely' : 'No stock line for this item at the shelter'}
                            </div>
                          )}
                        </div>
                        <div className="control" style={{ width: 150, flexShrink: 0 }}>
                          <input
                            className="input input--with-suffix"
                            type="number"
                            min={0}
                            step="any"
                            max={Math.min(l.remaining, l.stock)}
                            value={qty[l.request_item_id] ?? ''}
                            onChange={(e) => setEdits((q) => ({ ...q, [l.request_item_id]: e.target.value }))}
                            aria-label={`Quantity of ${l.item_name}`}
                            disabled={l.remaining <= 0}
                          />
                          <span className="control__suffix item-lines__unit">{l.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <Textarea label="Dispatch notes" placeholder="Vehicle, driver, route, expected arrival…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={255} />

        {formError && (
          <div className="inline-alert inline-alert--danger" role="alert">
            <TriangleAlert aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DistributionsPage;
