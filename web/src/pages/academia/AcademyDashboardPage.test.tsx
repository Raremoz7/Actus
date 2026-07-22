import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AcademyDashboardPage } from './AcademyDashboardPage';
import { useAcademyDashboard } from '../../hooks/useAcademy';
import { useNetworkDashboard } from '../../hooks/useAcademyNetwork';
import { useAuthStore } from '../../store/authStore';

vi.mock('../../hooks/useAcademy', () => ({ useAcademyDashboard: vi.fn() }));
vi.mock('../../hooks/useAcademyNetwork', () => ({ useNetworkDashboard: vi.fn() }));
vi.mock('../../store/authStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/authStore')>();
  return { ...actual, useAuthStore: vi.fn() };
});

const dashboardData = {
  kpis: {
    total_students: 120,
    active_students_7d: 60,
    check_ins_30d: 900,
    instructors: 8,
    adherence_7d_pct: 72,
  },
  instructor_ranking: [],
};

const networkData = {
  kpis: { total_students: 120, instructors: 8 },
  units: [{ id: 'u1', name: 'Unidade Centro', kpis: { total_students: 10, instructors: 2 } }],
};

function mockAcademy(academy: { name: string; network_role?: 'standalone' | 'network_hq' | 'unit' } | null) {
  vi.mocked(useAuthStore).mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ user: { academy } }),
  );
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AcademyDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AcademyDashboardPage — filtro de unidade (TEC-79)', () => {
  beforeEach(() => {
    vi.mocked(useAcademyDashboard).mockReturnValue({ data: dashboardData, isLoading: false } as ReturnType<typeof useAcademyDashboard>);
    vi.mocked(useNetworkDashboard).mockReturnValue({ data: networkData } as ReturnType<typeof useNetworkDashboard>);
  });

  it('mostra o filtro de unidade quando a academia é network_hq', () => {
    mockAcademy({ name: 'Matriz Central', network_role: 'network_hq' });
    renderPage();
    expect(screen.getByRole('button', { name: /todas as unidades/i })).toBeInTheDocument();
  });

  it('não mostra o filtro de unidade quando a academia não é network_hq', () => {
    mockAcademy({ name: 'Academia Independente', network_role: 'unit' });
    renderPage();
    expect(screen.queryByRole('button', { name: /todas as unidades/i })).not.toBeInTheDocument();
  });

  it('troca o título para a unidade e mostra a tag "Filial" ao selecionar', () => {
    mockAcademy({ name: 'Matriz Central', network_role: 'network_hq' });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /todas as unidades/i }));
    fireEvent.click(screen.getByText('Unidade Centro'));
    expect(screen.getByRole('heading', { name: 'Unidade Centro' })).toBeInTheDocument();
    expect(screen.getByText('Filial')).toBeInTheDocument();
  });
});
