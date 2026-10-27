import { Outlet } from 'react-router-dom';
import { color, useIsMobile } from 'q-wash-shared';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

export function AdminShell() {
  const isMobile = useIsMobile();

  return (
    // height (not minHeight): every page's own content column already
    // assumes a bounded-height ancestor (flex:1; minHeight:0; overflowY:
    // auto internally) — minHeight let this box grow past the viewport on
    // a tall page, so the whole shell (including Sidebar) scrolled away
    // with the page instead of Sidebar staying put and only the page's
    // own content area scrolling.
    <div style={{ height: '100vh', background: color.surface, display: 'flex' }}>
      {!isMobile && <Sidebar />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {isMobile && <MobileHeader />}
        <Outlet />
      </div>
    </div>
  );
}
