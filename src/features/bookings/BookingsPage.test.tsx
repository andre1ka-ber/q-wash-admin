import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type AdminWashingPoint, type BoardItem } from 'q-wash-shared';
import { BookingsPage } from './BookingsPage';

const listAdminWashingPoints = vi.fn();
const listQueueNetworkWide = vi.fn();
const updateBookingStatus = vi.fn();

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return {
    ...actual,
    listAdminWashingPoints: (...a: unknown[]) => listAdminWashingPoints(...a),
    listQueueNetworkWide: (...a: unknown[]) => listQueueNetworkWide(...a),
    updateBookingStatus: (...a: unknown[]) => updateBookingStatus(...a),
  };
});

const point = (id: string, name: string) => ({ id, name }) as AdminWashingPoint;
const item = (over: Partial<BoardItem>): BoardItem => ({
  id: 'b1',
  status: 'queue',
  box_number: 1,
  scheduled_start_at: '2026-09-26T05:00:00.000Z', // 10:00 in Asia/Dushanbe
  scheduled_end_at: '2026-09-26T05:30:00.000Z',
  customer_phone_last4: '1111',
  car_name: 'Camry',
  ...over,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BookingsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  listAdminWashingPoints.mockResolvedValue({ items: [point('p1', 'Pegasus'), point('p2', 'AquaLine')] });
  listQueueNetworkWide.mockImplementation((id: string) =>
    Promise.resolve({
      items:
        id === 'p1'
          ? [item({ id: 'b1', scheduled_start_at: '2026-09-26T07:00:00.000Z', scheduled_end_at: '2026-09-26T07:30:00.000Z' })]
          : [item({ id: 'b2', status: 'washing', customer_phone_last4: '2222', car_name: undefined })],
    }),
  );
  updateBookingStatus.mockResolvedValue({});
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('BookingsPage', () => {
  it('merges every point\'s live board into one table, earliest first, tagged with the point', async () => {
    renderPage();
    await screen.findByText('Pegasus');
    const rows = screen.getAllByText(/••\d{4}/);
    // AquaLine's 10:00 booking sorts before Pegasus's 12:00 one
    expect(rows.map((r) => r.textContent)).toEqual(['Авто · ••2222', 'Camry · ••1111']);
    expect(screen.getByText('2 активные записи по сети')).toBeInTheDocument();
    expect(screen.getByText('10:00–10:30')).toBeInTheDocument();
    expect(screen.getByText('12:00–12:30')).toBeInTheDocument();
  });

  it('labels each status and offers the matching next action', async () => {
    listQueueNetworkWide.mockImplementation((id: string) =>
      Promise.resolve({
        items:
          id === 'p1'
            ? [item({ id: 'a', status: 'queue' }), item({ id: 'b', status: 'waiting', customer_phone_last4: '3333' })]
            : [item({ id: 'c', status: 'washing', customer_phone_last4: '4444' })],
      }),
    );
    renderPage();
    await screen.findByText('Начать ожидание');
    expect(screen.getByText('В очереди')).toBeInTheDocument();
    expect(screen.getByText('Ожидание')).toBeInTheDocument();
    expect(screen.getByText('Моется')).toBeInTheDocument();
    expect(screen.getByText('Начать мойку')).toBeInTheDocument();
    expect(screen.getByText('Завершить')).toBeInTheDocument();
  });

  it.each([
    ['queue', 'Начать ожидание', 'waiting'],
    ['waiting', 'Начать мойку', 'washing'],
    ['washing', 'Завершить', 'ready'],
  ] as const)('advancing a %s booking sends the next status (%s -> %s)', async (status, label, next) => {
    listAdminWashingPoints.mockResolvedValue({ items: [point('p1', 'Pegasus')] });
    listQueueNetworkWide.mockResolvedValue({ items: [item({ id: 'only', status })] });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: label }));
    await waitFor(() => expect(updateBookingStatus).toHaveBeenCalledWith('only', next));
  });

  it('shows the API error under the button that failed', async () => {
    listAdminWashingPoints.mockResolvedValue({ items: [point('p1', 'Pegasus')] });
    listQueueNetworkWide.mockResolvedValue({ items: [item({ id: 'only' })] });
    updateBookingStatus.mockRejectedValue(new ApiError('invalid_status_transition', 'Переход недоступен', 409));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Начать ожидание' }));
    expect(await screen.findByText('Переход недоступен')).toBeInTheDocument();
  });

  it('says so when nobody is queued anywhere', async () => {
    listQueueNetworkWide.mockResolvedValue({ items: [] });
    renderPage();
    expect(await screen.findByText('Сейчас в очереди никого нет')).toBeInTheDocument();
  });

  it('warns when a point\'s board fails, but keeps showing the ones that loaded', async () => {
    listQueueNetworkWide.mockImplementation((id: string) =>
      id === 'p1' ? Promise.resolve({ items: [item({ id: 'b1' })] }) : Promise.reject(new Error('down')),
    );
    renderPage();
    expect(await screen.findByText(/Не удалось загрузить очередь/)).toBeInTheDocument();
    expect(within(document.body).getByText('Pegasus')).toBeInTheDocument();
  });
});
