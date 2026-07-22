import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AcademiasPage } from './AcademiasPage';
import { useAcademies, useCreateAcademy, useCreateAcademyManager } from '../../hooks/useAcademyAdmin';
import { ToastProvider } from '../../components/ui/Toast';

vi.mock('../../hooks/useAcademyAdmin', () => ({
  useAcademies: vi.fn(),
  useCreateAcademy: vi.fn(),
  useCreateAcademyManager: vi.fn(),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <AcademiasPage />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const academies = [
  { id: 'a1', name: 'Academia Standalone', slug: null, cnpj: null, timezone: 'UTC', status: 'active', instructors: 0, managers: 0, created_at: '', network_role: 'standalone' as const, parent_academy_id: null },
  { id: 'a2', name: 'Matriz Central', slug: null, cnpj: null, timezone: 'UTC', status: 'active', instructors: 0, managers: 0, created_at: '', network_role: 'network_hq' as const, parent_academy_id: null },
  { id: 'a3', name: 'Filial Sul', slug: null, cnpj: null, timezone: 'UTC', status: 'active', instructors: 0, managers: 0, created_at: '', network_role: 'unit' as const, parent_academy_id: 'a2' },
];

describe('AcademiasPage — vincular a uma rede existente', () => {
  beforeEach(() => {
    vi.mocked(useAcademies).mockReturnValue({ data: academies, isLoading: false } as ReturnType<typeof useAcademies>);
    vi.mocked(useCreateAcademy).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateAcademy>);
    vi.mocked(useCreateAcademyManager).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateAcademyManager>);
  });

  it('mostra o seletor de matriz apenas com academias network_hq ao escolher "Filial/franquia"', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Nova academia' }));

    const roleSelect = screen.getByLabelText('Tipo de rede');
    await user.selectOptions(roleSelect, 'unit');

    const parentSelect = await screen.findByLabelText('Rede (matriz)');
    const options = Array.from(parentSelect.querySelectorAll('option')).map((o) => o.textContent);

    expect(options).toContain('Matriz Central');
    expect(options).not.toContain('Academia Standalone');
    expect(options).not.toContain('Filial Sul');
  });

  it('não mostra o seletor de matriz quando o tipo é "Academia independente" (default)', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Nova academia' }));

    expect(screen.getByLabelText('Tipo de rede')).toHaveValue('standalone');
    expect(screen.queryByLabelText('Rede (matriz)')).not.toBeInTheDocument();
  });

  it('submete network_role "unit" com o parent_academy_id da matriz escolhida', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useCreateAcademy).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateAcademy>);

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Nova academia' }));

    await user.type(screen.getByLabelText('Nome'), 'Filial Norte');
    await user.selectOptions(screen.getByLabelText('Tipo de rede'), 'unit');

    const parentSelect = await screen.findByLabelText('Rede (matriz)');
    await user.selectOptions(parentSelect, 'a2');

    await user.click(screen.getByRole('button', { name: 'Criar' }));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Filial Norte',
        network_role: 'unit',
        parent_academy_id: 'a2',
      }),
    );
  });
});
