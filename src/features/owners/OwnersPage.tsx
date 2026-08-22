import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  color,
  radius,
  listOwners,
  DataTable,
  DataTableHeaderRow,
  DataTableRow,
  PrimaryButton,
  type Owner,
} from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';
import { pluralRu } from '../../shared/pluralRu';
import { OwnerDrawer } from './OwnerDrawer';

const EMPTY_OWNERS: Owner[] = [];

const TABLE_COLUMNS = '2fr 1.6fr 1.4fr 1.8fr';

export function OwnersPage() {
  const [search, setSearch] = useState('');
  const [drawerOwner, setDrawerOwner] = useState<Owner | 'new' | null>(null);

  const ownersQuery = useQuery({
    queryKey: ['admin', 'owners'],
    queryFn: () => listOwners(),
  });

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
          <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>Владельцы</div>
          <div style={{ color: color.textFaint, fontSize: 12 }}>
            {ownersQuery.data ? `${owners.length} ${pluralRu(owners.length, ['владелец', 'владельца', 'владельцев'])}` : ' '}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
              width: 250,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <PrimaryButton onClick={() => setDrawerOwner('new')}>+ Новый владелец</PrimaryButton>
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
        {ownersQuery.isError && (
          <div style={{ color: color.bad, fontSize: 13 }}>Не удалось загрузить список владельцев</div>
        )}

        <DataTable>
          <DataTableHeaderRow
            gridTemplateColumns={TABLE_COLUMNS}
            columns={['Название', 'Контактное лицо', 'Телефон', 'Email']}
          />
          {ownersQuery.isLoading ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
          ) : filteredOwners.length === 0 ? (
            <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Ничего не найдено</div>
          ) : (
            filteredOwners.map((o, i) => (
              <DataTableRow
                key={o.id}
                gridTemplateColumns={TABLE_COLUMNS}
                isLast={i === filteredOwners.length - 1}
              >
                <div
                  onClick={() => setDrawerOwner(o)}
                  style={{ color: color.textPrimaryAlt, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  {o.name}
                </div>
                <div style={{ color: color.textTertiary, fontSize: 13 }}>{o.contact_name ?? '—'}</div>
                <div style={{ color: color.textTertiary, fontSize: 13 }}>{o.contact_phone ?? '—'}</div>
                <div style={{ color: color.textTertiary, fontSize: 13 }}>{o.contact_email ?? '—'}</div>
              </DataTableRow>
            ))
          )}
        </DataTable>
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
