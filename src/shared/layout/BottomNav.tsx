import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { color } from 'q-wash-shared';

interface NavItem {
  key: string;
  // Stroked 24x24 SVG paths (from the mobile design).
  icon: ReactNode;
  label: string;
  to: string;
}

// Mirrors Sidebar.tsx's real-route items only — the inert
// "Услуги-справочник"/"Настройки" entries stay desktop-only until they
// have a real screen (see Sidebar.tsx's comment).
const NAV_ITEMS: NavItem[] = [
  {
    key: 'points',
    label: 'Мойки',
    to: '/',
    icon: (
      <>
        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.6" />
      </>
    ),
  },
  {
    key: 'owners',
    label: 'Владельцы',
    to: '/owners',
    icon: (
      <>
        <circle cx="9" cy="8.5" r="3.3" />
        <path d="M3 19a6 6 0 0 1 12 0" />
        <path d="M16 5.5a3.2 3.2 0 0 1 0 6.2M18 19a6 6 0 0 0-2.2-4.6" />
      </>
    ),
  },
  {
    key: 'bookings',
    label: 'Записи',
    to: '/bookings',
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </>
    ),
  },
  { key: 'analytics', label: 'Аналитика', to: '/analytics', icon: <path d="M5 19V11M12 19V5M19 19v-5" /> },
];

export const BOTTOM_NAV_HEIGHT = 64;

export function BottomNav() {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: BOTTOM_NAV_HEIGHT,
        flex: `0 0 ${BOTTOM_NAV_HEIGHT}px`,
        background: color.surfaceAlt,
        borderTop: `1px solid ${color.borderAlt}`,
        display: 'grid',
        gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)`,
        zIndex: 20,
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            textDecoration: 'none',
            color: isActive ? color.gold : color.textTertiary,
          })}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {item.icon}
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
