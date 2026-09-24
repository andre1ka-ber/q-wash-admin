import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { AdminWashingPointList, QrCode, QrCodePoolList } from 'q-wash-shared';
import { ApiError } from 'q-wash-shared';
import { QrCodesPage } from './QrCodesPage';

const { listQrCodes, getQrCode, assignQrCode, unassignQrCode, disableQrCode, generateQrCodes, listAdminWashingPoints } =
  vi.hoisted(() => ({
    listQrCodes: vi.fn<(params?: { status?: string; search?: string }) => Promise<QrCodePoolList>>(),
    getQrCode: vi.fn<(id: string) => Promise<QrCode>>(),
    assignQrCode: vi.fn(),
    unassignQrCode: vi.fn(),
    disableQrCode: vi.fn(),
    generateQrCodes: vi.fn(),
    listAdminWashingPoints: vi.fn<() => Promise<AdminWashingPointList>>(),
  }));

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return {
    ...actual,
    listQrCodes,
    getQrCode,
    assignQrCode,
    unassignQrCode,
    disableQrCode,
    generateQrCodes,
    listAdminWashingPoints,
  };
});

const FREE_CODE: QrCode = {
  id: 'qr-1',
  code: 'QW-0001',
  token: 'tok1',
  status: 'free',
  batch_label: 'Партия #1',
  washing_point_id: null,
  washing_point_name: null,
  assigned_at: null,
  disabled_at: null,
  replacement_requested_at: null,
  created_at: '2026-09-01T00:00:00Z',
};

const ASSIGNED_CODE: QrCode = {
  ...FREE_CODE,
  id: 'qr-2',
  code: 'QW-0002',
  token: 'tok2',
  status: 'assigned',
  washing_point_id: 'point-1',
  washing_point_name: 'Pegasus Detailing',
  assigned_at: '2026-09-02T00:00:00Z',
  stats: { scans_today: 3, scans_7d: 12, scans_by_day: [], bookings_via_qr: 2 },
};

const POOL: QrCodePoolList = {
  items: [FREE_CODE, ASSIGNED_CODE],
  stats: { total: 2, free: 1, assigned: 1, disabled: 0 },
};

const POINTS: AdminWashingPointList = {
  items: [
    { id: 'point-2', owner_id: null, owner_name: null, name: 'AquaLine Wash', address: 'пр. Сомони, 12', status: 'active', boxes_count: 2, services_count: 3, created_at: '2026-01-01T00:00:00Z' },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <QrCodesPage />
    </QueryClientProvider>,
  );
}

function resetAll() {
  listQrCodes.mockReset();
  getQrCode.mockReset();
  assignQrCode.mockReset();
  unassignQrCode.mockReset();
  disableQrCode.mockReset();
  generateQrCodes.mockReset();
  listAdminWashingPoints.mockReset();
}

describe('QrCodesPage', () => {
  it('renders the pool grid and stat row from the list response', async () => {
    resetAll();
    listQrCodes.mockResolvedValue(POOL);
    listAdminWashingPoints.mockResolvedValue(POINTS);
    renderPage();

    await screen.findByText('QW-0001');
    expect(screen.getByText('QW-0002')).toBeInTheDocument();
    expect(screen.getByText('2 кодов')).toBeInTheDocument();
  });

  it('re-fetches with the new status when a filter chip is clicked', async () => {
    resetAll();
    listQrCodes.mockResolvedValue(POOL);
    listAdminWashingPoints.mockResolvedValue(POINTS);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('QW-0001');
    await user.click(screen.getByText('Свободные'));

    await waitFor(() => expect(listQrCodes).toHaveBeenCalledWith({ status: 'free', search: undefined }));
  });

  it('selecting a free code and assigning it to a point calls assignQrCode', async () => {
    resetAll();
    listQrCodes.mockResolvedValue(POOL);
    listAdminWashingPoints.mockResolvedValue(POINTS);
    getQrCode.mockResolvedValue(FREE_CODE);
    assignQrCode.mockResolvedValue({ ...FREE_CODE, status: 'assigned', washing_point_id: 'point-2' });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('QW-0001');
    await user.click(screen.getByText('QW-0001'));

    await screen.findByText('Привязать к мойке без QR');
    await user.click(screen.getByText('AquaLine Wash'));

    await waitFor(() => expect(assignQrCode).toHaveBeenCalledWith('qr-1', 'point-2'));
  });

  it('shows the mutation error instead of swallowing it', async () => {
    resetAll();
    listQrCodes.mockResolvedValue(POOL);
    listAdminWashingPoints.mockResolvedValue(POINTS);
    getQrCode.mockResolvedValue(ASSIGNED_CODE);
    unassignQrCode.mockRejectedValue(new ApiError('qr_code_not_found', 'Код не найден', 404));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('QW-0001');
    await user.click(screen.getByText('QW-0002'));

    const unassignButton = await screen.findByText('Отвязать и вернуть в пул');
    await user.click(unassignButton);

    expect(await screen.findByText('Код не найден')).toBeInTheDocument();
  });

  it('opens the generate modal and calls generateQrCodes with the chosen count and label', async () => {
    resetAll();
    listQrCodes.mockResolvedValue(POOL);
    listAdminWashingPoints.mockResolvedValue(POINTS);
    generateQrCodes.mockResolvedValue([FREE_CODE]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('QW-0001');
    await user.click(screen.getByText('Сгенерировать партию'));

    await screen.findByText('Новая партия QR-кодов');
    await user.click(screen.getByText('10 шт'));
    await user.click(screen.getByRole('button', { name: /Сгенерировать 10 кодов/ }));

    await waitFor(() => expect(generateQrCodes).toHaveBeenCalledWith(10, expect.stringContaining('Партия')));
  });
});
