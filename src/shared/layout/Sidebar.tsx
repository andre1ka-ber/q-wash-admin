import { useState } from 'react';
import type { CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authStore, color, radius, listConnectionRequests, LogoMark, ConfirmDialog } from 'q-wash-shared';
import { SIDEBAR_WIDTH } from '../../theme/layout';

interface NavItem {
  key: string;
  icon: string;
  label: string;
  to?: string;
}

// "Мойки", "Владельцы", "Записи" and "Аналитика" have real screens — the
// rest are drawn but inert until their own design+build phase lands (see
// q-wash-admin/PLAN.md).
const NAV_ITEMS: NavItem[] = [
  { key: 'points', icon: '▤', label: 'Мойки', to: '/' },
  { key: 'qr-codes', icon: '▦', label: 'QR-коды', to: '/qr-codes' },
  { key: 'owners', icon: '☺', label: 'Владельцы', to: '/owners' },
  { key: 'services', icon: '≡', label: 'Услуги-справочник' },
  { key: 'bookings', icon: '◷', label: 'Записи', to: '/bookings' },
  { key: 'analytics', icon: '◲', label: 'Аналитика', to: '/analytics' },
  { key: 'settings', icon: '⚙', label: 'Настройки' },
];

const navItemBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '11px 14px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
};

export function Sidebar() {
  // "new"-status requests are what need admin attention, so the badge
  // counts those (not the "all connection requests" total).
  const newRequestsQuery = useQuery({
    queryKey: ['admin', 'connection-requests', 'new'],
    queryFn: () => listConnectionRequests('new'),
  });
  const newCount = newRequestsQuery.data?.items.length ?? 0;
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  return (
    <>
      <div
        style={{
          width: SIDEBAR_WIDTH,
          flex: `0 0 ${SIDEBAR_WIDTH}px`,
          background: color.surfaceAlt,
          borderRight: `1px solid ${color.borderAlt}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '26px 18px',
          gap: 26,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px' }}>
          <LogoMark size={34} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ color: color.textPrimary, fontSize: 14, fontWeight: 700 }}>Queue Admin</div>
            <div style={{ color: color.textFaint, fontSize: 11 }}>Душанбе</div>
          </div>
          <div
            onClick={() => setLogoutConfirmOpen(true)}
            title="Выйти"
            style={{
              width: 30,
              height: 30,
              borderRadius: radius.sm,
              border: `1px solid ${color.borderStrong}`,
              color: color.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ⎋
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <NavLink
                key={item.key}
                to={item.to}
                end
                style={({ isActive }) => ({
                  ...navItemBase,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  background: isActive ? '#221d22' : 'transparent',
                  color: isActive ? color.textPrimary : color.textMuted,
                })}
              >
                <span style={{ width: 18, textAlign: 'center', opacity: 0.8 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <div key={item.key} style={{ ...navItemBase, color: color.textDim, cursor: 'default' }}>
                <span style={{ width: 18, textAlign: 'center', opacity: 0.8 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ),
          )}
        </div>

        <NavLink
          to="/connection-requests"
          style={({ isActive }) => ({
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '13px 14px',
            borderRadius: radius.lg,
            textDecoration: 'none',
            background: isActive ? '#221d22' : color.panel,
            border: `1px solid ${isActive ? color.borderStrong : color.border}`,
          })}
        >
          <span style={{ color: color.textSecondary, fontSize: 13, fontWeight: 600 }}>Заявки на подключение</span>
          <span
            style={{
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: radius.pill,
              background: newCount > 0 ? color.gold : color.muteBg,
              color: newCount > 0 ? color.goldOnLight : color.mute,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {newCount}
          </span>
        </NavLink>
      </div>
      {logoutConfirmOpen && (
        <ConfirmDialog
          title="Выйти из аккаунта?"
          message="Понадобится снова ввести логин и пароль, чтобы продолжить работу."
          confirmLabel="Выйти"
          onConfirm={() => void authStore.logout()}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      )}
    </>
  );
}
