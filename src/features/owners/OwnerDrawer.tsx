import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { color, font, radius, ApiError, GhostButton, PrimaryButton, createOwner, updateOwner } from 'q-wash-shared';
import type { Owner } from 'q-wash-shared';

export interface OwnerDrawerProps {
  owner?: Owner;
  onClose: () => void;
}

interface FieldConfig {
  key: 'name' | 'contact_name' | 'contact_phone' | 'contact_email';
  label: string;
  placeholder: string;
  required?: boolean;
}

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Название организации', placeholder: 'ООО «...»', required: true },
  { key: 'contact_name', label: 'Контактное лицо', placeholder: 'Имя Фамилия' },
  { key: 'contact_phone', label: 'Телефон', placeholder: '+992 __ ___ __ __' },
  { key: 'contact_email', label: 'Email', placeholder: 'name@example.com' },
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

export function OwnerDrawer({ owner, onClose }: OwnerDrawerProps) {
  const isEdit = Boolean(owner);
  const [values, setValues] = useState<Record<FieldConfig['key'], string>>({
    name: owner?.name ?? '',
    contact_name: owner?.contact_name ?? '',
    contact_phone: owner?.contact_phone ?? '',
    contact_email: owner?.contact_email ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: values.name.trim(),
        contact_name: values.contact_name.trim() || undefined,
        contact_phone: values.contact_phone.trim() || undefined,
        contact_email: values.contact_email.trim() || undefined,
      };
      return owner ? updateOwner(owner.id, body) : createOwner(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'owners'] });
      onClose();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Не удалось выполнить запрос'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
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
          <div style={{ fontFamily: font.display, color: color.textPrimary, fontSize: 20 }}>
            {isEdit ? 'Владелец' : 'Новый владелец'}
          </div>
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
            {mutation.isPending ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Добавить'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
