import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  color,
  radius,
  ApiError,
  listQrCodes,
  getQrCode,
  generateQrCodes,
  assignQrCode,
  unassignQrCode,
  disableQrCode,
  listAdminWashingPoints,
  resolveApiAssetUrl,
  QrCodeImage,
  StatCard,
  StatusPill,
  PrimaryButton,
  GhostButton,
  DangerButton,
  type QrCode,
  type QrCodeStatus,
  type StatusPillKind,
} from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';

const EMPTY_ITEMS: QrCode[] = [];

const STATUS_LABEL: Record<QrCodeStatus, string> = {
  free: 'Свободен',
  assigned: 'Привязан',
  disabled: 'Отключён',
};

const STATUS_KIND: Record<QrCodeStatus, StatusPillKind> = {
  free: 'mute',
  assigned: 'ok',
  disabled: 'bad',
};

type FilterValue = 'all' | QrCodeStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Свободные' },
  { value: 'assigned', label: 'Привязанные' },
  { value: 'disabled', label: 'Отключённые' },
];

const GEN_COUNTS = [10, 25, 50, 100];

// /q/{token} is a short, root-level alias for /api/v1/qr-codes/scan/{token}
// (same handler either way) — a shorter encoded string means a
// lower-version, visually cleaner QR code, especially at the pool grid's
// small thumbnail size. resolveApiAssetUrl is the same helper photos
// already use to turn a server-relative path into an absolute,
// origin-qualified URL, so a real phone camera (not just this app) can
// resolve what's encoded here.
function scanUrl(token: string): string {
  return resolveApiAssetUrl(`/q/${token}`);
}

function defaultBatchLabel(): string {
  return `Партия · ${new Date().toLocaleDateString('ru-RU')}`;
}

