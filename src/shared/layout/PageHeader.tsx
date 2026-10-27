import type { ReactNode } from 'react';
import { color, useIsMobile } from 'q-wash-shared';
import { HEADER_HEIGHT } from '../../theme/layout';

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  // Right-aligned controls on desktop; a full-width row under the subtitle on mobile.
  children?: ReactNode;
}

// Desktop: the 74px title bar. Mobile: AdminShell's MobileHeader already
// shows the title next to the menu button, so only the subtitle line and the
// page's controls remain (the design's mobile screens do the same).
export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{ flex: '0 0 auto', padding: '14px 18px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {subtitle ? <div style={{ color: color.textTertiary, fontSize: 13 }}>{subtitle}</div> : null}
        {children ? <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div> : null}
      </div>
    );
  }

  return (
    <div
      style={{
        height: HEADER_HEIGHT,
        flex: `0 0 ${HEADER_HEIGHT}px`,
        borderBottom: `1px solid ${color.borderAlt}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ color: color.textPrimary, fontSize: 19, fontWeight: 700 }}>{title}</div>
        <div style={{ color: color.textFaint, fontSize: 12 }}>{subtitle ?? ' '}</div>
      </div>
      {children ? <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div> : null}
    </div>
  );
}
