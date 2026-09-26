import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type Owner } from 'q-wash-shared';
import { OwnersPage } from './OwnersPage';

const listOwners = vi.fn();

vi.mock('q-wash-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('q-wash-shared')>();
  return { ...actual, listOwners: (...a: unknown[]) => listOwners(...a) };
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

beforeEach(() => {
  listOwners.mockResolvedValue({ items: owners });
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
    // Aqua Line has no contact name/phone/email -> three dashes in its row
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
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
