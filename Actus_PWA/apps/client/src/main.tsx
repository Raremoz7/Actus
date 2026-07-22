// Entry web. Substitui o index.ts do app (AppRegistry) por um mount DOM.
// A ordem importa: unistyles (side-effect de config) e as fontes antes do App.
import '@/theme/unistyles';
import './styles/fonts.css';

import { createRoot } from 'react-dom/client';
import App from '@/App';

const container = document.getElementById('root');
if (!container) throw new Error('#root não encontrado');

createRoot(container).render(<App />);

// [DEV-DEBUG] expõe store/router para inspeção via preview_eval. Remover depois.
if (import.meta.env.DEV) {
  void import('@/store/authStore').then((m) => ((window as unknown as Record<string, unknown>).__auth = m.useAuthStore));
  void import('@/navigation').then((m) => ((window as unknown as Record<string, unknown>).__nav = m));
}
