import type { CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { color, font } from 'q-wash-shared';
import { SIDEBAR_WIDTH } from '../../theme/layout';

interface NavItem {
  key: string;
  icon: string;
  label: string;
  to?: string;
}

// Only "Мойки" has a real screen behind it yet — every other item is drawn
// but inert until its own design+build phase lands (see q-wash-admin/PLAN.md).
const NAV_ITEMS: NavItem[] = [
  { key: 'points', icon: '▤', label: 'Мойки', to: '/' },
  { key: 'owners', icon: '☺', label: 'Владельцы' },
  { key: 'services', icon: '≡', label: 'Услуги-справочник' },
  { key: 'bookings', icon: '◷', label: 'Записи' },
  { key: 'analytics', icon: '◲', label: 'Аналитика' },
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
  return (
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
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(217,178,106,.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: font.display,
            color: color.gold,
            fontSize: 16,
          }}
        >
          Q
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: color.textPrimary, fontSize: 14, fontWeight: 700 }}>Queue Admin</div>
          <div style={{ color: color.textFaint, fontSize: 11 }}>Душанбе</div>
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
    </div>
  );
}
