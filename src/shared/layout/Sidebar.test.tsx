import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminWashingPoint } from 'q-wash-shared';
import { Sidebar } from './Sidebar';

const listConnectionRequests = vi.fn();
const listAdminWashingPoints = vi.fn();

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return {
    ...actual,
    listConnectionRequests: (...a: unknown[]) => listConnectionRequests(...a),
    listAdminWashingPoints: (...a: unknown[]) => listAdminWashingPoints(...a),
  };
});

const point = (over: Partial<AdminWashingPoint>): AdminWashingPoint => ({
  id: 'p', owner_id: 'o1', owner_name: 'O', name: 'P', address: 'A', status: 'active',
  boxes_count: 1, services_count: 0, created_at: '2026-01-01T00:00:00Z', ...over,
});

function renderSidebar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  listConnectionRequests.mockResolvedValue({ items: [{ id: 'r1' }, { id: 'r2' }] });
  listAdminWashingPoints.mockResolvedValue({ items: [] });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Sidebar', () => {
  it('shows the new connection requests as a number with a plural caption', async () => {
    renderSidebar();
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('новые')).toBeInTheDocument();
  });

  it('puts the count of owners under review on "Владельцы", counting each owner once', async () => {
    listAdminWashingPoints.mockResolvedValue({
      items: [
        point({ id: 'a', owner_id: 'o1', status: 'pending_review' }),
        point({ id: 'b', owner_id: 'o1', status: 'pending_review' }),
        point({ id: 'c', owner_id: 'o2', status: 'pending_review' }),
        point({ id: 'd', owner_id: 'o3', status: 'active' }),
      ],
    });
    listConnectionRequests.mockResolvedValue({ items: [] }); // keep the request count out of this check
    renderSidebar();
    const owners = screen.getByRole('link', { name: /Владельцы/ });
    await waitFor(() => expect(owners).toHaveTextContent('2'));
  });

  it('shows no badge on "Владельцы" when nothing is under review', async () => {
    renderSidebar();
    await screen.findByText('новые');
    expect(screen.getByRole('link', { name: /Владельцы/ })).not.toHaveTextContent(/\d/);
  });
});
