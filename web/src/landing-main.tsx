import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/landing/LandingPage';
import './index.css';

// Build isolado da landing (GitHub Pages). MemoryRouter mantém os <Link> funcionando
// como contexto, mas qualquer navegação (ex.: "Entrar") só re-renderiza a própria
// landing — vira uma âncora ao topo, sem destino real.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </MemoryRouter>
  </StrictMode>,
);
