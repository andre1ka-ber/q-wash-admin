import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  color,
  radius,
  ApiError,
  listConnectionRequests,
  reviewConnectionRequest,
  DataTable,
  DataTableHeaderRow,
  DataTableRow,
  StatusPill,
  PrimaryButton,
  DangerButton,
  type ConnectionRequest,
  type ConnectionRequestStatus,
  type StatusPillKind,
} from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';
import { pluralRu } from '../../shared/pluralRu';
import { ConnectionRequestDrawer } from './ConnectionRequestDrawer';

const EMPTY_REQUESTS: ConnectionRequest[] = [];

const TABS: { key: ConnectionRequestStatus | 'all'; label: string }[] = [
  { key: 'new', label: 'Новые' },
  { key: 'approved', label: 'Одобренные' },
  { key: 'rejected', label: 'Отклонённые' },
  { key: 'all', label: 'Все' },
];

const STATUS_LABEL: Record<ConnectionRequestStatus, string> = {
  new: 'Новая',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

const STATUS_KIND: Record<ConnectionRequestStatus, StatusPillKind> = {
  new: 'warn',
  approved: 'ok',
  rejected: 'bad',
};

const TABLE_COLUMNS = '2fr 1.3fr 1.8fr 0.6fr 1fr 1.8fr';

function ReviewActions({ request }: { request: ConnectionRequest }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: 'approved' | 'rejected') => reviewConnectionRequest(request.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'washing-points'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Не удалось выполнить запрос'),
  });

  if (request.status !== 'new') {
    return <div style={{ color: color.textFaint, fontSize: 12 }}>{STATUS_LABEL[request.status]}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <PrimaryButton
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('approved')}
          style={{ padding: '7px 12px', fontSize: 12 }}
        >
          Одобрить
        </PrimaryButton>
        <DangerButton
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('rejected')}
          style={{ padding: '7px 12px', fontSize: 12 }}
        >
          Отклонить
        </DangerButton>
      </div>
      {error && <div style={{ color: color.bad, fontSize: 11 }}>{error}</div>}
    </div>
  );
}

export function ConnectionRequestsPage() {
  const [tab, setTab] = useState<ConnectionRequestStatus | 'all'>('new');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const requestsQuery = useQuery({
    queryKey: ['admin', 'connection-requests', tab],
    queryFn: () => listConnectionRequests(tab === 'all' ? undefined : tab),
  });

  const requests = requestsQuery.data?.items ?? EMPTY_REQUESTS;

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
          <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>Заявки на подключение</div>
          <div style={{ color: color.textFaint, fontSize: 12 }}>
            {requestsQuery.data ? `${requests.length} ${pluralRu(requests.length, ['заявка', 'заявки', 'заявок'])}` : ' '}
          </div>
        </div>
        <PrimaryButton onClick={() => setDrawerOpen(true)}>+ Новая заявка</PrimaryButton>
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
        <div style={{ display: 'flex', gap: 8 }}>
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <div
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '9px 16px',
                  borderRadius: radius.md,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: active ? color.gold : color.input,
                  color: active ? color.goldOnLight : color.textSecondary,
                  border: `1px solid ${active ? color.gold : color.borderStrong}`,
                }}
              >
                {t.label}
              </div>
            );
          })}
        </div>

        {requestsQuery.isError && (
          <div style={{ color: color.bad, fontSize: 13 }}>Не удалось загрузить список заявок</div>
        )}

        <DataTable>
          <DataTableHeaderRow
            gridTemplateColumns={TABLE_COLUMNS}
            columns={['Бизнес', 'Телефон', 'Адрес', 'Боксы', 'Статус', 'Действие']}
          />
          {requestsQuery.isLoading ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Ничего не найдено</div>
          ) : (
            requests.map((r, i) => (
              <DataTableRow key={r.id} gridTemplateColumns={TABLE_COLUMNS} isLast={i === requests.length - 1}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <div style={{ color: color.textPrimaryAlt, fontSize: 14, fontWeight: 600 }}>{r.business_name}</div>
                  <div style={{ color: color.textFaint, fontSize: 12 }}>{r.contact_name}</div>
                </div>
                <div style={{ color: color.textTertiary, fontSize: 13 }}>{r.contact_phone}</div>
                <div
                  style={{
                    color: color.textTertiary,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.address}
                </div>
                <div style={{ color: color.textPrimaryAlt, fontSize: 13 }}>{r.boxes_count}</div>
                <div>
                  <StatusPill kind={STATUS_KIND[r.status]}>{STATUS_LABEL[r.status]}</StatusPill>
                </div>
                <ReviewActions request={r} />
              </DataTableRow>
            ))
          )}
        </DataTable>
      </div>

      {drawerOpen && <ConnectionRequestDrawer onClose={() => setDrawerOpen(false)} />}
    </>
  );
}
