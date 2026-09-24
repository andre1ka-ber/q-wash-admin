import { NavLink } from 'react-router-dom';
import { color } from 'q-wash-shared';

interface NavItem {
  key: string;
  icon: string;
  label: string;
  to: string;
}

// Mirrors Sidebar.tsx's real-route items only — the inert
// "Услуги-справочник"/"Настройки" entries stay desktop-only until they
// have a real screen (see Sidebar.tsx's comment).
const NAV_ITEMS: NavItem[] = [
  { key: 'points', icon: '▤', label: 'Мойки', to: '/' },
  { key: 'owners', icon: '☺', label: 'Владельцы', to: '/owners' },
  { key: 'bookings', icon: '◷', label: 'Записи', to: '/bookings' },
  { key: 'analytics', icon: '◲', label: 'Аналитика', to: '/analytics' },
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
          <span style={{ fontSize: 18, opacity: 0.9 }}>{item.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
