import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  color,
  listAdminWashingPoints,
  getAdminStats,
  listQueueNetworkWide,
  StatCard,
  StatusPill,
  DataTable,
  DataTableHeaderRow,
  DataTableRow,
  type AdminWashingPoint,
  type StatusPillKind,
  type WashingPointStatus,
} from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';

const EMPTY_POINTS: AdminWashingPoint[] = [];

// Live board polling, same key/cadence as BookingsPage — if both screens
// are open in different tabs they share one cache entry per point instead
// of double-fetching.
const REFETCH_INTERVAL_MS = 20_000;

const STATUS_LABEL: Record<WashingPointStatus, string> = {
  active: 'Активна',
  paused: 'На паузе',
  pending_review: 'Проверка',
};

const STATUS_KIND: Record<WashingPointStatus, StatusPillKind> = {
  active: 'ok',
  paused: 'bad',
  pending_review: 'warn',
};

const TABLE_COLUMNS = '2.4fr 1fr 0.8fr 0.8fr 1.2fr';

function formatPercent(ratio: number | null): string {
  return ratio === null ? '—' : `${Math.round(ratio * 100)}%`;
}

export function AnalyticsPage() {
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => getAdminStats(),
  });
  const pointsQuery = useQuery({
    queryKey: ['admin', 'washing-points'],
    queryFn: () => listAdminWashingPoints(),
  });
  const points = pointsQuery.data?.items ?? EMPTY_POINTS;

  // No per-point "bookings today" endpoint exists (GET /admin/stats is
  // network-wide only) — rather than fake a breakdown, this shows each
  // point's real *current* queue length instead, same per-point fetch
  // pattern BookingsPage uses (GET /queue has no washing_point_id on its
  // items, see q-wash-admin/PLAN.md's "Update 2026-08-22").
  const boardQueries = useQueries({
    queries: points.map((p) => ({
      queryKey: ['admin', 'queue', p.id],
      queryFn: () => listQueueNetworkWide(p.id),
      refetchInterval: REFETCH_INTERVAL_MS,
    })),
  });

  const stats = statsQuery.data;
  const activeRatio = useMemo(
    () => (stats && stats.points_total > 0 ? stats.points_active / stats.points_total : null),
    [stats],
  );
  const cancellationRate = useMemo(() => {
    if (!stats) return null;
    const total = stats.bookings_today + stats.canceled_today;
    return total > 0 ? stats.canceled_today / total : null;
  }, [stats]);

  const boardsLoading = pointsQuery.isLoading || (points.length > 0 && boardQueries.some((q) => q.isLoading));

  return (
    <>
      <div
        style={{
          height: HEADER_HEIGHT,
          flex: `0 0 ${HEADER_HEIGHT}px`,
          borderBottom: `1px solid ${color.borderAlt}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 30px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>Аналитика</div>
          <div style={{ color: color.textFaint, fontSize: 12 }}>Сегодня · сеть целиком</div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '24px 30px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          <StatCard label="Точек в сети" value={stats?.points_total ?? '—'} />
          <StatCard label="Активных точек" value={stats ? `${stats.points_active} (${formatPercent(activeRatio)})` : '—'} />
          <StatCard
            label="Средняя загрузка"
            value={stats ? `${Math.round(stats.average_utilization * 100)}%` : '—'}
          />
          <StatCard label="Записей сегодня" value={stats?.bookings_today ?? '—'} />
          <StatCard label="Отмен сегодня" value={stats?.canceled_today ?? '—'} />
          <StatCard label="Доля отмен" value={formatPercent(cancellationRate)} />
        </div>

        <div style={{ color: color.textMuted, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          По точкам
        </div>

        <DataTable>
          <DataTableHeaderRow
            gridTemplateColumns={TABLE_COLUMNS}
            columns={['Мойка', 'Статус', 'Боксы', 'Услуги', 'В очереди сейчас']}
          />
          {pointsQuery.isLoading ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
          ) : points.length === 0 ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Точек пока нет</div>
          ) : (
            points.map((p, i) => (
              <DataTableRow key={p.id} gridTemplateColumns={TABLE_COLUMNS} isLast={i === points.length - 1}>
                <div
                  style={{
                    color: color.textPrimaryAlt,
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.name}
                </div>
                <div>
                  <StatusPill kind={STATUS_KIND[p.status]}>{STATUS_LABEL[p.status]}</StatusPill>
                </div>
                <div style={{ color: color.textPrimaryAlt, fontSize: 13 }}>{p.boxes_count}</div>
                <div style={{ color: color.textPrimaryAlt, fontSize: 13 }}>{p.services_count}</div>
                <div style={{ color: color.textPrimaryAlt, fontSize: 13 }}>
                  {boardsLoading ? '…' : (boardQueries[i]?.data?.items.length ?? '—')}
                </div>
              </DataTableRow>
            ))
          )}
        </DataTable>
      </div>
    </>
  );
}
