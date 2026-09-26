import { cleanup, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminStats, AdminWashingPoint } from 'q-wash-shared';
import { AnalyticsPage } from './AnalyticsPage';

const getAdminStats = vi.fn();
const listAdminWashingPoints = vi.fn();
const listQueueNetworkWide = vi.fn();

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return {
    ...actual,
    getAdminStats: (...a: unknown[]) => getAdminStats(...a),
    listAdminWashingPoints: (...a: unknown[]) => listAdminWashingPoints(...a),
    listQueueNetworkWide: (...a: unknown[]) => listQueueNetworkWide(...a),
  };
});

const point = (over: Partial<AdminWashingPoint>): AdminWashingPoint => ({
  id: 'p1', owner_id: null, owner_name: null, name: 'Pegasus', address: 'a', status: 'active',
  boxes_count: 2, services_count: 5, created_at: '2026-01-01T00:00:00Z', ...over,
});

function stubApi(stats: AdminStats, pts: AdminWashingPoint[], queued: Record<string, number> = {}) {
  getAdminStats.mockResolvedValue(stats);
  listAdminWashingPoints.mockResolvedValue({ items: pts });
  listQueueNetworkWide.mockImplementation((id: string) => Promise.resolve({ items: Array.from({ length: queued[id] ?? 0 }, (_, i) => ({ id: `${id}-${i}` })) }));
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AnalyticsPage />
    </QueryClientProvider>,
  );
}

const card = (label: string) => screen.getByText(label).parentElement!;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AnalyticsPage', () => {
  it('derives the active share and the cancellation rate from the stats', async () => {
    stubApi({ points_total: 4, points_active: 3, bookings_today: 90, canceled_today: 10, average_utilization: 0.684 }, []);
    renderPage();

    expect(await screen.findByText('3 (75%)')).toBeInTheDocument(); // 3 of 4 points active
    expect(within(card('Доля отмен')).getByText('10%')).toBeInTheDocument(); // 10 / (90 + 10)
    expect(within(card('Средняя загрузка')).getByText('68%')).toBeInTheDocument();
    expect(within(card('Записей сегодня')).getByText('90')).toBeInTheDocument();
    expect(within(card('Отмен сегодня')).getByText('10')).toBeInTheDocument();
  });

  it('shows dashes instead of dividing by zero on an empty network / quiet day', async () => {
    stubApi({ points_total: 0, points_active: 0, bookings_today: 0, canceled_today: 0, average_utilization: 0 }, []);
    renderPage();

    expect(await screen.findByText('Точек пока нет')).toBeInTheDocument();
    expect(within(card('Доля отмен')).getByText('—')).toBeInTheDocument();
    expect(within(card('Активных точек')).getByText('0 (—)')).toBeInTheDocument();
  });

  it('lists each point with its status, boxes, services and current queue length', async () => {
    stubApi(
      { points_total: 2, points_active: 1, bookings_today: 5, canceled_today: 0, average_utilization: 0.5 },
      [point({}), point({ id: 'p2', name: 'AquaLine', status: 'paused', boxes_count: 3, services_count: 7 })],
      { p1: 4, p2: 0 },
    );
    renderPage();

    const pegasus = (await screen.findByText('Pegasus')).parentElement!;
    await within(pegasus).findByText('4');
    expect(within(pegasus).getByText('Активна')).toBeInTheDocument();

    const aqua = screen.getByText('AquaLine').parentElement!;
    expect(within(aqua).getByText('На паузе')).toBeInTheDocument();
    expect(within(aqua).getByText('3')).toBeInTheDocument();
    expect(within(aqua).getByText('7')).toBeInTheDocument();
    expect(await within(aqua).findByText('0')).toBeInTheDocument();
  });

  it('shows a dash for a point whose queue could not be loaded', async () => {
    stubApi({ points_total: 1, points_active: 1, bookings_today: 1, canceled_today: 0, average_utilization: 0.1 }, [point({})]);
    listQueueNetworkWide.mockImplementation(() => Promise.reject(new Error('down')));
    renderPage();
    const row = (await screen.findByText('Pegasus')).parentElement!;
    expect(await within(row).findByText('—')).toBeInTheDocument();
  });
});
