import { create } from 'zustand';

// Store global de toast — feedback transitório de confirmação (ex.: "copiado").
// Uma única mensagem por vez; `id` incrementa a cada show() para re-disparar a
// animação/timer mesmo quando a mensagem repete. O <ToastHost/> (montado uma vez
// no layout raiz) observa este store, anima e chama hide() ao expirar.
interface ToastState {
  message: string | null;
  id: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  id: 0,
  show: (message) => set({ message, id: get().id + 1 }),
  hide: () => set({ message: null }),
}));

// Atalho imperativo — dispara um toast de qualquer lugar (inclusive fora de
// componente, como handlers async). Ex.: toast('Código de convite copiado').
export function toast(message: string): void {
  useToastStore.getState().show(message);
}
