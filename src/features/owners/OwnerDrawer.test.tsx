import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from 'q-wash-shared';
import type { Owner } from 'q-wash-shared';
import { OwnerDrawer } from './OwnerDrawer';

const { createOwner, updateOwner } = vi.hoisted(() => ({
  createOwner: vi.fn(),
  updateOwner: vi.fn(),
}));

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return { ...actual, createOwner, updateOwner };
});

const OWNER: Owner = {
  id: 'owner-1',
  name: 'ООО Titan',
  contact_name: 'Ivan',
  contact_phone: '+992900000000',
  contact_email: 'ivan@example.com',
};

function renderDrawer(owner: Owner | undefined, onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <OwnerDrawer owner={owner} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
}

// Resetting these mocks in a beforeEach (rather than inline, first line of
// each test) reproducibly makes Vitest 4.1.11 misattribute an already-caught
// react-query mutation rejection as this test's own uncaught error — a
// timing quirk in Vitest's mock-promise tracking, confirmed by isolating it
// to the beforeEach call itself. Inline reset avoids it.
describe('OwnerDrawer submit', () => {
  it('creates a new owner, trims the name, and omits blank optional fields', async () => {
    createOwner.mockReset();
    updateOwner.mockReset();
    createOwner.mockResolvedValue(OWNER);
    const user = userEvent.setup();
    const { onClose } = renderDrawer(undefined);

    await user.type(screen.getByPlaceholderText('ООО «...»'), '  Titan Wash  ');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(createOwner).toHaveBeenCalledWith({
      name: 'Titan Wash',
      contact_name: undefined,
      contact_phone: undefined,
      contact_email: undefined,
    });
    expect(updateOwner).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('updates an existing owner by id instead of creating a new one', async () => {
    createOwner.mockReset();
    updateOwner.mockReset();
    updateOwner.mockResolvedValue(OWNER);
    const user = userEvent.setup();
    renderDrawer(OWNER);

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(updateOwner).toHaveBeenCalledWith('owner-1', expect.objectContaining({ name: 'ООО Titan' }));
    expect(createOwner).not.toHaveBeenCalled();
  });

  it('shows the ApiError message on failure and does not close', async () => {
    createOwner.mockReset();
    updateOwner.mockReset();
    createOwner.mockRejectedValue(new ApiError('duplicate_owner', 'Такой владелец уже есть', 409));
    const user = userEvent.setup();
    const { onClose } = renderDrawer(undefined);

    await user.type(screen.getByPlaceholderText('ООО «...»'), 'Titan Wash');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByText('Такой владелец уже есть')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
