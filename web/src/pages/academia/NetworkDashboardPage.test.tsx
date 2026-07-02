import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NetworkDashboardPage } from './NetworkDashboardPage';
import { api } from '../../api/client';

vi.mock('../../api/client', () => ({ api: { get: vi.fn() } }));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NetworkDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderPageWithRouting() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/app/academia/rede']}>
        <Routes>
          <Route path="/app/academia/rede" element={<NetworkDashboardPage />} />
          <Route path="/app/academia" element={<div>redirected</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NetworkDashboardPage', () => {
  it('mostra estado vazio quando a rede não tem unidades', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { kpis: { total_students: 0, instructors: 0 }, units: [] } });
    renderPage();
    expect(await screen.findByText(/nenhuma filial vinculada ainda/i)).toBeInTheDocument();
  });

  it('mostra KPIs consolidados e a tabela por unidade', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        kpis: { total_students: 12, instructors: 3 },
        units: [
          { id: 'u1', name: 'Unidade A', kpis: { total_students: 7, instructors: 2 } },
          { id: 'u2', name: 'Unidade B', kpis: { total_students: 5, instructors: 1 } },
        ],
      },
    });
    renderPage();
    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(await screen.findByText('Unidade A')).toBeInTheDocument();
    expect(await screen.findByText('Unidade B')).toBeInTheDocument();
  });

  it('redireciona para o dashboard próprio quando a API retorna erro (403 para gestor sem acesso à rede)', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('403'));
    renderPageWithRouting();
    expect(await screen.findByText('redirected')).toBeInTheDocument();
    expect(screen.queryByText(/nenhuma filial vinculada ainda/i)).not.toBeInTheDocument();
  });
});
