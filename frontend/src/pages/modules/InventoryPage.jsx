import { useMemo, useState } from 'react';
import { BellRing, Boxes, CheckCircle2, PackageMinus, PackagePlus, PackageX, Scale, TriangleAlert } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Meter } from '../../components/charts/Charts';
import { StockModal } from './forms';
import { MiniStats } from './shared';
import { useNewParam } from '../../hooks/useNewParam';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { useToast } from '../../context/ToastContext';
import { inventoryService } from '../../services/api';
import { stockState } from '../../utils/constants';
import { formatNumber, formatRelativeTime, sumBy } from '../../utils/helpers';

const STATE_RANK = { OUT_OF_STOCK: 0, LOW_STOCK: 1, IN_STOCK: 2 };

export function InventoryPage() {
  const { can, isShelterManager, isVolunteer } = useRole();
  const [addOpen, setAddOpen] = useNewParam();
  const [stockAction, setStockAction] = useState(null); // { mode, row }
  const [shelter, setShelter] = useState('all');
  const [category, setCategory] = useState('all');
  const [state, setState] = useState('all');
  const canManage = can('manageInventory');
  const toast = useToast();
  const [reportingId, setReportingId] = useState(null);
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const { data, error, loading, refetch } = useFetch(() => inventoryService.list());
  const {
    data: reportData,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useFetch(() => (isShelterManager ? inventoryService.stockReports() : Promise.resolve([])), [isShelterManager]);
  const stockReports = reportData || [];
  const inventory = useMemo(() => (data || []).map((r) => ({ ...r, stock_state: stockState(r.quantity, r.reorder_level) })), [data]);

  const shelters = useMemo(() => {
    const map = new Map();
    inventory.forEach((r) => map.set(r.shelter_id, { shelter_id: r.shelter_id, shelter_name: r.shelter_name }));
    return [...map.values()].sort((a, b) => a.shelter_name.localeCompare(b.shelter_name));
  }, [inventory]);
  const categories = useMemo(() => [...new Set(inventory.map((r) => r.category_name).filter(Boolean))].sort(), [inventory]);

  const rows = inventory.filter(
    (r) =>
      (shelter === 'all' || String(r.shelter_id) === shelter) &&
      (category === 'all' || r.category_name === category) &&
      (state === 'all' || r.stock_state === state)
  );

  const low = inventory.filter((r) => r.stock_state === 'LOW_STOCK').length;
  const out = inventory.filter((r) => r.stock_state === 'OUT_OF_STOCK').length;

  const stats = [
    { label: 'Stock lines', value: inventory.length, icon: Boxes },
    { label: 'Units on hand', value: Math.round(sumBy(inventory, 'quantity')), icon: Scale, tone: 'var(--info)' },
    { label: 'Low stock', value: low, icon: TriangleAlert, tone: 'var(--warning)' },
    { label: 'Out of stock', value: out, icon: PackageX, tone: 'var(--danger)' },
  ];

  const sendStockReport = async (row) => {
    setReportingId(row.inventory_id);
    try {
      const result = await inventoryService.reportLowStock(row.inventory_id);
      toast.success('Report sent', result?.message || `${row.item_name} was reported to the shelter manager.`);
      await refetch();
    } catch (err) {
      toast.error('Could not send report', err?.response?.data?.message || err?.message || 'Please try again.');
    } finally {
      setReportingId(null);
    }
  };

  const acknowledgeReport = async (report) => {
    setAcknowledgingId(report.report_id);
    try {
      await inventoryService.acknowledgeReport(report.report_id);
      toast.success('Report acknowledged', `${report.item_name} report marked as acknowledged.`);
      await refetchReports();
    } catch (err) {
      toast.error('Could not acknowledge report', err?.response?.data?.message || err?.message || 'Please try again.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const columns = [
    {
      key: 'item_name',
      header: 'Item',
      render: (r) => (
        <div className="cell-primary">
          <span className="cell-primary__title">{r.item_name}</span>
          <span className="cell-primary__sub">{r.category_name || 'Uncategorised'}</span>
        </div>
      ),
    },
    { key: 'shelter_name', header: 'Shelter' },
    {
      key: 'quantity',
      header: 'On hand',
      sortValue: (r) => Number(r.quantity),
      render: (r) => {
        const reorder = Number(r.reorder_level) || 0;
        const scale = Math.max(reorder * 3, Number(r.quantity), 1);
        return (
          <div className="qty-cell">
            <span className="qty-cell__value tabular">
              {formatNumber(r.quantity)}
              <small>{r.unit}</small>
            </span>
            <Meter
              value={Number(r.quantity)}
              max={scale}
              size="sm"
              tone={r.stock_state === 'OUT_OF_STOCK' ? 'danger' : r.stock_state === 'LOW_STOCK' ? 'warning' : 'ok'}
            />
          </div>
        );
      },
    },
    {
      key: 'reorder_level',
      header: 'Reorder at',
      align: 'right',
      render: (r) => <span className="tabular">{r.reorder_level != null ? formatNumber(r.reorder_level) : '—'}</span>,
    },
    { key: 'stock_state', header: 'Health', sortValue: (r) => STATE_RANK[r.stock_state], render: (r) => <StatusBadge status={r.stock_state} size="sm" /> },
    { key: 'updated_at', header: 'Updated', render: (r) => (r.updated_at ? formatRelativeTime(r.updated_at) : '—') },
    ...((canManage || isVolunteer)
      ? [
          {
            key: 'actions',
            header: '',
            sortable: false,
            csv: false,
            align: 'right',
            render: (r) => (
              <div className="row-actions">
                {canManage && (
                  <>
                    <Button variant="success-soft" size="sm" iconOnly aria-label={`Add stock to ${r.item_name}`} title="Add stock" onClick={() => setStockAction({ mode: 'add', row: r })}>
                      <PackagePlus />
                    </Button>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      iconOnly
                      aria-label={`Issue stock of ${r.item_name}`}
                      title="Issue / reduce stock"
                      onClick={() => setStockAction({ mode: 'reduce', row: r })}
                      disabled={Number(r.quantity) <= 0}
                    >
                      <PackageMinus />
                    </Button>
                  </>
                )}
                {isVolunteer && r.stock_state !== 'IN_STOCK' && (
                  <Button
                    variant={Number(r.has_open_report) ? 'secondary' : 'danger-soft'}
                    size="sm"
                    leftIcon={<BellRing />}
                    onClick={() => sendStockReport(r)}
                    loading={reportingId === r.inventory_id}
                    disabled={Number(r.has_open_report) === 1}
                    title={Number(r.has_open_report) === 1 ? 'Already reported — waiting for shelter manager' : 'Report low stock to shelter manager'}
                  >
                    {Number(r.has_open_report) === 1 ? 'Reported' : 'Report'}
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={isShelterManager ? 'Shelter' : 'Operations'}
        eyebrowIcon={Boxes}
        title={isShelterManager ? 'Shelter inventory' : 'Inventory'}
        description={
          isVolunteer
            ? 'Supplies at the shelters where you hold an active assignment.'
            : isShelterManager
              ? 'Stock on hand at the shelters you manage. Every change writes a ledger transaction.'
              : 'Stock on hand across every shelter. Every movement is recorded in the inventory ledger.'
        }
        actions={
          canManage && (
            <Button variant="primary" leftIcon={<PackagePlus />} onClick={() => setAddOpen(true)}>
              Add stock
            </Button>
          )
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <Card delay={0.08}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="inventory_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['item_name', 'shelter_name', 'category_name']}
          searchPlaceholder="Search item, shelter, category…"
          initialSort={{ key: 'stock_state', dir: 'asc' }}
          exportName="inventory"
          filters={
            <>
              {shelters.length > 1 && (
                <FilterSelect
                  label="Shelter"
                  value={shelter}
                  onChange={setShelter}
                  options={[{ value: 'all', label: 'All shelters' }, ...shelters.map((s) => ({ value: String(s.shelter_id), label: s.shelter_name }))]}
                />
              )}
              {categories.length > 0 && (
                <FilterSelect label="Category" value={category} onChange={setCategory} options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]} />
              )}
              <FilterSelect
                label="Stock health"
                value={state}
                onChange={setState}
                options={[
                  { value: 'all', label: 'Any health' },
                  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
                  { value: 'LOW_STOCK', label: 'Low stock' },
                  { value: 'IN_STOCK', label: 'Healthy' },
                ]}
              />
            </>
          }
          empty={{
            icon: Boxes,
            title: isVolunteer ? 'No shelter inventory to show' : 'No stock recorded yet',
            description: isVolunteer
              ? 'Inventory appears for shelters where you have an active assignment.'
              : 'Add the first stock line to start tracking supplies.',
            action: canManage ? (
              <Button variant="primary" size="sm" leftIcon={<PackagePlus />} onClick={() => setAddOpen(true)}>
                Add stock
              </Button>
            ) : null,
          }}
        />
      </Card>

      {low + out > 0 && canManage && (
        <div className="inline-alert inline-alert--warning">
          <TriangleAlert aria-hidden="true" />
          <span>
            <strong style={{ color: 'var(--text-1)' }}>{low + out}</strong> stock line{low + out > 1 ? 's are' : ' is'} at or below the reorder level.{' '}
            <Badge tone="warning" size="sm">
              Tip
            </Badge>{' '}
            Raise a relief request so supplies arrive before they run out.
          </span>
        </div>
      )}

      {isShelterManager && (
        <Card delay={0.1}>
          <div style={{ padding: 'var(--space-5)' }}>
            <div className="section-heading" style={{ marginBottom: 'var(--space-4)' }}>
              <div>
                <div className="section-heading__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BellRing size={18} aria-hidden="true" /> Volunteer stock reports
                </div>
                <div className="section-heading__sub">Low or empty stock reported by volunteers assigned to your shelter.</div>
              </div>
              <Badge tone={stockReports.some((r) => r.status === 'OPEN') ? 'warning' : 'neutral'} size="sm">
                {stockReports.filter((r) => r.status === 'OPEN').length} open
              </Badge>
            </div>
            <DataTable
              columns={[
                { key: 'item_name', header: 'Item' },
                { key: 'volunteer_name', header: 'Reported by' },
                {
                  key: 'quantity_at_report',
                  header: 'Stock when reported',
                  render: (r) => <span className="tabular">{formatNumber(r.quantity_at_report)} {r.unit}</span>,
                },
                {
                  key: 'reported_at',
                  header: 'Reported',
                  render: (r) => (r.reported_at ? formatRelativeTime(r.reported_at) : '—'),
                },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
                {
                  key: 'report_actions',
                  header: '',
                  sortable: false,
                  csv: false,
                  align: 'right',
                  render: (r) =>
                    r.status === 'OPEN' ? (
                      <Button
                        variant="success-soft"
                        size="sm"
                        leftIcon={<CheckCircle2 />}
                        loading={acknowledgingId === r.report_id}
                        onClick={() => acknowledgeReport(r)}
                      >
                        Acknowledge
                      </Button>
                    ) : null,
                },
              ]}
              rows={stockReports}
              rowKey="report_id"
              loading={reportsLoading}
              error={reportsError}
              onRetry={refetchReports}
              searchKeys={['item_name', 'volunteer_name', 'shelter_name']}
              searchPlaceholder="Search item or volunteer…"
              initialSort={{ key: 'reported_at', dir: 'desc' }}
              empty={{
                icon: BellRing,
                title: 'No volunteer stock reports',
                description: 'Reports sent by volunteers for low or empty stock will appear here.',
              }}
            />
          </div>
        </Card>
      )}

      <StockModal
        open={addOpen || !!stockAction}
        mode={stockAction?.mode || 'add'}
        row={stockAction?.row}
        shelterOptions={isShelterManager ? shelters : undefined}
        onClose={() => {
          setAddOpen(false);
          setStockAction(null);
        }}
        onDone={refetch}
      />
    </div>
  );
}

export default InventoryPage;
