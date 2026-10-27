import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  color,
  radius,
  listOwners,
  listAdminWashingPoints,
  useIsMobile,
  PrimaryButton,
  type Owner,
} from 'q-wash-shared';
import { PageHeader } from '../../shared/layout/PageHeader';
import { pluralRu } from '../../shared/pluralRu';
import { OwnerDrawer } from './OwnerDrawer';

const EMPTY_OWNERS: Owner[] = [];

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
  const [drawerOwner, setDrawerOwner] = useState<Owner | 'new' | null>(null);

  const ownersQuery = useQuery({
    queryKey: ['admin', 'owners'],
    queryFn: () => listOwners(),
  });

  const pointsQuery = useQuery({
    queryKey: ['admin', 'washing-points'],
    queryFn: () => listAdminWashingPoints(),
  });

  const pointNamesByOwner = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of pointsQuery.data?.items ?? []) {
      if (!p.owner_id) continue;
      map.set(p.owner_id, [...(map.get(p.owner_id) ?? []), p.name]);
    }
    return map;
  }, [pointsQuery.data]);

  const owners = ownersQuery.data?.items ?? EMPTY_OWNERS;
  const filteredOwners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.contact_name ?? '').toLowerCase().includes(q) ||
        (o.contact_phone ?? '').toLowerCase().includes(q),
    );
  }, [owners, search]);

  return (
    <>
      <PageHeader
        title="Владельцы"
        subtitle={
          ownersQuery.data
            ? `${owners.length} ${pluralRu(owners.length, ['владелец', 'владельца', 'владельцев'])}`
            : undefined
        }
      >
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
            ...(isMobile ? { flex: 1, minWidth: 0 } : { width: 250 }),
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
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
        {ownersQuery.isError && (
          <div style={{ color: color.bad, fontSize: 13 }}>Не удалось загрузить список владельцев</div>
        )}

        {ownersQuery.isLoading ? (
          <div style={{ color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
        ) : filteredOwners.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: color.textFaint, fontSize: 13 }}>Ничего не найдено</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
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
                </div>
                {o.contact_email && <div style={{ color: color.textTertiary, fontSize: 12.5 }}>{o.contact_email}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(pointNamesByOwner.get(o.id) ?? []).map((name) => (
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
              </div>
            ))}
          </div>
        )}
      </div>

      {drawerOwner && (
        <OwnerDrawer
          owner={drawerOwner === 'new' ? undefined : drawerOwner}
          onClose={() => setDrawerOwner(null)}
        />
      )}
    </>
  );
}
