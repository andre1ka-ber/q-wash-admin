import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authStore, color, listConnectionRequests, ConfirmDialog } from 'q-wash-shared';
import { NavIcon } from './navIcons';
import { NAV_ITEMS, navItemForPath } from './navItems';

// Menu button + page title bar and the slide-in menu from the mobile design
// (replaces the old bottom tab bar — the design has no bottom nav).
export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { pathname } = useLocation();
  const current = navItemForPath(pathname);

  const newRequestsQuery = useQuery({
    queryKey: ['admin', 'connection-requests', 'new'],
    queryFn: () => listConnectionRequests('new'),
  });
  const newCount = newRequestsQuery.data?.items.length ?? 0;

  return (
    <>
      <div
        style={{
          flex: '0 0 auto',
          padding: '16px 18px 14px',
          background: color.surfaceAlt,
          borderBottom: `1px solid ${color.borderAlt}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          type="button"
          aria-label="Меню"
          onClick={() => setMenuOpen(true)}
          style={{
            width: 44,
            height: 44,
            flex: '0 0 44px',
            borderRadius: 14,
            background: color.panel,
            border: `1px solid #282823`,
            color: color.textPrimaryAlt,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0, color: color.textPrimary, fontSize: 19, fontWeight: 600, letterSpacing: '-.03em' }}>
          {current.label}
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,7,.62)', zIndex: 35 }}
          />
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: 304,
              maxWidth: '85vw',
              zIndex: 36,
              background: color.panelAlt,
              borderRight: '1px solid #282823',
              borderRadius: '0 26px 26px 0',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 16px 30px',
              boxSizing: 'border-box',
              gap: 18,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0 6px' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ color: color.textPrimary, fontSize: 18, fontWeight: 600, letterSpacing: '-.02em' }}>Q Wash</div>
                <div style={{ color: color.textTertiary, fontSize: 12 }}>Администратор платформы</div>
              </div>
              <button
                type="button"
                aria-label="Закрыть меню"
                onClick={() => setMenuOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  flex: '0 0 36px',
                  borderRadius: 12,
                  border: `1px solid ${color.borderStrong}`,
                  background: 'transparent',
                  color: color.textTertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {NAV_ITEMS.map((item) => {
                const base = {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                } as const;
                if (!item.to) {
                  return (
                    <div key={item.key} style={{ ...base, color: color.textDim }}>
                      <NavIcon name={item.key} size={20} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </div>
                  );
                }
                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    end
                    onClick={() => setMenuOpen(false)}
                    style={({ isActive }) => ({
                      ...base,
                      background: isActive ? color.gold : 'transparent',
                      color: isActive ? color.goldOnLight : color.textSecondary,
                    })}
                  >
                    <NavIcon name={item.key} size={20} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 14,
                borderTop: `1px solid ${color.borderAlt}`,
              }}
            >
              <NavLink
                to="/connection-requests"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 14px',
                  borderRadius: 14,
                  textDecoration: 'none',
                  background: color.panel,
                  border: `1px solid ${color.border}`,
                }}
              >
                <span style={{ color: color.textSecondary, fontSize: 13, fontWeight: 600 }}>Заявки на подключение</span>
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    padding: '0 6px',
                    borderRadius: 9999,
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
              <div
                role="button"
                onClick={() => setLogoutConfirmOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 13,
                  color: color.bad,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />
                </svg>
                <span>Выйти</span>
              </div>
            </div>
          </div>
        </>
      )}

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
