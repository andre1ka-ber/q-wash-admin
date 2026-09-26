import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminStats, AdminWashingPoint } from 'q-wash-shared';
import { PointsPage } from './PointsPage';

const listAdminWashingPoints = vi.fn();
const getAdminStats = vi.fn();
let mobile = false;

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return {
    ...actual,
    useIsMobile: () => mobile,
    listAdminWashingPoints: (...a: unknown[]) => listAdminWashingPoints(...a),
    getAdminStats: (...a: unknown[]) => getAdminStats(...a),
  };
});

// The drawers have their own tests; here they only need to show they opened.
vi.mock('./NewPointDrawer', () => ({ NewPointDrawer: () => <div>new-point-drawer</div> }));
vi.mock('./EditPointDrawer', () => ({ EditPointDrawer: ({ pointId }: { pointId: string }) => <div>edit-drawer:{pointId}</div> }));

const point = (over: Partial<AdminWashingPoint>): AdminWashingPoint => ({
  id: 'p1', owner_id: 'o1', owner_name: 'ООО Titan', name: 'Pegasus', address: 'ул. Рудаки, 84',
  status: 'active', boxes_count: 2, services_count: 5, created_at: '2026-01-01T00:00:00Z', ...over,
});

const points = [
  point({}),
  point({ id: 'p2', name: 'AquaLine', address: 'пр. Сомони, 12', status: 'paused', owner_id: null, owner_name: null }),
  point({ id: 'p3', name: 'Express 24', address: 'ул. Айни, 47', status: 'pending_review' }),
];

const stats: AdminStats = { points_total: 3, points_active: 1, bookings_today: 40, canceled_today: 3, average_utilization: 0.684 };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PointsPage />
    </QueryClientProvider>,
  );
}

function stubApi() {
  mobile = false;
  listAdminWashingPoints.mockResolvedValue({ items: points });
  getAdminStats.mockResolvedValue(stats);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PointsPage', () => {
  it('shows the network stats and one row per point', async () => {
    stubApi();
    renderPage();
    expect(await screen.findByText('Pegasus')).toBeInTheDocument();
    expect(screen.getByText('3 точки · 1 активная')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument(); // average utilisation
    expect(screen.getByText('40')).toBeInTheDocument(); // bookings today
    expect(screen.getByText('Без владельца')).toBeInTheDocument(); // AquaLine
    expect(screen.getAllByText('Активна')).toHaveLength(2); // the filter chip + Pegasus's status pill
  });

  it('filters by status', async () => {
    stubApi();
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pegasus');

    await user.click(screen.getByText('На паузе', { selector: 'div' }));
    expect(screen.queryByText('Pegasus')).not.toBeInTheDocument();
    expect(screen.getByText('AquaLine')).toBeInTheDocument();

    await user.click(screen.getByText('Все'));
    expect(screen.getByText('Pegasus')).toBeInTheDocument();
  });

  it('searches by name or address, case-insensitively, combined with the status filter', async () => {
    stubApi();
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pegasus');
    const search = screen.getByPlaceholderText('Поиск по названию или адресу');

    await user.type(search, 'сомони');
    expect(screen.getByText('AquaLine')).toBeInTheDocument();
    expect(screen.queryByText('Pegasus')).not.toBeInTheDocument();

    await user.click(screen.getByText('Активна', { selector: 'div' })); // AquaLine is paused
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('opens the edit drawer for the clicked point and the wizard for a new one', async () => {
    stubApi();
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByText('AquaLine'));
    expect(screen.getByText('edit-drawer:p2')).toBeInTheDocument();

    cleanup();
    stubApi();
    renderPage();
    await user.click(await screen.findByRole('button', { name: '+ Новая мойка' }));
    expect(screen.getByText('new-point-drawer')).toBeInTheDocument();
  });

  it('shows an error when the list cannot be loaded', async () => {
    stubApi();
    listAdminWashingPoints.mockRejectedValue(new Error('down'));
    renderPage();
    expect(await screen.findByText('Не удалось загрузить список моек')).toBeInTheDocument();
  });

  it('mobile: point cards with owner, and a floating "new" button instead of the header one', async () => {
    stubApi();
    mobile = true;
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pegasus');
    expect(screen.getAllByText('Владелец')).toHaveLength(3);
    expect(screen.getAllByText('+ Новая мойка')).toHaveLength(1);

    await user.click(screen.getByText('+ Новая мойка'));
    expect(screen.getByText('new-point-drawer')).toBeInTheDocument();
  });
});
