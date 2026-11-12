import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type AdminWashingPoint, type Owner } from 'q-wash-shared';
import { OwnersPage } from './OwnersPage';

const listOwners = vi.fn();
const listAdminWashingPoints = vi.fn();
const updateWashingPoint = vi.fn();

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return {
    ...actual,
    listOwners: (...a: unknown[]) => listOwners(...a),
    listAdminWashingPoints: (...a: unknown[]) => listAdminWashingPoints(...a),
    updateWashingPoint: (...a: unknown[]) => updateWashingPoint(...a),
  };
});

const owners: Owner[] = [
  { id: 'o1', name: 'ООО Titan', contact_name: 'Иван Петров', contact_phone: '+992900000001', contact_email: 'ivan@titan.tj' },
  { id: 'o2', name: 'Pegas Auto', contact_name: 'Фаррух', contact_phone: '+992900000002', contact_email: null },
  { id: 'o3', name: 'Aqua Line', contact_name: null, contact_phone: null, contact_email: null },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OwnersPage />
    </QueryClientProvider>,
  );
}

const point = (over: Partial<AdminWashingPoint>): AdminWashingPoint => ({
  id: 'p', owner_id: 'o1', owner_name: 'ООО Titan', name: 'Point', address: 'A', status: 'active',
  boxes_count: 1, services_count: 0, created_at: '2026-01-01T00:00:00Z', ...over,
});

// o1 has an active point, o2 an application waiting for review, o3 a paused point.
const points = [
  point({ id: 'p1', owner_id: 'o1', name: 'Titan Wash', status: 'active' }),
  point({ id: 'p2', owner_id: 'o2', name: 'Pegas Detailing', status: 'pending_review' }),
  point({ id: 'p3', owner_id: 'o2', name: 'Pegas Box', status: 'pending_review' }),
  point({ id: 'p4', owner_id: 'o3', name: 'Aqua Center', status: 'paused' }),
];

beforeEach(() => {
  listOwners.mockResolvedValue({ items: owners });
  listAdminWashingPoints.mockResolvedValue({ items: [] });
  updateWashingPoint.mockResolvedValue({});
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('OwnersPage', () => {
  it('lists owners with a Russian plural count and dashes for missing contacts', async () => {
    renderPage();
    expect(await screen.findByText('ООО Titan')).toBeInTheDocument();
    expect(screen.getByText('3 владельца')).toBeInTheDocument();
    // Aqua Line has no contact name/phone -> dashes on its card
    expect(screen.getByText('— · —')).toBeInTheDocument();
  });

  it.each([
    [1, '1 владелец'],
    [5, '5 владельцев'],
  ])('pluralises %i owners', async (n, label) => {
    listOwners.mockResolvedValue({ items: Array.from({ length: n }, (_, i) => ({ id: `o${i}`, name: `Owner ${i}`, contact_name: null, contact_phone: null, contact_email: null })) });
    renderPage();
    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it('searches by name, contact name and phone, case-insensitively', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ООО Titan');
    const search = screen.getByPlaceholderText('Поиск по имени или телефону');

    await user.type(search, 'pegas');
    expect(screen.queryByText('ООО Titan')).not.toBeInTheDocument();
    expect(screen.getByText('Pegas Auto')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'иван');
    expect(screen.getByText('ООО Titan')).toBeInTheDocument();
    expect(screen.queryByText('Pegas Auto')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, '0000002');
    expect(screen.getByText('Pegas Auto')).toBeInTheDocument();
    expect(screen.queryByText('ООО Titan')).not.toBeInTheDocument();
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ООО Titan');
    await user.type(screen.getByPlaceholderText('Поиск по имени или телефону'), 'zzz');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('shows an error when loading fails', async () => {
    listOwners.mockRejectedValue(new ApiError('boom', 'down', 500));
    renderPage();
    expect(await screen.findByText('Не удалось загрузить список владельцев')).toBeInTheDocument();
  });

  it('opens the drawer to create a new owner, and to edit an existing one', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: '+ Новый владелец' }));
    expect(await screen.findByText('Новый владелец', { selector: 'div' })).toBeInTheDocument();

    cleanup();
    renderPage();
    await user.click(await screen.findByText('Pegas Auto'));
    await waitFor(() => expect(screen.getByDisplayValue('Pegas Auto')).toBeInTheDocument());
  });
});

describe('OwnersPage status, filters and review actions', () => {
  beforeEach(() => listAdminWashingPoints.mockResolvedValue({ items: points }));

  it('shows a status chip per owner and counts owners under review in the subtitle', async () => {
    renderPage();
    expect(await screen.findByText('3 владельца · 1 на проверке')).toBeInTheDocument();
    expect(screen.getByText('Активен')).toBeInTheDocument(); // o1
    expect(screen.getByText('Заявка')).toBeInTheDocument(); // o2
    expect(screen.getByText('На паузе', { selector: 'span' })).toBeInTheDocument(); // o3
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('3 владельца · 1 на проверке');

    await user.click(screen.getByText('Заявки'));
    expect(screen.getByText('Pegas Auto')).toBeInTheDocument();
    expect(screen.queryByText('ООО Titan')).not.toBeInTheDocument();
    expect(screen.queryByText('Aqua Line')).not.toBeInTheDocument();

    await user.click(screen.getByText('Активные'));
    expect(screen.getByText('ООО Titan')).toBeInTheDocument();
    expect(screen.queryByText('Pegas Auto')).not.toBeInTheDocument();

    await user.click(screen.getByText('Все'));
    expect(screen.getByText('Aqua Line')).toBeInTheDocument();
  });

  it('only owners under review get Одобрить / Отклонить', async () => {
    renderPage();
    await screen.findByText('Pegas Auto');
    expect(screen.getAllByRole('button', { name: 'Одобрить' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Отклонить' })).toHaveLength(1);
  });

  it('approving activates every point of the owner that waits for review, after a confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Одобрить' }));
    expect(updateWashingPoint).not.toHaveBeenCalled(); // not before confirming

    await user.click(within(screen.getByText('Одобрить заявку?').parentElement as HTMLElement).getByRole('button', { name: 'Одобрить' }));
    await waitFor(() => expect(updateWashingPoint).toHaveBeenCalledTimes(2));
    expect(updateWashingPoint).toHaveBeenCalledWith('p2', { status: 'active' });
    expect(updateWashingPoint).toHaveBeenCalledWith('p3', { status: 'active' });
  });

  it('rejecting pauses those points, and cancelling the dialog changes nothing', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Отклонить' }));
    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(updateWashingPoint).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Отклонить' }));
    await user.click(within(screen.getByText('Отклонить заявку?').parentElement as HTMLElement).getByRole('button', { name: 'Отклонить' }));
    await waitFor(() => expect(updateWashingPoint).toHaveBeenCalledWith('p2', { status: 'paused' }));
    expect(updateWashingPoint).toHaveBeenCalledWith('p3', { status: 'paused' });
  });

  it('clicking the review buttons does not open the owner drawer', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Одобрить' }));
    expect(screen.queryByDisplayValue('Pegas Auto')).not.toBeInTheDocument();
  });
});
