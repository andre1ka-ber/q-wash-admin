import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  color,
  ApiError,
  listAdminWashingPoints,
  listQueueNetworkWide,
  updateBookingStatus,
  DataTable,
  DataTableHeaderRow,
  DataTableRow,
  StatusPill,
  PrimaryButton,
  type AdminWashingPoint,
  type BoardItem,
  type BoardItemStatus,
  type StatusPillKind,
} from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';
import { pluralRu } from '../../shared/pluralRu';

const EMPTY_POINTS: AdminWashingPoint[] = [];

// Live boards refresh every 20s — this screen is a shift monitor, someone
// stares at it, not a one-shot form (same reasoning as PointsPage's table).
const REFETCH_INTERVAL_MS = 20_000;

const STATUS_LABEL: Record<BoardItemStatus, string> = {
  queue: 'В очереди',
  waiting: 'Ожидание',
  washing: 'Моется',
};

const STATUS_KIND: Record<BoardItemStatus, StatusPillKind> = {
  queue: 'mute',
  waiting: 'warn',
  washing: 'ok',
};

const NEXT_STATUS: Record<BoardItemStatus, 'waiting' | 'washing' | 'ready'> = {
  queue: 'waiting',
  waiting: 'washing',
  washing: 'ready',
};

const NEXT_LABEL: Record<BoardItemStatus, string> = {
  queue: 'Начать ожидание',
  waiting: 'Начать мойку',
  washing: 'Завершить',
};

const TABLE_COLUMNS = '1.8fr 1.6fr 0.7fr 1.4fr 1fr 1.3fr';

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Dushanbe',
});

function formatWindow(startAt: string, endAt: string): string {
  return `${timeFormatter.format(new Date(startAt))}–${timeFormatter.format(new Date(endAt))}`;
}

interface Row extends BoardItem {
  washing_point_id: string;
  washing_point_name: string;
}

function AdvanceButton({ row }: { row: Row }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updateBookingStatus(row.id, NEXT_STATUS[row.status]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'queue', row.washing_point_id] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Не удалось выполнить запрос'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PrimaryButton
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        style={{ padding: '7px 12px', fontSize: 12 }}
      >
        {NEXT_LABEL[row.status]}
      </PrimaryButton>
      {error && <div style={{ color: color.bad, fontSize: 11 }}>{error}</div>}
    </div>
  );
}

export function BookingsPage() {
  const pointsQuery = useQuery({
    queryKey: ['admin', 'washing-points'],
    queryFn: () => listAdminWashingPoints(),
  });
  const points = pointsQuery.data?.items ?? EMPTY_POINTS;

  // GET /queue has no per-item washing_point_id in its response — the
  // network-wide network filter is real but doesn't disambiguate points on
  // its own, so this fetches one live board per point (tagging each item
  // with the point's own id/name client-side) instead of one combined
  // request. See q-wash-admin/PLAN.md's "Update 2026-08-22" for why.
  const boardQueries = useQueries({
    queries: points.map((p) => ({
      queryKey: ['admin', 'queue', p.id],
      queryFn: () => listQueueNetworkWide(p.id),
      refetchInterval: REFETCH_INTERVAL_MS,
    })),
  });

  const rows = useMemo(() => {
    const merged: Row[] = [];
    points.forEach((p, i) => {
      const data = boardQueries[i]?.data;
      if (!data) return;
      for (const item of data.items) {
        merged.push({ ...item, washing_point_id: p.id, washing_point_name: p.name });
      }
    });
    merged.sort((a, b) => a.scheduled_start_at.localeCompare(b.scheduled_start_at));
    return merged;
  }, [points, boardQueries]);

  const boardsLoading = pointsQuery.isLoading || (points.length > 0 && boardQueries.some((q) => q.isLoading));
  const boardsError = pointsQuery.isError || boardQueries.some((q) => q.isError);

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
          <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>Записи</div>
          <div style={{ color: color.textFaint, fontSize: 12 }}>
            {!boardsLoading ? `${rows.length} ${pluralRu(rows.length, ['активная запись', 'активные записи', 'активных записей'])} по сети` : ' '}
          </div>
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
        {boardsError && (
          <div style={{ color: color.bad, fontSize: 13 }}>Не удалось загрузить очередь по одной или нескольким мойкам</div>
        )}

        <DataTable>
          <DataTableHeaderRow
            gridTemplateColumns={TABLE_COLUMNS}
            columns={['Мойка', 'Клиент', 'Бокс', 'Время', 'Статус', 'Действие']}
          />
          {boardsLoading ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Сейчас в очереди никого нет</div>
          ) : (
            rows.map((row, i) => (
              <DataTableRow key={row.id} gridTemplateColumns={TABLE_COLUMNS} isLast={i === rows.length - 1}>
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
                  {row.washing_point_name}
                </div>
                <div style={{ color: color.textTertiary, fontSize: 13 }}>
                  {row.car_name ?? 'Авто'} · ••{row.customer_phone_last4}
                </div>
                <div style={{ color: color.textPrimaryAlt, fontSize: 13 }}>{row.box_number}</div>
                <div style={{ color: color.textTertiary, fontSize: 13 }}>
                  {formatWindow(row.scheduled_start_at, row.scheduled_end_at)}
                </div>
                <div>
                  <StatusPill kind={STATUS_KIND[row.status]}>{STATUS_LABEL[row.status]}</StatusPill>
                </div>
                <AdvanceButton row={row} />
              </DataTableRow>
            ))
          )}
        </DataTable>
      </div>
    </>
  );
}
