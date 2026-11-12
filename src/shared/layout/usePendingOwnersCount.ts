import { useQuery } from '@tanstack/react-query';
import { listAdminWashingPoints } from 'q-wash-shared';

/** Owners with at least one point still in review (the design's badge on "Владельцы"). */
export function usePendingOwnersCount(): number {
  const { data } = useQuery({
    queryKey: ['admin', 'washing-points'],
    queryFn: () => listAdminWashingPoints(),
  });
  const owners = new Set<string>();
  for (const p of data?.items ?? []) {
    if (p.status === 'pending_review' && p.owner_id) owners.add(p.owner_id);
  }
  return owners.size;
}
