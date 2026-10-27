export interface NavItem {
  key: string;
  label: string;
  to?: string;
}

// "Мойки", "QR-коды", "Владельцы", "Записи" and "Аналитика" have real
// screens — the rest are drawn but inert until their own design+build phase
// lands (see q-wash-admin/PLAN.md). Shared by the desktop Sidebar and the
// mobile menu.
export const NAV_ITEMS: NavItem[] = [
  { key: 'points', label: 'Мойки', to: '/' },
  { key: 'qr-codes', label: 'QR-коды', to: '/qr-codes' },
  { key: 'owners', label: 'Владельцы', to: '/owners' },
  { key: 'services', label: 'Услуги-справочник' },
  { key: 'bookings', label: 'Записи', to: '/bookings' },
  { key: 'analytics', label: 'Аналитика', to: '/analytics' },
  { key: 'settings', label: 'Настройки' },
];

// Title shown in the mobile header for the current route. The connection
// requests page is reached from the "Заявки на подключение" card, not from a
// nav item, so it has its own entry.
export function navItemForPath(pathname: string): { label: string } {
  if (pathname.startsWith('/connection-requests')) return { label: 'Заявки на подключение' };
  return NAV_ITEMS.find((i) => i.to && i.to !== '/' && pathname.startsWith(i.to)) ?? NAV_ITEMS[0]!;
}
