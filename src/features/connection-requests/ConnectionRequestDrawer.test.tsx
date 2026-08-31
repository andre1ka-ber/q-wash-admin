import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from 'q-wash-shared';
import { ConnectionRequestDrawer } from './ConnectionRequestDrawer';

const { createConnectionRequest } = vi.hoisted(() => ({
  createConnectionRequest: vi.fn(),
}));

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return { ...actual, createConnectionRequest };
});

function renderDrawer(onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ConnectionRequestDrawer onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, boxesCount: string) {
  await user.type(screen.getByPlaceholderText('Например, Titan Wash'), 'Titan Wash');
  await user.type(screen.getByPlaceholderText('Имя Фамилия'), 'Ivan');
  await user.type(screen.getByPlaceholderText('+992 __ ___ __ __'), '+992900000000');
  await user.type(screen.getByPlaceholderText('Улица, дом'), 'Rudaki 1');
  await user.type(screen.getByPlaceholderText('2'), boxesCount);
}

// Resetting `createConnectionRequest` in a beforeEach (rather than inline,
// first line of each test) reproducibly makes Vitest 4.1.11 misattribute an
// already-caught react-query mutation rejection as this test's own uncaught
// error — a timing quirk in Vitest's mock-promise tracking, confirmed by
// isolating it to the beforeEach call itself. Inline reset avoids it.
describe('ConnectionRequestDrawer submit validation', () => {
  it('rejects a non-integer boxes_count without calling the API', async () => {
    createConnectionRequest.mockReset();
    createConnectionRequest.mockResolvedValue({});
    const user = userEvent.setup();
    renderDrawer();

    await fillRequiredFields(user, '1.5');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByText('Укажите количество боксов (целое число, не меньше 1)')).toBeInTheDocument();
    expect(createConnectionRequest).not.toHaveBeenCalled();
  });

  it('rejects a boxes_count below 1 without calling the API', async () => {
    createConnectionRequest.mockReset();
    createConnectionRequest.mockResolvedValue({});
    const user = userEvent.setup();
    renderDrawer();

    await fillRequiredFields(user, '0');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByText('Укажите количество боксов (целое число, не меньше 1)')).toBeInTheDocument();
    expect(createConnectionRequest).not.toHaveBeenCalled();
  });

  it('trims fields, omits an empty note, and closes on success', async () => {
    createConnectionRequest.mockReset();
    createConnectionRequest.mockResolvedValue({});
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.type(screen.getByPlaceholderText('Например, Titan Wash'), '  Titan Wash  ');
    await user.type(screen.getByPlaceholderText('Имя Фамилия'), 'Ivan');
    await user.type(screen.getByPlaceholderText('+992 __ ___ __ __'), '+992900000000');
    await user.type(screen.getByPlaceholderText('Улица, дом'), 'Rudaki 1');
    await user.type(screen.getByPlaceholderText('2'), '3');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(createConnectionRequest).toHaveBeenCalledWith(
      expect.objectContaining({ business_name: 'Titan Wash', boxes_count: 3, note: undefined }),
    );
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows the ApiError message on a failed submit and does not close', async () => {
    createConnectionRequest.mockReset();
    createConnectionRequest.mockRejectedValue(new ApiError('validation_error', 'Проверьте адрес', 400));
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await fillRequiredFields(user, '2');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByText('Проверьте адрес')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
