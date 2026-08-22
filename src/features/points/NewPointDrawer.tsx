import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LatLngLiteral } from 'leaflet';
import {
  color,
  font,
  radius,
  ApiError,
  listOwners,
  createWashingPoint,
  GhostButton,
  PrimaryButton,
  type WashingPointStatus,
} from 'q-wash-shared';
import { LocationPicker } from './LocationPicker';

export interface NewPointDrawerProps {
  onClose: () => void;
}

const STATUS_OPTIONS: { value: WashingPointStatus; label: string }[] = [
  { value: 'active', label: 'Активна' },
  { value: 'paused', label: 'На паузе' },
  { value: 'pending_review', label: 'Проверка' },
];

const inputStyle = {
  padding: '14px 16px',
  borderRadius: radius.lg,
  background: color.input,
  border: `1px solid ${color.borderStrong}`,
  color: color.textSecondary,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
};

const labelStyle = {
  color: color.textMuted,
  fontSize: 12,
  letterSpacing: '.08em',
  textTransform: 'uppercase' as const,
};

// The mock's 3-step wizard assumed a step-2 service form reusing
// q-wash-cabinet — but that app isn't built yet, so there's nothing to
// reuse. Collapsed to one real step instead (decided with the user,
// 2026-08-22): this creates the point for real via POST /washing-points.
// Services get added once a real service-CRUD screen exists somewhere.
export function NewPointDrawer({ onClose }: NewPointDrawerProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [boxesCount, setBoxesCount] = useState('2');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [status, setStatus] = useState<WashingPointStatus>('active');
  const [location, setLocation] = useState<LatLngLiteral | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const ownersQuery = useQuery({
    queryKey: ['admin', 'owners'],
    queryFn: () => listOwners(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createWashingPoint({
        name: name.trim(),
        address: address.trim(),
        latitude: location!.lat,
        longitude: location!.lng,
        owner_id: ownerId || undefined,
        boxes_count: Number(boxesCount),
        open_time: openTime,
        close_time: closeTime,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'washing-points'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      onClose();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Не удалось выполнить запрос'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!location) {
      setError('Укажите точку на карте');
      return;
    }
    if (!Number.isInteger(Number(boxesCount)) || Number(boxesCount) < 1) {
      setError('Укажите количество боксов (целое число, не меньше 1)');
      return;
    }
    mutation.mutate();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,6,8,.62)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 30,
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 520,
          maxWidth: '100%',
          height: '100%',
          background: color.panelAlt,
          borderLeft: `1px solid ${color.borderStrong}`,
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '24px 28px',
            borderBottom: `1px solid ${color.borderAlt}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontFamily: font.display, color: color.textPrimary, fontSize: 20 }}>Новая мойка</div>
          <div
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: radius.sm,
              border: `1px solid ${color.borderStrong}`,
              color: color.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={labelStyle}>Название</div>
            <input
              style={inputStyle}
              placeholder="Например, Titan Wash Сомони"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={labelStyle}>Владелец</div>
            <select
              style={{ ...inputStyle, colorScheme: 'dark' }}
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="">Без владельца</option>
              {ownersQuery.data?.items.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={labelStyle}>Адрес</div>
            <input
              style={inputStyle}
              placeholder="Улица, дом"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={labelStyle}>Точка на карте</div>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={labelStyle}>Боксы</div>
              <input
                style={{ ...inputStyle, width: '100%' }}
                type="number"
                min={1}
                value={boxesCount}
                onChange={(e) => setBoxesCount(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={labelStyle}>Открытие</div>
              <input
                style={{ ...inputStyle, colorScheme: 'dark', width: '100%' }}
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={labelStyle}>Закрытие</div>
              <input
                style={{ ...inputStyle, colorScheme: 'dark', width: '100%' }}
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={labelStyle}>Статус</div>
            <select
              style={{ ...inputStyle, colorScheme: 'dark' }}
              value={status}
              onChange={(e) => setStatus(e.target.value as WashingPointStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && <div style={{ color: color.bad, fontSize: 13 }}>{error}</div>}
        </div>

        <div style={{ padding: '20px 28px', borderTop: `1px solid ${color.borderAlt}`, display: 'flex', gap: 10 }}>
          <GhostButton type="button" onClick={onClose} style={{ flex: 1, textAlign: 'center', padding: 14, fontSize: 14 }}>
            Отмена
          </GhostButton>
          <PrimaryButton
            type="submit"
            disabled={mutation.isPending}
            style={{ flex: 2, textAlign: 'center', padding: 14, fontSize: 14 }}
          >
            {mutation.isPending ? 'Создаём…' : 'Создать'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
