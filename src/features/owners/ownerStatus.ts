import type { AdminWashingPoint, StatusPillKind } from 'q-wash-shared';

/**
 * An owner has no status of its own in the API; the admin design shows one
 * (Активен / Заявка / На паузе), so it is derived from the owner's points:
 * any point still in review means a pending application, otherwise active if
 * at least one point is active, paused if every point is paused.
 */
export type OwnerStatus = 'pending' | 'active' | 'paused' | 'none';

export function ownerStatus(points: AdminWashingPoint[]): OwnerStatus {
  if (points.some((p) => p.status === 'pending_review')) return 'pending';
  if (points.some((p) => p.status === 'active')) return 'active';
  if (points.length > 0) return 'paused';
  return 'none';
}

export const OWNER_STATUS_LABEL: Record<Exclude<OwnerStatus, 'none'>, string> = {
  pending: 'Заявка',
  active: 'Активен',
  paused: 'На паузе',
};

export const OWNER_STATUS_KIND: Record<Exclude<OwnerStatus, 'none'>, StatusPillKind> = {
  pending: 'warn',
  active: 'ok',
  paused: 'bad',
};

/** Groups points by owner id (points without an owner are skipped). */
export function pointsByOwner(points: AdminWashingPoint[]): Map<string, AdminWashingPoint[]> {
  const map = new Map<string, AdminWashingPoint[]>();
  for (const p of points) {
    if (!p.owner_id) continue;
    map.set(p.owner_id, [...(map.get(p.owner_id) ?? []), p]);
  }
  return map;
}
