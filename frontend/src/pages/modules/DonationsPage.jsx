import { useMemo, useState } from 'react';
import { Boxes, Clock3, Gift, HandHeart, PackageCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DataTable, FilterSelect } from '../../components/ui/DataTable';
import { Drawer, KeyValue } from '../../components/ui/Drawer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Avatar } from '../../components/ui/Segmented';
import { DonationModal } from './forms';
import { MiniStats } from './shared';
import { useNewParam } from '../../hooks/useNewParam';
import { useFetch } from '../../hooks/useFetch';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { donationService } from '../../services/api';
import { DONATION_STATUSES, ROLES, humanize } from '../../utils/constants';
import { formatDateTime, formatNumber, formatRelativeTime, sumBy } from '../../utils/helpers';
import { notifyDataChanged } from '../../utils/events';

export function DonationsPage() {
  const { can, role, isDonor } = useRole();
  const { user } = useAuth();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useNewParam();
  const [selected, setSelected] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('all');
  const canReceive = can('receiveDonation');

  const { data, error, loading, refetch } = useFetch(() => donationService.list());

  // Donors only see their own pledges
  const donations = useMemo(
    () => (data || []).filter((d) => !isDonor || Number(d.donor_user_id) === Number(user?.user_id)),
    [data, isDonor, user]
  );
  const rows = donations.filter((d) => status === 'all' || d.status === status);

  const stats = [
    { label: isDonor ? 'Your donations' : 'Donations', value: donations.length, icon: Gift },
    { label: 'Awaiting receipt', value: donations.filter((d) => d.status === 'PENDING').length, icon: Clock3, tone: 'var(--warning)' },
    { label: 'Received', value: donations.filter((d) => d.status === 'RECEIVED').length, icon: PackageCheck, tone: 'var(--success)' },
    { label: 'Units donated', value: Math.round(sumBy(donations, 'total_quantity')), icon: Boxes, tone: 'var(--violet)' },
  ];

  const onReceive = async () => {
    setBusy(true);
    try {
      await donationService.receive(receiving.donation_id);
      toast.success('Donation received', `${receiving.donation_code} added to ${receiving.shelter_name} inventory.`);
      setReceiving(null);
      setSelected(null);
      notifyDataChanged();
      refetch();
    } catch (err) {
      toast.error('Could not receive donation', err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'donation_code', header: 'Donation', render: (d) => <span className="code-chip">{d.donation_code}</span> },
    {
      key: 'donor_name',
      header: 'Donor',
      render: (d) => (
        <div className="cell-with-icon">
          <Avatar name={d.donor_name} tone="var(--role-donor)" size={30} />
          <div className="cell-primary">
            <span className="cell-primary__title">{d.donor_name}</span>
            {d.donor_type && <span className="cell-primary__sub">{humanize(d.donor_type)}</span>}
          </div>
        </div>
      ),
    },
    { key: 'shelter_name', header: 'Receiving shelter' },
    {
      key: 'total_quantity',
      header: 'Items',
      align: 'right',
      sortValue: (d) => Number(d.total_quantity),
      render: (d) => (
        <span className="tabular">
          <strong style={{ color: 'var(--text-1)' }}>{formatNumber(d.total_quantity)}</strong> units · {formatNumber(d.item_count)}
        </span>
      ),
    },
    { key: 'received_at', header: 'Updated', render: (d) => <span title={formatDateTime(d.received_at)}>{formatRelativeTime(d.received_at)}</span> },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} size="sm" /> },
    ...(canReceive
      ? [
          {
            key: 'actions',
            header: '',
            sortable: false,
            csv: false,
            align: 'right',
            render: (d) =>
              d.status === 'PENDING' ? (
                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <Button variant="success-soft" size="sm" leftIcon={<PackageCheck />} onClick={() => setReceiving(d)}>
                    Receive
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
        eyebrowIcon={HandHeart}
        title="Donations"
        description={
          isDonor
            ? 'Every pledge you have made and where it stands.'
            : 'Incoming supplies from donors. Receiving a donation adds every item to the shelter inventory automatically.'
        }
        actions={
          can('createDonation') && (
            <Button variant="primary" leftIcon={<HandHeart />} onClick={() => setCreateOpen(true)}>
              {isDonor ? 'Make a donation' : 'Record donation'}
            </Button>
          )
        }
      />

      <MiniStats stats={stats} loading={loading && !data} />

      <Card delay={0.08}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="donation_id"
          loading={loading}
          error={error}
          onRetry={refetch}
          searchKeys={['donation_code', 'donor_name', 'shelter_name', 'notes']}
          searchPlaceholder="Search code, donor, shelter…"
          onRowClick={setSelected}
          exportName="donations"
          filters={
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[{ value: 'all', label: 'All statuses' }, ...DONATION_STATUSES.map((s) => ({ value: s, label: humanize(s) }))]}
            />
          }
          empty={{
            icon: HandHeart,
            title: 'No donations yet',
            description: 'Donations will appear here as soon as they are pledged.',
            action: can('createDonation') ? (
              <Button variant="primary" size="sm" leftIcon={<HandHeart />} onClick={() => setCreateOpen(true)}>
                {isDonor ? 'Make a donation' : 'Record donation'}
              </Button>
            ) : null,
          }}
        />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Donation"
        title={<span className="mono">{selected?.donation_code}</span>}
        meta={selected && <StatusBadge status={selected.status} />}
        footer={
          selected &&
          canReceive &&
          selected.status === 'PENDING' && (
            <Button variant="primary" leftIcon={<PackageCheck />} onClick={() => setReceiving(selected)}>
              Receive & add to stock
            </Button>
          )
        }
      >
        {selected && (
          <KeyValue
            items={[
              { label: 'Donor', value: selected.donor_name, wide: true },
              { label: 'Donor type', value: selected.donor_type ? <Badge tone="violet" size="sm">{humanize(selected.donor_type)}</Badge> : '—' },
              { label: 'Receiving shelter', value: selected.shelter_name },
              { label: 'Item lines', value: formatNumber(selected.item_count) },
              { label: 'Total units', value: formatNumber(selected.total_quantity) },
              {
                label: selected.status === 'RECEIVED' ? 'Received by' : 'Submitted by',
                value: selected.received_by_name || '—',
              },
              { label: selected.status === 'RECEIVED' ? 'Received at' : 'Submitted at', value: formatDateTime(selected.received_at) },
              { label: 'Notes', value: selected.notes || '—', wide: true },
            ]}
          />
        )}
      </Drawer>

      <DonationModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} role={role ?? ROLES.ADMIN} />

      <ConfirmDialog
        open={!!receiving}
        onClose={() => setReceiving(null)}
        onConfirm={onReceive}
        loading={busy}
        title="Mark donation as received?"
        description={receiving ? `${receiving.donation_code} · ${receiving.donor_name}` : ''}
        confirmLabel="Receive & add to stock"
      >
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          {formatNumber(receiving?.total_quantity)} units will be added to <strong style={{ color: 'var(--text-1)' }}>{receiving?.shelter_name}</strong> and logged as ledger IN
          transactions.
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default DonationsPage;
