import type { ReactNode } from 'react';

// Stroked 24x24 SVG glyphs from the design — shared by the desktop sidebar
// and the mobile bottom nav so both keep the same icon set.
const NAV_ICONS: Record<string, ReactNode> = {
  points: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  owners: (
    <>
      <circle cx="9" cy="8.5" r="3.3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6.2M18 19a6 6 0 0 0-2.2-4.6" />
    </>
  ),
  bookings: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  analytics: <path d="M5 19V11M12 19V5M19 19v-5" />,
  'qr-codes': (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2.5v2.5H14zM19 14v6M14 19.5h3" />
    </>
  ),
  services: <path d="M5 7h14M5 12h14M5 17h9" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
};

export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: `0 0 ${size}px` }}
    >
      {NAV_ICONS[name]}
    </svg>
  );
}
