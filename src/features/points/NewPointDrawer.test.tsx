import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from 'q-wash-shared';
import { NewPointDrawer } from './NewPointDrawer';

const { createWashingPoint, listOwners } = vi.hoisted(() => ({
  createWashingPoint: vi.fn(),
  listOwners: vi.fn(),
}));

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return { ...actual, createWashingPoint, listOwners };
});

// LocationPicker wraps react-leaflet's MapContainer, which needs real
// layout/canvas support jsdom doesn't provide. NewPointDrawer's own logic
// under test is the submit-validation branching, not the map itself, so
// stand in with a button that reports a fixed point.
vi.mock('./LocationPicker', () => ({
  LocationPicker: ({ onChange }: { onChange: (v: { lat: number; lng: number }) => void }) => (
    <button type="button" onClick={() => onChange({ lat: 38.5598, lng: 68.787 })}>
      pick location
    </button>
  ),
}));

function renderDrawer(onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <NewPointDrawer onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
}

// Resetting these mocks in a beforeEach (rather than inline, first line of
// each test) reproducibly makes Vitest 4.1.11 misattribute an already-caught
// react-query mutation rejection as this test's own uncaught error — a
// timing quirk in Vitest's mock-promise tracking, confirmed by isolating it
// to the beforeEach call itself. Inline reset avoids it.
//
// Note: the boxes-count field is `type="number" min={1}` with no `step`, so
// the browser's own constraint validation (default step=1) already blocks a
// non-integer or sub-1 value before the form's onSubmit ever runs — the
// component's `!Number.isInteger(...) || < 1` check in handleSubmit is
// unreachable through this input as currently built. Not fixing it (out of
// scope for a test-only task), just not testing an unreachable branch.
describe('NewPointDrawer submit validation', () => {
  it('blocks submit with no location picked', async () => {
    createWashingPoint.mockReset();
    listOwners.mockReset();
    listOwners.mockResolvedValue({ items: [] });
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByPlaceholderText('Например, Titan Wash Сомони'), 'Titan Wash');
    await user.type(screen.getByPlaceholderText('Улица, дом'), 'Rudaki 1');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByText('Укажите точку на карте')).toBeInTheDocument();
    expect(createWashingPoint).not.toHaveBeenCalled();
  });

  it('submits with the picked coordinates once the location check passes', async () => {
    createWashingPoint.mockReset();
    listOwners.mockReset();
    listOwners.mockResolvedValue({ items: [] });
    createWashingPoint.mockResolvedValue({});
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.type(screen.getByPlaceholderText('Например, Titan Wash Сомони'), 'Titan Wash');
    await user.type(screen.getByPlaceholderText('Улица, дом'), 'Rudaki 1');
    await user.click(screen.getByRole('button', { name: 'pick location' }));
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(createWashingPoint).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Titan Wash', address: 'Rudaki 1', latitude: 38.5598, longitude: 68.787 }),
    );
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows the ApiError message on a failed create and does not close', async () => {
    createWashingPoint.mockReset();
    listOwners.mockReset();
    listOwners.mockResolvedValue({ items: [] });
    createWashingPoint.mockRejectedValue(new ApiError('duplicate_point', 'Такая точка уже есть', 409));
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.type(screen.getByPlaceholderText('Например, Titan Wash Сомони'), 'Titan Wash');
    await user.type(screen.getByPlaceholderText('Улица, дом'), 'Rudaki 1');
    await user.click(screen.getByRole('button', { name: 'pick location' }));
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByText('Такая точка уже есть')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
