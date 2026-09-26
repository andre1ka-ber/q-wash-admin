import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type WashingPoint } from 'q-wash-shared';
import { EditPointDrawer } from './EditPointDrawer';

const getWashingPoint = vi.fn();
const updateWashingPoint = vi.fn();
const listOwners = vi.fn();

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return {
    ...actual,
    getWashingPoint: (...a: unknown[]) => getWashingPoint(...a),
    updateWashingPoint: (...a: unknown[]) => updateWashingPoint(...a),
    listOwners: (...a: unknown[]) => listOwners(...a),
  };
});

// react-leaflet needs real layout jsdom lacks; the drawer's own logic is what's
// under test. The stand-in also lets a test move the pin.
vi.mock('./LocationPicker', () => ({
  LocationPicker: ({ value, onChange }: { value: { lat: number; lng: number } | null; onChange: (v: { lat: number; lng: number }) => void }) => (
    <div>
      <span>pin:{value ? `${value.lat},${value.lng}` : 'none'}</span>
      <button type="button" onClick={() => onChange({ lat: 40, lng: 70 })}>
        move pin
      </button>
    </div>
  ),
}));

const POINT = {
  id: 'p1',
  name: 'Pegasus',
  address: 'ул. Рудаки, 84',
  latitude: 38.5,
  longitude: 68.7,
  boxes_count: 2,
  open_time: '09:00',
  close_time: '21:00',
  status: 'active',
  owner_id: 'o1',
} as WashingPoint;

function renderDrawer(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EditPointDrawer pointId="p1" onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
}

function stubApi() {
  getWashingPoint.mockResolvedValue(POINT);
  listOwners.mockResolvedValue({ items: [{ id: 'o1', name: 'ООО Titan' }, { id: 'o2', name: 'Pegas Auto' }] });
  updateWashingPoint.mockResolvedValue(POINT);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mocks are set up inline in each test, not in a beforeEach: an arrow
// `() => mock.mockResolvedValue()` returns the mock, which vitest would run as
// a teardown (see PROGRESS.md).
describe('EditPointDrawer', () => {
  it('loads the point into the form', async () => {
    stubApi();
    renderDrawer();
    expect(await screen.findByDisplayValue('Pegasus')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ул. Рудаки, 84')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('21:00')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    expect(screen.getByText('pin:38.5,68.7')).toBeInTheDocument();
    const [ownerSelect, statusSelect] = screen.getAllByRole('combobox');
    expect(ownerSelect).toHaveValue('o1');
    expect(statusSelect).toHaveValue('active');
  });

  it('saves the edits as one update, trimmed, and closes', async () => {
    stubApi();
    const user = userEvent.setup();
    const { onClose } = renderDrawer();
    const name = await screen.findByDisplayValue('Pegasus');

    await user.clear(name);
    await user.type(name, '  Pegasus Pro  ');
    await user.click(screen.getByRole('button', { name: 'move pin' }));
    const [ownerSelect, statusSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(ownerSelect!, 'o2');
    await user.selectOptions(statusSelect!, 'paused');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(updateWashingPoint).toHaveBeenCalledTimes(1));
    expect(updateWashingPoint).toHaveBeenCalledWith('p1', {
      name: 'Pegasus Pro',
      address: 'ул. Рудаки, 84',
      latitude: 40,
      longitude: 70,
      owner_id: 'o2',
      boxes_count: 2,
      open_time: '09:00',
      close_time: '21:00',
      status: 'paused',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('omits the owner when "Без владельца" is chosen', async () => {
    stubApi();
    const user = userEvent.setup();
    renderDrawer();
    await screen.findByDisplayValue('Pegasus');
    await user.selectOptions(screen.getAllByRole('combobox')[0]!, '');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(updateWashingPoint).toHaveBeenCalled());
    expect(updateWashingPoint.mock.calls[0]![1].owner_id).toBeUndefined();
  });

  it('shows the API message and stays open when saving fails', async () => {
    stubApi();
    updateWashingPoint.mockRejectedValue(new ApiError('duplicate_point', 'Такая мойка уже есть', 409));
    const user = userEvent.setup();
    const { onClose } = renderDrawer();
    await screen.findByDisplayValue('Pegasus');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText('Такая мойка уже есть')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a load error and cannot be saved', async () => {
    getWashingPoint.mockRejectedValue(new ApiError('not_found', 'нет', 404));
    listOwners.mockResolvedValue({ items: [] });
    renderDrawer();
    expect(await screen.findByText('Не удалось загрузить данные мойки')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled();
  });

  it('cancel closes without saving', async () => {
    stubApi();
    const user = userEvent.setup();
    const { onClose } = renderDrawer();
    await screen.findByDisplayValue('Pegasus');
    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onClose).toHaveBeenCalled();
    expect(updateWashingPoint).not.toHaveBeenCalled();
  });
});
