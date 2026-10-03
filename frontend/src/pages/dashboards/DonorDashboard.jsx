import { useMemo } from 'react';
import { Boxes, CircleCheck, Clock3, Gift, HandHeart, House, PackageCheck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { ErrorState, StatSkeleton } from '../../components/ui/Feedback';
import { BarList, StackedBar } from '../../components/charts/Charts';
import { DashboardHero } from './Widgets';
import { DonationModal } from '../modules/forms';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useNewParam } from '../../hooks/useNewParam';
import { donationService } from '../../services/api';
import { ROLES } from '../../utils/constants';
import { countBy, formatDate, formatNumber, formatRelativeTime, sumBy } from '../../utils/helpers';

export function DonorDashboard() {
  const { user } = useAuth();
  const [donateOpen, setDonateOpen] = useNewParam();

  const { data, error, loading, refreshing, refetch } = useFetch(() => donationService.list());

  // The donations endpoint returns all donations; a donor only sees their own pledges
  const mine = useMemo(() => (data || []).filter((d) => Number(d.donor_user_id) === Number(user?.user_id)), [data, user]);

  const received = mine.filter((d) => d.status === 'RECEIVED');
  const pending = mine.filter((d) => d.status === 'PENDING');
  const units = sumBy(mine, 'total_quantity');

  const byShelter = useMemo(() => {
    const totals = new Map();
    mine.forEach((d) => totals.set(d.shelter_name, (totals.get(d.shelter_name) || 0) + (Number(d.total_quantity) || 0)));
    return [...totals.entries()].map(([label, value]) => ({ label, value, icon: House })).sort((a, b) => b.value - a.value);
  }, [mine]);

  const statusMix = useMemo(() => {
    const c = countBy(mine, 'status');
    return [
      { label: 'Pending', value: c.PENDING || 0, color: 'var(--series-1)' },
      { label: 'Received', value: c.RECEIVED || 0, color: 'var(--series-2)' },
      { label: 'Cancelled', value: c.CANCELLED || 0, color: 'var(--series-3)' },
    ];
  }, [mine]);

  const columns = [
    { key: 'donation_code', header: 'Donation', render: (r) => <span className="code-chip">{r.donation_code}</span> },
    {
      key: 'shelter_name',
      header: 'Shelter',
      render: (r) => (
        <div className="cell-primary">
          <span className="cell-primary__title">{r.shelter_name}</span>
          {r.notes && <span className="cell-primary__sub truncate" style={{ maxWidth: 260 }}>{r.notes}</span>}
        </div>
      ),
    },
    {
      key: 'total_quantity',
      header: 'Items',
      align: 'right',
      sortValue: (r) => Number(r.total_quantity),
      render: (r) => (
        <span className="tabular">
          {formatNumber(r.item_count)} · {formatNumber(r.total_quantity)} units
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    {
      key: 'received_at',
      header: 'Updated',
      render: (r) => <span title={formatDate(r.received_at)}>{formatRelativeTime(r.received_at)}</span>,
    },
  ];

  if (error && !data) {
    return (
      <Card>
        <ErrorState title="Donor hub unavailable" error={error} onRetry={refetch} />
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <DashboardHero
        user={user}
        role={ROLES.DONOR}
        subtitle="Every pledge you make is tracked from submission to the shelter shelf. Thank you for showing up."
        onRefresh={refetch}
        refreshing={refreshing}
        actions={
          <Button variant="primary" leftIcon={<HandHeart />} onClick={() => setDonateOpen(true)}>
            Make a donation
          </Button>
        }
        stats={
          data
            ? [
                { label: 'Units pledged', value: formatNumber(units) },
                { label: 'Shelters supported', value: formatNumber(byShelter.length) },
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
          <StatCard label="Total donations" value={mine.length} icon={Gift} tone="var(--role-donor)" hint="Pledges you've submitted" />
          <StatCard label="Received" value={received.length} icon={CircleCheck} tone="var(--success)" hint="Now in shelter inventory" />
          <StatCard label="In transit" value={pending.length} icon={Clock3} tone="var(--warning)" hint="Awaiting shelter confirmation" />
          <StatCard label="Units donated" value={units} icon={Boxes} tone="var(--accent)" hint="Across all items" />
        </StatGrid>
      )}

      <div className="dash-grid">
        <Card className="span-8" delay={0.05}>
          <CardHeader icon={HandHeart} title="Your donations" subtitle="Newest first" />
          <div style={{ marginTop: 12 }}>
            <DataTable
              columns={columns}
              rows={mine}
              rowKey="donation_id"
              loading={loading}
              error={error}
              onRetry={refetch}
              searchKeys={['donation_code', 'shelter_name', 'notes', 'status']}
              searchPlaceholder="Search your donations…"
              pageSize={6}
              exportName="my-donations"
              empty={{
                icon: HandHeart,
                title: 'No donations yet',
                description: 'Your first pledge will appear here with live status updates.',
                action: (
                  <Button variant="primary" size="sm" leftIcon={<HandHeart />} onClick={() => setDonateOpen(true)}>
                    Make your first donation
                  </Button>
                ),
              }}
            />
          </div>
        </Card>

        <Card className="span-4" delay={0.1}>
          <CardHeader icon={PackageCheck} title="Your impact" subtitle="Units delivered per shelter" />
          <CardBody>
            <div className="donut-legend-total">
              <strong className="tabular">{formatNumber(received.length)}</strong>
              <span>of {formatNumber(mine.length)} donations received</span>
            </div>
            <StackedBar segments={statusMix} />
            <div style={{ marginTop: 26 }}>
              <div className="section-label">By shelter</div>
              <BarList data={byShelter} emptyLabel="Donate to see your impact by shelter" />
            </div>
          </CardBody>
        </Card>
      </div>

      <DonationModal open={donateOpen} onClose={() => setDonateOpen(false)} onCreated={refetch} role={ROLES.DONOR} />
    </div>
  );
}

export default DonorDashboard;
