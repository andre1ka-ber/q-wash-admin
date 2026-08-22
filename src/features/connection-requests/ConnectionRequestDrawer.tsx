import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { color, font, radius, ApiError, GhostButton, PrimaryButton, createConnectionRequest } from 'q-wash-shared';

export interface ConnectionRequestDrawerProps {
  onClose: () => void;
}

interface FieldConfig {
  key: 'business_name' | 'contact_name' | 'contact_phone' | 'address' | 'boxes_count' | 'note';
  label: string;
  placeholder: string;
  required?: boolean;
}

const FIELDS: FieldConfig[] = [
  { key: 'business_name', label: 'Название бизнеса', placeholder: 'Например, Titan Wash', required: true },
  { key: 'contact_name', label: 'Контактное лицо', placeholder: 'Имя Фамилия', required: true },
  { key: 'contact_phone', label: 'Телефон', placeholder: '+992 __ ___ __ __', required: true },
  { key: 'address', label: 'Адрес', placeholder: 'Улица, дом', required: true },
  { key: 'boxes_count', label: 'Боксы', placeholder: '2', required: true },
  { key: 'note', label: 'Заметка', placeholder: 'Необязательно' },
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

export function ConnectionRequestDrawer({ onClose }: ConnectionRequestDrawerProps) {
  const [values, setValues] = useState<Record<FieldConfig['key'], string>>({
    business_name: '',
    contact_name: '',
    contact_phone: '',
    address: '',
    boxes_count: '',
    note: '',
  });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createConnectionRequest({
        business_name: values.business_name.trim(),
        contact_name: values.contact_name.trim(),
        contact_phone: values.contact_phone.trim(),
        address: values.address.trim(),
        boxes_count: Number(values.boxes_count),
        note: values.note.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'connection-requests'] });
      onClose();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Не удалось выполнить запрос'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!Number.isInteger(Number(values.boxes_count)) || Number(values.boxes_count) < 1) {
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
          width: 480,
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
          <div style={{ fontFamily: font.display, color: color.textPrimary, fontSize: 20 }}>Новая заявка</div>
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
          {FIELDS.map((field) => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: color.textMuted, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {field.label}
              </div>
              <input
                style={inputStyle}
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                required={field.required}
                inputMode={field.key === 'boxes_count' ? 'numeric' : undefined}
              />
            </div>
          ))}

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
            {mutation.isPending ? 'Сохраняем…' : 'Добавить'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
