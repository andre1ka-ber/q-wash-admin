import { useState } from 'react';
import type { CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authStore, color, radius, listConnectionRequests, ConfirmDialog, LogoMark } from 'q-wash-shared';
import { SIDEBAR_WIDTH } from '../../theme/layout';
import { NavIcon } from './navIcons';
import { NAV_ITEMS } from './navItems';
import { pluralRu } from '../pluralRu';
import { usePendingOwnersCount } from './usePendingOwnersCount';

const navItemBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '11px 14px',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
};

// The small count chip on a nav item (design: dark chip, inverted on the active gold item).
function navBadge(active: boolean): CSSProperties {
  return {
    minWidth: 22,
    padding: '2px 7px',
    boxSizing: 'border-box',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: 700,
    background: active ? color.goldOnLight : color.muteBg,
    color: active ? color.gold : color.textSecondary,
  };
}

export function Sidebar() {
  // "new"-status requests are what need admin attention, so the badge
  // counts those (not the "all connection requests" total).
  const newRequestsQuery = useQuery({
    queryKey: ['admin', 'connection-requests', 'new'],
    queryFn: () => listConnectionRequests('new'),
  });
  const newCount = newRequestsQuery.data?.items.length ?? 0;
  const pendingOwners = usePendingOwnersCount();
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
            <div style={{ color: color.textPrimary, fontSize: 14, fontWeight: 600, letterSpacing: '-.02em' }}>Q Wash · Админ</div>
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
                  background: isActive ? color.gold : 'transparent',
                  color: isActive ? color.goldOnLight : color.textSecondary,
                })}
              >
                {({ isActive }) => (
                  <>
                    <NavIcon name={item.key} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.key === 'owners' && pendingOwners > 0 && (
                      <span style={navBadge(isActive)}>{pendingOwners}</span>
                    )}
                  </>
                )}
              </NavLink>
            ) : (
              <div key={item.key} style={{ ...navItemBase, color: color.textDim, cursor: 'default' }}>
                <NavIcon name={item.key} />
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
            flexDirection: 'column',
            gap: 6,
            padding: 14,
            borderRadius: radius.lg,
            textDecoration: 'none',
            background: isActive ? '#221d22' : color.panel,
            border: `1px solid ${isActive ? color.borderStrong : color.border}`,
          })}
        >
          <span style={{ color: color.textFaint, fontSize: 12 }}>Заявки на подключение</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: newCount > 0 ? color.gold : color.textMuted, fontSize: 22, fontWeight: 800 }}>{newCount}</span>
            <span style={{ color: color.textFaint, fontSize: 12 }}>
              {pluralRu(newCount, ['новая', 'новые', 'новых'])}
            </span>
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
