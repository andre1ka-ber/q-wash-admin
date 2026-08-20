import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  color,
  radius,
  listAdminWashingPoints,
  getAdminStats,
  StatCard,
  StatusPill,
  DataTable,
  DataTableHeaderRow,
  DataTableRow,
  PrimaryButton,
  type AdminWashingPoint,
  type StatusPillKind,
  type WashingPointStatus,
} from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';
import { NewPointDrawer } from './NewPointDrawer';

const EMPTY_POINTS: AdminWashingPoint[] = [];

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

const TABLE_COLUMNS = '2.4fr 1.6fr 0.9fr 1fr 1fr 60px';

export function PointsPage() {
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const pointsQuery = useQuery({
    queryKey: ['admin', 'washing-points'],
    queryFn: () => listAdminWashingPoints(),
  });
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => getAdminStats(),
  });

  const points = pointsQuery.data?.items ?? EMPTY_POINTS;
  const filteredPoints = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return points;
    return points.filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    );
  }, [points, search]);

  const stats = statsQuery.data;

  return (
    <>
      <div
        style={{
          height: HEADER_HEIGHT,
          flex: `0 0 ${HEADER_HEIGHT}px`,
          borderBottom: `1px solid ${color.borderAlt}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>Мойки</div>
          <div style={{ color: color.textFaint, fontSize: 12 }}>
            {stats ? `${stats.points_total} точек · ${stats.points_active} активных` : ' '}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или адресу"
            style={{
              padding: '10px 14px',
              borderRadius: radius.md,
              background: color.input,
              border: `1px solid ${color.borderStrong}`,
              color: color.textPrimaryAlt,
              fontSize: 13,
              width: 250,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <PrimaryButton onClick={() => setWizardOpen(true)}>+ Новая мойка</PrimaryButton>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <StatCard label="Точек в сети" value={stats?.points_total ?? '—'} />
          <StatCard label="Записей сегодня" value={stats?.bookings_today ?? '—'} />
          <StatCard
            label="Средняя загрузка"
            value={stats ? `${Math.round(stats.average_utilization * 100)}%` : '—'}
          />
          <StatCard label="Отмены" value={stats?.canceled_today ?? '—'} />
        </div>

        {pointsQuery.isError && (
          <div style={{ color: color.bad, fontSize: 13 }}>Не удалось загрузить список моек</div>
        )}

        <DataTable>
          <DataTableHeaderRow
            gridTemplateColumns={TABLE_COLUMNS}
            columns={['Мойка', 'Адрес', 'Боксы', 'Услуги', 'Статус', '']}
          />
          {pointsQuery.isLoading ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
          ) : filteredPoints.length === 0 ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Ничего не найдено</div>
          ) : (
            filteredPoints.map((p, i) => (
              <DataTableRow key={p.id} gridTemplateColumns={TABLE_COLUMNS} isLast={i === filteredPoints.length - 1}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      flex: '0 0 38px',
                      borderRadius: 11,
                      background: 'repeating-linear-gradient(135deg,#292229 0 7px,#221c22 7px 14px)',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
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
                    <div style={{ color: color.textFaint, fontSize: 12 }}>{p.owner_name ?? 'Без владельца'}</div>
                  </div>
                </div>
                <div
                  style={{
                    color: color.textTertiary,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.address}
                </div>
                <div style={{ color: color.textPrimaryAlt, fontSize: 13 }}>{p.boxes_count}</div>
                <div style={{ color: color.textPrimaryAlt, fontSize: 13 }}>{p.services_count}</div>
                <div>
                  <StatusPill kind={STATUS_KIND[p.status]}>{STATUS_LABEL[p.status]}</StatusPill>
                </div>
                <div style={{ color: color.textFaint, fontSize: 16, textAlign: 'right' }}>⋯</div>
              </DataTableRow>
            ))
          )}
        </DataTable>
      </div>

      {wizardOpen && <NewPointDrawer onClose={() => setWizardOpen(false)} />}
    </>
  );
}
