import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Boxes } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { useFetch } from '../../hooks/useFetch';
import { auditService } from '../../services/api';
import { humanize } from '../../utils/constants';
import { formatDateTime, formatNumber } from '../../utils/helpers';

const TXN_TONE = { IN: 'success', OUT: 'danger', ADJUSTMENT_IN: 'warning', ADJUSTMENT_OUT: 'warning' };
const isIn = (type) => type === 'IN' || type === 'ADJUSTMENT_IN';

/** Inventory ledger shown under the audit log table (admin only). */
export function InventoryTransactionsCard() {
  const [type, setType] = useState('all');
  const { data, error, loading, refetch } = useFetch(() => auditService.transactions());
  const txns = useMemo(() => data || [], [data]);
  const rows = txns.filter((t) => type === 'all' || t.txn_type === type);

  const columns = [
    { key: 'created_at', header: 'Time', render: (t) => <span className="tabular">{formatDateTime(t.created_at)}</span> },
    { key: 'item_name', header: 'Item', render: (t) => <span style={{ color: 'var(--text-1)' }}>{t.item_name || `Inventory #${t.inventory_id}`}</span> },
    { key: 'shelter_name', header: 'Shelter', render: (t) => t.shelter_name || '—' },
    {
      key: 'txn_type',
      header: 'Type',
      render: (t) => (
        <Badge tone={TXN_TONE[t.txn_type] || 'neutral'} size="sm" icon={isIn(t.txn_type) ? ArrowDownToLine : ArrowUpFromLine}>
          {humanize(t.txn_type)}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      sortValue: (t) => Number(t.quantity),
      render: (t) => (
        <span className="tabular" style={{ fontWeight: 600, color: isIn(t.txn_type) ? 'var(--success)' : 'var(--danger)' }}>
          {isIn(t.txn_type) ? '+' : '-'}
          {formatNumber(t.quantity)} {t.unit || ''}
        </span>
      ),
    },
    { key: 'balance_after', header: 'Balance after', align: 'right', sortValue: (t) => Number(t.balance_after), render: (t) => <span className="tabular">{formatNumber(t.balance_after)}</span> },
    {
      key: 'reference_type',
      header: 'Reference',
      render: (t) => (
        <span className="mono">
          {t.reference_type ? humanize(t.reference_type) : '—'}
          {t.reference_id ? <span className="muted"> #{t.reference_id}</span> : null}
        </span>
      ),
    },
    { key: 'created_by_name', header: 'By', render: (t) => t.created_by_name || t.created_by_email || `User #${t.created_by}` },
  ];

  return (
    <Card delay={0.12}>
      <CardHeader icon={Boxes} title="Inventory transactions" subtitle="Every stock movement: donations received, stock added or issued, and distributions" />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="txn_id"
        loading={loading}
        error={error}
        onRetry={refetch}
        searchKeys={['item_name', 'shelter_name', 'reference_type', 'created_by_name', 'created_by_email', 'notes']}
        searchPlaceholder="Search item, shelter, reference…"
        pageSize={10}
        exportName="inventory-transactions"
        filters={
          <FilterSelect
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'IN', label: 'Stock in' },
              { value: 'OUT', label: 'Stock out' },
              { value: 'ADJUSTMENT_IN', label: 'Adjustment in' },
              { value: 'ADJUSTMENT_OUT', label: 'Adjustment out' },
            ]}
          />
        }
        empty={{ icon: Boxes, title: 'No inventory transactions yet', description: 'Stock movements will appear here.' }}
      />
    </Card>
  );
}

export default InventoryTransactionsCard;
