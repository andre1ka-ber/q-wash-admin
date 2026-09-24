import { Outlet } from 'react-router-dom';
import { color, useIsMobile } from 'q-wash-shared';
import { Sidebar } from './Sidebar';
import { BottomNav, BOTTOM_NAV_HEIGHT } from './BottomNav';

export function AdminShell() {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh', background: color.surface, display: 'flex' }}>
      {!isMobile && <Sidebar />}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: isMobile ? BOTTOM_NAV_HEIGHT : 0,
        }}
      >
        <Outlet />
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
}
