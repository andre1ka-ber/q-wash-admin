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
  useIsMobile,
  type AdminWashingPoint,
  type StatusPillKind,
  type WashingPointStatus,
} from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';
import { pluralRu } from '../../shared/pluralRu';
import { NewPointDrawer } from './NewPointDrawer';
import { BOTTOM_NAV_HEIGHT } from '../../shared/layout/BottomNav';

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

type StatusFilter = 'all' | WashingPointStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активна' },
  { value: 'paused', label: 'На паузе' },
  { value: 'pending_review', label: 'Проверка' },
];

export function PointsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [wizardOpen, setWizardOpen] = useState(false);
  const isMobile = useIsMobile();

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
    return points.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    });
  }, [points, search, statusFilter]);

  const stats = statsQuery.data;

  return (
    <>
      <div
        style={{
          minHeight: HEADER_HEIGHT,
          flex: `0 0 auto`,
          borderBottom: `1px solid ${color.borderAlt}`,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 12 : 0,
          padding: isMobile ? '16px 18px' : '0 30px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>Мойки</div>
          <div style={{ color: color.textFaint, fontSize: 12 }}>
            {stats
              ? `${stats.points_total} ${pluralRu(stats.points_total, ['точка', 'точки', 'точек'])} · ${
                  stats.points_active
                } ${pluralRu(stats.points_active, ['активная', 'активные', 'активных'])}`
              : ' '}
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
              width: isMobile ? '100%' : 250,
              flex: isMobile ? 1 : undefined,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {!isMobile && <PrimaryButton onClick={() => setWizardOpen(true)}>+ Новая мойка</PrimaryButton>}
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

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {STATUS_FILTERS.map((f) => (
            <div
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                flex: '0 0 auto',
                padding: '9px 14px',
                borderRadius: radius.md,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                ...(statusFilter === f.value
                  ? { background: color.gold, color: color.goldOnLight }
                  : { background: color.input, border: `1px solid ${color.borderStrong}`, color: color.textSecondary }),
              }}
            >
              {f.label}
            </div>
          ))}
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pointsQuery.isLoading ? (
              <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
            ) : filteredPoints.length === 0 ? (
              <div style={{ padding: 20, color: color.textFaint, fontSize: 13, textAlign: 'center' }}>
                Ничего не найдено
              </div>
            ) : (
              filteredPoints.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: 14,
                    borderRadius: radius.xxl,
                    background: color.panel,
                    border: `1px solid ${color.borderAlt}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        flex: '0 0 44px',
                        borderRadius: 12,
                        background: 'repeating-linear-gradient(135deg,#292229 0 7px,#221c22 7px 14px)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div
                        style={{
                          color: color.textPrimaryAlt,
                          fontSize: 14.5,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          color: color.textFaint,
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.address}
                      </div>
                    </div>
                    <StatusPill kind={STATUS_KIND[p.status]}>{STATUS_LABEL[p.status]}</StatusPill>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    <div style={{ padding: '8px 10px', borderRadius: radius.sm, background: color.panelAlt, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: color.textFaint, fontSize: 10.5 }}>Боксы</span>
                      <span style={{ color: color.textPrimaryAlt, fontSize: 13, fontWeight: 600 }}>{p.boxes_count}</span>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: radius.sm, background: color.panelAlt, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: color.textFaint, fontSize: 10.5 }}>Услуги</span>
                      <span style={{ color: color.textPrimaryAlt, fontSize: 13, fontWeight: 600 }}>{p.services_count}</span>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: radius.sm, background: color.panelAlt, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ color: color.textFaint, fontSize: 10.5 }}>Владелец</span>
                      <span
                        style={{
                          color: color.textPrimaryAlt,
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.owner_name ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
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
        )}
      </div>

      {isMobile && (
        <div
          onClick={() => setWizardOpen(true)}
          style={{
            position: 'fixed',
            right: 18,
            bottom: BOTTOM_NAV_HEIGHT + 16,
            zIndex: 14,
            height: 52,
            padding: '0 20px',
            borderRadius: radius.xxl,
            background: color.gold,
            color: color.goldOnLight,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,.45)',
          }}
        >
          + Новая мойка
        </div>
      )}

      {wizardOpen && <NewPointDrawer onClose={() => setWizardOpen(false)} />}
    </>
  );
}
