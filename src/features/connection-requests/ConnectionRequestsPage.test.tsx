import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { ConnectionRequest, ConnectionRequestList } from 'q-wash-shared';
import { ApiError } from 'q-wash-shared';
import { ConnectionRequestsPage } from './ConnectionRequestsPage';

const { listConnectionRequests, reviewConnectionRequest } = vi.hoisted(() => ({
  listConnectionRequests: vi.fn<(status?: string) => Promise<ConnectionRequestList>>(),
  reviewConnectionRequest: vi.fn(),
}));

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return { ...actual, listConnectionRequests, reviewConnectionRequest };
});

const REQUEST: ConnectionRequest = {
  id: 'req-1',
  business_name: 'Titan Wash',
  contact_name: 'Ivan',
  contact_phone: '+992900000000',
  address: 'Rudaki 1',
  boxes_count: 2,
  note: null,
  status: 'new',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-08-31T00:00:00Z',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConnectionRequestsPage />
    </QueryClientProvider>,
  );
}

// Resetting these mocks in a beforeEach (rather than inline, first line of
// each test) reproducibly makes Vitest 4.1.11 misattribute an already-caught
// react-query mutation rejection as this test's own uncaught error — a
// timing quirk in Vitest's mock-promise tracking, confirmed by isolating it
// to the beforeEach call itself (unrelated to the mutation ever actually
// going unhandled). Inline reset avoids it.
describe('ConnectionRequestsPage review actions', () => {
  it('shows the mutation error instead of swallowing it', async () => {
    listConnectionRequests.mockReset();
    reviewConnectionRequest.mockReset();
    listConnectionRequests.mockResolvedValue({ items: [REQUEST] });
    reviewConnectionRequest.mockRejectedValue(new ApiError('boxes_count_taken', 'Занято', 409));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Titan Wash');
    await user.click(screen.getByRole('button', { name: 'Одобрить' }));

    expect(await screen.findByText('Занято')).toBeInTheDocument();
  });

  it('falls back to a generic message for a non-ApiError failure', async () => {
    listConnectionRequests.mockReset();
    reviewConnectionRequest.mockReset();
    listConnectionRequests.mockResolvedValue({ items: [REQUEST] });
    reviewConnectionRequest.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Titan Wash');
    await user.click(screen.getByRole('button', { name: 'Отклонить' }));

    expect(await screen.findByText('Не удалось выполнить запрос')).toBeInTheDocument();
  });

  it('re-fetches the list on a successful review', async () => {
    listConnectionRequests.mockReset();
    reviewConnectionRequest.mockReset();
    listConnectionRequests.mockResolvedValueOnce({ items: [REQUEST] }).mockResolvedValueOnce({ items: [] });
    reviewConnectionRequest.mockResolvedValue({ ...REQUEST, status: 'approved' });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Titan Wash');
    await user.click(screen.getByRole('button', { name: 'Одобрить' }));

    await waitFor(() => expect(listConnectionRequests).toHaveBeenCalledTimes(2));
    expect(reviewConnectionRequest).toHaveBeenCalledWith('req-1', { status: 'approved' });
  });
});
