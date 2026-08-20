import { useState } from 'react';
import { color, font, radius, GhostButton, PrimaryButton } from 'q-wash-shared';

export interface NewPointDrawerProps {
  onClose: () => void;
}

interface FieldConfig {
  key: 'name' | 'owner' | 'phone' | 'address' | 'hours';
  label: string;
  placeholder: string;
}

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Название', placeholder: 'Например, Titan Wash Сомони' },
  { key: 'owner', label: 'Владелец / организация', placeholder: 'ООО «...»' },
  { key: 'phone', label: 'Телефон', placeholder: '+992 __ ___ __ __' },
  { key: 'address', label: 'Адрес', placeholder: 'Улица, дом' },
  { key: 'hours', label: 'Часы работы', placeholder: '09:00 – 21:00' },
];

const BOX_OPTIONS = ['2', '3', '4', '5+'];

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

// Step 1 of 3 ("Основное") is all the mock draws — steps 2 ("Услуги") and 3
// aren't defined yet (see q-wash-admin/PLAN.md), so this drawer is UI-only:
// neither button submits anything yet.
export function NewPointDrawer({ onClose }: NewPointDrawerProps) {
  const [values, setValues] = useState<Record<FieldConfig['key'], string>>({
    name: '',
    owner: '',
    phone: '',
    address: '',
    hours: '',
  });
  const [boxes, setBoxes] = useState('2');

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
      <div
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontFamily: font.display, color: color.textPrimary, fontSize: 20 }}>Новая мойка</div>
            <div style={{ color: color.textFaint, fontSize: 12 }}>Шаг 1 из 3 · Основное</div>
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
              <div
                style={{
                  color: color.textMuted,
                  fontSize: 12,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                {field.label}
              </div>
              <input
                style={inputStyle}
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: color.textMuted, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Точка на карте
            </div>
            <div
              style={{
                height: 150,
                borderRadius: radius.lg,
                border: `1px solid ${color.borderStrong}`,
                background: 'repeating-linear-gradient(135deg,#1b171b 0 10px,#171317 10px 20px)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '46%',
                  top: '44%',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: color.gold,
                  border: '3px solid #171317',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: color.textMuted, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Боксы
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {BOX_OPTIONS.map((option) => {
                const selected = option === boxes;
                return (
                  <div
                    key={option}
                    onClick={() => setBoxes(option)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: 13,
                      borderRadius: radius.lg,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: selected ? 700 : 400,
                      background: selected ? color.gold : color.input,
                      border: selected ? `1px solid ${color.gold}` : `1px solid ${color.borderStrong}`,
                      color: selected ? color.goldOnLight : color.textSecondary,
                    }}
                  >
                    {option}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px', borderTop: `1px solid ${color.borderAlt}`, display: 'flex', gap: 10 }}>
          <GhostButton onClick={onClose} style={{ flex: 1, textAlign: 'center', padding: 14, fontSize: 14 }}>
            Отмена
          </GhostButton>
          <PrimaryButton onClick={onClose} style={{ flex: 2, textAlign: 'center', padding: 14, fontSize: 14 }}>
            Далее · Услуги
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
