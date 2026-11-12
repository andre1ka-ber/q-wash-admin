import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  color,
  radius,
  listOwners,
  listAdminWashingPoints,
  updateWashingPoint,
  useIsMobile,
  PrimaryButton,
  GhostButton,
  ConfirmDialog,
  StatusPill,
  type Owner,
} from 'q-wash-shared';
import { PageHeader } from '../../shared/layout/PageHeader';
import { pluralRu } from '../../shared/pluralRu';
import { OwnerDrawer } from './OwnerDrawer';
import { OWNER_STATUS_KIND, OWNER_STATUS_LABEL, ownerStatus, pointsByOwner, type OwnerStatus } from './ownerStatus';

const EMPTY_OWNERS: Owner[] = [];

type OwnerFilter = 'all' | 'pending' | 'active' | 'paused';

const OWNER_FILTERS: { value: OwnerFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'Заявки' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'На паузе' },
];

type PendingAction = { owner: Owner; decision: 'approve' | 'reject' };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function OwnersPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OwnerFilter>('all');
  const [drawerOwner, setDrawerOwner] = useState<Owner | 'new' | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const queryClient = useQueryClient();

  const ownersQuery = useQuery({
    queryKey: ['admin', 'owners'],
    queryFn: () => listOwners(),
  });

  const pointsQuery = useQuery({
    queryKey: ['admin', 'washing-points'],
    queryFn: () => listAdminWashingPoints(),
  });

  const ownerPoints = useMemo(() => pointsByOwner(pointsQuery.data?.items ?? []), [pointsQuery.data]);
  const statusOf = (ownerId: string): OwnerStatus => ownerStatus(ownerPoints.get(ownerId) ?? []);

  // Approving activates the owner's points that are waiting for review;
  // rejecting pauses them. Both are plain status changes (reversible in the
  // point's edit drawer), not deletions.
  const decide = useMutation({
    mutationFn: async ({ owner, decision }: PendingAction) => {
      const waiting = (ownerPoints.get(owner.id) ?? []).filter((p) => p.status === 'pending_review');
      await Promise.all(
        waiting.map((p) => updateWashingPoint(p.id, { status: decision === 'approve' ? 'active' : 'paused' })),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'washing-points'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setPendingAction(null);
    },
    onError: () => setPendingAction(null),
  });

  const owners = ownersQuery.data?.items ?? EMPTY_OWNERS;
  const pendingCount = owners.filter((o) => statusOf(o.id) === 'pending').length;
  const filteredOwners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return owners.filter((o) => {
      if (filter !== 'all' && ownerStatus(ownerPoints.get(o.id) ?? []) !== filter) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        (o.contact_name ?? '').toLowerCase().includes(q) ||
        (o.contact_phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [owners, search, filter, ownerPoints]);

  return (
    <>
      <PageHeader
        title="Владельцы"
        subtitle={
          ownersQuery.data
            ? `${owners.length} ${pluralRu(owners.length, ['владелец', 'владельца', 'владельцев'])}${
                pendingCount > 0 ? ` · ${pendingCount} на проверке` : ''
              }`
            : undefined
        }
      >
        <PrimaryButton onClick={() => setDrawerOwner('new')}>+ Новый владелец</PrimaryButton>
      </PageHeader>

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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: '0 0 auto' }}>
            {OWNER_FILTERS.map((f) => (
              <div
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  flex: '0 0 auto',
                  padding: '9px 14px',
                  borderRadius: radius.md,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  ...(filter === f.value
                    ? { background: color.gold, color: color.goldOnLight }
                    : { background: color.input, border: `1px solid ${color.borderStrong}`, color: color.textSecondary }),
                }}
              >
                {f.label}
              </div>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону"
            style={{
              padding: '10px 14px',
              borderRadius: radius.md,
              background: color.input,
              border: `1px solid ${color.borderStrong}`,
              color: color.textPrimaryAlt,
              fontSize: 13,
              marginLeft: isMobile ? 0 : 'auto',
              ...(isMobile ? { flex: '1 1 100%', minWidth: 0 } : { width: 250 }),
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {decide.isError && <div style={{ color: color.bad, fontSize: 13 }}>Не удалось изменить статус мойки</div>}

        {ownersQuery.isError && (
          <div style={{ color: color.bad, fontSize: 13 }}>Не удалось загрузить список владельцев</div>
        )}

        {ownersQuery.isLoading ? (
          <div style={{ color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
        ) : filteredOwners.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: color.textFaint, fontSize: 13 }}>Ничего не найдено</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {filteredOwners.map((o) => (
              <div
                key={o.id}
                onClick={() => setDrawerOwner(o)}
                style={{
                  padding: 18,
                  borderRadius: radius.xxl,
                  background: color.panel,
                  border: `1px solid ${color.borderAlt}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      flex: '0 0 44px',
                      borderRadius: '50%',
                      background: color.muteBg,
                      color: color.textPrimaryAlt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {initials(o.contact_name ?? o.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div
                      style={{
                        color: color.textPrimaryAlt,
                        fontSize: 15,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {o.name}
                    </div>
                    <div style={{ color: color.textTertiary, fontSize: 12.5 }}>
                      {o.contact_name ?? '—'} · {o.contact_phone ?? '—'}
                    </div>
                  </div>
                  {statusOf(o.id) !== 'none' && (
                    <StatusPill kind={OWNER_STATUS_KIND[statusOf(o.id) as Exclude<OwnerStatus, 'none'>]}>
                      {OWNER_STATUS_LABEL[statusOf(o.id) as Exclude<OwnerStatus, 'none'>]}
                    </StatusPill>
                  )}
                </div>
                {o.contact_email && <div style={{ color: color.textTertiary, fontSize: 12.5 }}>{o.contact_email}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(ownerPoints.get(o.id) ?? []).map((p) => p.name).map((name) => (
                    <span
                      key={name}
                      style={{
                        padding: '6px 10px',
                        borderRadius: radius.sm,
                        background: color.panelAlt,
                        border: `1px solid ${color.borderAlt}`,
                        color: color.textSecondary,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
                {statusOf(o.id) === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <PrimaryButton style={{ flex: 1 }} onClick={() => setPendingAction({ owner: o, decision: 'approve' })}>
                      Одобрить
                    </PrimaryButton>
                    <GhostButton style={{ flex: 1 }} onClick={() => setPendingAction({ owner: o, decision: 'reject' })}>
                      Отклонить
                    </GhostButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.decision === 'approve' ? 'Одобрить заявку?' : 'Отклонить заявку?'}
          message={
            pendingAction.decision === 'approve'
              ? `Мойки «${pendingAction.owner.name}» станут активными и появятся в приложении.`
              : `Мойки «${pendingAction.owner.name}» будут поставлены на паузу. Статус можно вернуть в карточке мойки.`
          }
          confirmLabel={pendingAction.decision === 'approve' ? 'Одобрить' : 'Отклонить'}
          danger={pendingAction.decision === 'reject'}
          onConfirm={() => decide.mutate(pendingAction)}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {drawerOwner && (
        <OwnerDrawer
          owner={drawerOwner === 'new' ? undefined : drawerOwner}
          onClose={() => setDrawerOwner(null)}
        />
      )}
    </>
  );
}