const sectionLabelStyle = {
  color: color.textFaint,
  fontSize: 11,
  letterSpacing: '.1em',
  textTransform: 'uppercase' as const,
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ color: color.textFaint, fontSize: 12.5 }}>{label}</span>
      <span
        style={{
          color: color.textPrimaryAlt,
          fontSize: 12.5,
          fontWeight: 600,
          textAlign: 'right',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function QrCodesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genCount, setGenCount] = useState(50);
  const [genBatchLabel, setGenBatchLabel] = useState(defaultBatchLabel);
  const [printMode, setPrintMode] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // The print-only block only mounts while printMode is true — kept out of
  // the DOM otherwise rather than CSS-hidden, since jsdom (and, for a
  // screen reader, a real browser too) doesn't reliably treat a
  // @media-print-only display:none as "not present": a permanently-mounted
  // duplicate would double every free code's text for assistive tech and
  // for any test query.
  useEffect(() => {
    if (!printMode) return;
    const id = requestAnimationFrame(() => window.print());
    const reset = () => setPrintMode(false);
    window.addEventListener('afterprint', reset);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('afterprint', reset);
    };
  }, [printMode]);

  const listQuery = useQuery({
    queryKey: ['admin', 'qr-codes', 'list', statusFilter, search],
    queryFn: () =>
      listQrCodes({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
  });

  // Unfiltered — independent of the visible filter/search, so "which
  // points already have a code" and "what's free to print" stay correct
  // no matter what the grid is currently showing.
  const allCodesQuery = useQuery({
    queryKey: ['admin', 'qr-codes', 'all'],
    queryFn: () => listQrCodes(),
  });

  const pointsQuery = useQuery({
    queryKey: ['admin', 'washing-points'],
    queryFn: () => listAdminWashingPoints(),
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'qr-codes', 'detail', selectedId],
    queryFn: () => getQrCode(selectedId as string),
    enabled: selectedId != null,
  });

  const items = listQuery.data?.items ?? EMPTY_ITEMS;
  const stats = listQuery.data?.stats;
  const selected = detailQuery.data ?? null;

  const pointsWithoutCode = useMemo(() => {
    const assigned = new Set(
      (allCodesQuery.data?.items ?? []).map((c) => c.washing_point_id).filter((id): id is string => id != null),
    );
    return (pointsQuery.data?.items ?? []).filter((p) => !assigned.has(p.id));
  }, [allCodesQuery.data, pointsQuery.data]);

  const freeCodesForPrint = useMemo(
    () => (allCodesQuery.data?.items ?? []).filter((c) => c.status === 'free'),
    [allCodesQuery.data],
  );

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'qr-codes'] });
  }

  const assignMutation = useMutation({
    mutationFn: (washingPointId: string) => assignQrCode(selectedId as string, washingPointId),
    onSuccess: () => {
      setActionError(null);
      invalidateAll();
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Не удалось привязать код'),
  });

  const unassignMutation = useMutation({
    mutationFn: () => unassignQrCode(selectedId as string),
    onSuccess: () => {
      setActionError(null);
      invalidateAll();
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Не удалось отвязать код'),
  });

  const disableMutation = useMutation({
    mutationFn: () => disableQrCode(selectedId as string),
    onSuccess: () => {
      setActionError(null);
      invalidateAll();
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Не удалось отключить код'),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateQrCodes(genCount, genBatchLabel.trim()),
    onSuccess: () => {
      invalidateAll();
      setGenOpen(false);
      setGenBatchLabel(defaultBatchLabel());
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Не удалось сгенерировать партию'),
  });

  function handlePrint() {
    setPrintMode(true);
  }

  return (
    <>
      {printMode && (
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .qr-print-only, .qr-print-only * { visibility: visible; }
            .qr-print-only { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `}</style>
      )}

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
          <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>QR-коды</div>
          <div style={{ color: color.textFaint, fontSize: 12 }}>
            {stats ? `${stats.total} кодов` : ' '}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <GhostButton onClick={handlePrint} disabled={freeCodesForPrint.length === 0}>
            Печать свободных · PDF
          </GhostButton>
          <PrimaryButton onClick={() => setGenOpen(true)}>Сгенерировать партию</PrimaryButton>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: '22px 28px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <StatCard label="Всего" value={stats?.total ?? '—'} />
            <StatCard label="Свободно" value={stats?.free ?? '—'} />
            <StatCard label="Привязано" value={stats?.assigned ?? '—'} />
            <StatCard label="Отключено" value={stats?.disabled ?? '—'} />
          </div>

          {listQuery.isError && <div style={{ color: color.bad, fontSize: 13 }}>Не удалось загрузить пул кодов</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <div
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по коду QW-…"
              style={{
                marginLeft: 'auto',
                padding: '9px 14px',
                borderRadius: radius.md,
                background: color.input,
                border: `1px solid ${color.borderStrong}`,
                color: color.textPrimaryAlt,
                fontSize: 13,
                width: 220,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }}>
            {listQuery.isLoading ? (
              <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 20, color: color.textFaint, fontSize: 13 }}>Ничего не найдено</div>
            ) : (
              items.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    padding: 12,
                    borderRadius: radius.xl,
                    background: color.panel,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    border: `1px solid ${c.id === selectedId ? color.gold : color.borderAlt}`,
                  }}
                >
                  <div
                    style={{
                      padding: 10,
                      borderRadius: radius.md,
                      background: c.status === 'disabled' ? '#C9C7BF' : '#F6F5EF',
                      opacity: c.status === 'disabled' ? 0.55 : 1,
                      aspectRatio: '1',
                      boxSizing: 'border-box',
                    }}
                  >
                    <QrCodeImage value={scanUrl(c.token)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <div style={{ color: color.textPrimaryAlt, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {c.code}
                    </div>
                    <StatusPill kind={STATUS_KIND[c.status]}>{STATUS_LABEL[c.status]}</StatusPill>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: c.washing_point_name ? color.textSecondary : color.textFaint,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.washing_point_name ?? (c.status === 'disabled' ? 'не используется' : 'не привязан')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            width: 340,
            flex: '0 0 340px',
            borderLeft: `1px solid ${color.borderAlt}`,
            background: color.panelAlt,
            overflowY: 'auto',
            padding: 24,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {selectedId == null ? (
            <div style={{ color: color.textFaint, fontSize: 13 }}>Выберите код слева</div>
          ) : detailQuery.isLoading ? (
            <div style={{ color: color.textFaint, fontSize: 13 }}>Загрузка…</div>
          ) : selected ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: color.textPrimary, fontSize: 22, fontWeight: 700 }}>{selected.code}</div>
                <StatusPill kind={STATUS_KIND[selected.status]}>{STATUS_LABEL[selected.status]}</StatusPill>
              </div>

              <div style={{ padding: 18, borderRadius: radius.xxl, background: '#F6F5EF' }}>
                <QrCodeImage value={scanUrl(selected.token)} />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '14px 16px',
                  borderRadius: radius.lg,
                  background: color.panel,
                  border: `1px solid ${color.borderAlt}`,
                }}
              >
                <DetailRow label="Ссылка" value={scanUrl(selected.token)} />
                <DetailRow label="Партия" value={selected.batch_label} />
                <DetailRow label="Мойка" value={selected.washing_point_name ?? '—'} />
              </div>

              {actionError && <div style={{ color: color.bad, fontSize: 12 }}>{actionError}</div>}

              {selected.status === 'free' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={sectionLabelStyle}>Привязать к мойке без QR</div>
                  {pointsWithoutCode.length === 0 ? (
                    <div style={{ color: color.textFaint, fontSize: 12.5 }}>У всех моек уже есть QR-код</div>
                  ) : (
                    pointsWithoutCode.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => !assignMutation.isPending && assignMutation.mutate(p.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderRadius: radius.lg,
                          background: color.panel,
                          border: `1px solid ${color.borderAlt}`,
                          cursor: assignMutation.isPending ? 'default' : 'pointer',
                          opacity: assignMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: color.textPrimaryAlt, fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                          <span style={{ color: color.textFaint, fontSize: 11.5 }}>{p.address}</span>
                        </div>
                        <span style={{ color: color.gold, fontSize: 12.5, fontWeight: 700 }}>Привязать</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selected.status === 'assigned' && (
                <>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <StatCard label="Сканов за 7 дней" value={selected.stats?.scans_7d ?? '—'} />
                    <StatCard label="Записей" value={selected.stats?.bookings_via_qr ?? '—'} />
                  </div>
                  <GhostButton onClick={() => unassignMutation.mutate()} disabled={unassignMutation.isPending}>
                    Отвязать и вернуть в пул
                  </GhostButton>
                </>
              )}

              {selected.status !== 'disabled' && (
                <DangerButton onClick={() => disableMutation.mutate()} disabled={disableMutation.isPending}>
                  Отключить код (повреждён/утерян)
                </DangerButton>
              )}

              {selected.status === 'disabled' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: radius.lg,
                    background: color.badBg,
                    color: color.bad,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                  }}
                >
                  Код отключён. При сканировании клиент увидит сообщение, что наклейка недействительна.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {genOpen && (
        <div
          onClick={() => setGenOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,8,7,.66)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 480, borderRadius: 22, background: '#171714', border: `1px solid ${color.borderStrong}`, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${color.borderAlt}` }}>
              <div style={{ color: color.textPrimary, fontSize: 18, fontWeight: 700 }}>Новая партия QR-кодов</div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={sectionLabelStyle}>Количество</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GEN_COUNTS.map((n) => (
                    <div
                      key={n}
                      onClick={() => setGenCount(n)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '11px 0',
                        borderRadius: radius.md,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        ...(genCount === n
                          ? { background: color.gold, color: color.goldOnLight }
                          : { background: color.input, border: `1px solid ${color.borderStrong}`, color: color.textSecondary }),
                      }}
                    >
                      {n} шт
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={sectionLabelStyle}>Название партии</div>
                <input
                  value={genBatchLabel}
                  onChange={(e) => setGenBatchLabel(e.target.value)}
                  style={{
                    padding: '13px 14px',
                    borderRadius: radius.lg,
                    background: color.input,
                    border: `1px solid ${color.borderStrong}`,
                    color: color.textPrimaryAlt,
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px 22px', borderTop: `1px solid ${color.borderAlt}`, display: 'flex', gap: 10 }}>
              <GhostButton onClick={() => setGenOpen(false)} style={{ flex: 1 }}>
                Отмена
              </GhostButton>
              <PrimaryButton
                disabled={generateMutation.isPending || genBatchLabel.trim() === ''}
                onClick={() => generateMutation.mutate()}
                style={{ flex: 2 }}
              >
                {generateMutation.isPending ? 'Генерация…' : `Сгенерировать ${genCount} кодов`}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {printMode && (
        <div className="qr-print-only" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: 24 }}>
          {freeCodesForPrint.map((c) => (
            <div
              key={c.id}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 12, border: '1px solid #ccc' }}
            >
              <QrCodeImage value={scanUrl(c.token)} size={140} background="#ffffff" foreground="#000000" />
              <div style={{ fontWeight: 700 }}>{c.code}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
