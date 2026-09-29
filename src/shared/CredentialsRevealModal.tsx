import { useState } from 'react';
import { color, font, radius, PrimaryButton } from 'q-wash-shared';

export interface CredentialsRevealItem {
  label: string;
  username: string;
  password: string;
}

export interface CredentialsRevealModalProps {
  title: string;
  items: CredentialsRevealItem[];
  onClose: () => void;
}

// Shown right after a washing point's staff/worker account(s) are
// (re-)provisioned — the one moment a password is visible in plaintext,
// since only the bcrypt hash is ever stored (see q-wash-api/docs/API.md's
// "Washing point credentials"). No cancel/escape route other than the
// explicit acknowledgement button, so admin can't accidentally dismiss it
// without having seen the password. Used both for the two-account reveal
// at creation and the single-account reveal after a password reset.
export function CredentialsRevealModal({ title, items, onClose }: CredentialsRevealModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,6,8,.62)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: 460,
          maxWidth: '92%',
          borderRadius: radius.xxl,
          background: color.panelAlt,
          border: `1px solid ${color.borderStrong}`,
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontFamily: font.display, color: color.textPrimary, fontSize: 17, fontWeight: 600 }}>
          {title}
        </div>
        <div style={{ color: color.textSecondary, fontSize: 13, lineHeight: 1.5 }}>
          Пароли показываются только один раз и нигде больше не сохраняются. Запишите их сейчас — восстановить
          старый пароль нельзя, только сбросить и выдать новый.
        </div>
        {items.map((item) => (
          <CredentialCard key={item.label} label={item.label} username={item.username} password={item.password} />
        ))}
        <PrimaryButton type="button" onClick={onClose} style={{ textAlign: 'center', padding: 14, fontSize: 14, marginTop: 4 }}>
          Я сохранил(а) данные
        </PrimaryButton>
      </div>
    </div>
  );
}

function CredentialCard({ label, username, password }: { label: string; username: string; password: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 14,
        borderRadius: radius.lg,
        background: color.panel,
        border: `1px solid ${color.borderAlt}`,
      }}
    >
      <div style={{ color: color.textMuted, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</div>
      <CopyableField label="Логин" value={username} />
      <CopyableField label="Пароль" value={password} />
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — the value is still visible to select and copy by hand.
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ color: color.textFaint, fontSize: 12, width: 52, flex: '0 0 auto' }}>{label}</div>
      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 14, color: color.textPrimaryAlt, overflowWrap: 'anywhere' }}>
        {value}
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Копировать: ${label}`}
        style={{
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: copied ? color.ok : color.gold,
          flex: '0 0 auto',
          background: 'none',
          border: 'none',
          fontFamily: 'inherit',
          padding: '8px 6px',
          margin: 0,
        }}
      >
        <span aria-live="polite">{copied ? 'Скопировано' : 'Копировать'}</span>
      </button>
    </div>
  );
}
