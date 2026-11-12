/** "09:00–21:00", "круглосуточно" for a point open all day, "—" when the hours are unknown. */
export function formatHours(open?: string, close?: string): string {
  if (!open || !close) return '—';
  const o = open.slice(0, 5);
  const c = close.slice(0, 5);
  if (o === '00:00' && (c === '24:00' || c === '23:59' || c === '00:00')) return 'круглосуточно';
  return `${o}–${c}`;
}
