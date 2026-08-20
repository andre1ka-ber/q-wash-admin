import { Outlet } from 'react-router-dom';
import { color } from 'q-wash-shared';
import { Sidebar } from './Sidebar';

export function AdminShell() {
  return (
    <div style={{ minHeight: '100vh', background: color.surface, display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
