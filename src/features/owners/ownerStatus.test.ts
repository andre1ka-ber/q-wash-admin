import { describe, expect, it } from 'vitest';
import type { AdminWashingPoint } from 'q-wash-shared';
import { ownerStatus, pointsByOwner } from './ownerStatus';

const point = (over: Partial<AdminWashingPoint>): AdminWashingPoint => ({
  id: 'p', owner_id: 'o1', owner_name: 'O', name: 'P', address: 'A', status: 'active',
  boxes_count: 1, services_count: 0, created_at: '2026-01-01T00:00:00Z', ...over,
});

describe('ownerStatus', () => {
  it('is pending when any point still waits for review', () => {
    expect(ownerStatus([point({ status: 'active' }), point({ status: 'pending_review' })])).toBe('pending');
  });
  it('is active when at least one point is active and none is in review', () => {
    expect(ownerStatus([point({ status: 'paused' }), point({ status: 'active' })])).toBe('active');
  });
  it('is paused when every point is paused', () => {
    expect(ownerStatus([point({ status: 'paused' })])).toBe('paused');
  });
  it('is none without points', () => {
    expect(ownerStatus([])).toBe('none');
  });
});

describe('pointsByOwner', () => {
  it('groups points by owner and skips points without an owner', () => {
    const map = pointsByOwner([point({ id: 'a' }), point({ id: 'b', owner_id: 'o2' }), point({ id: 'c', owner_id: null })]);
    expect(map.get('o1')?.map((p) => p.id)).toEqual(['a']);
    expect(map.get('o2')?.map((p) => p.id)).toEqual(['b']);
    expect(map.size).toBe(2);
  });
});
