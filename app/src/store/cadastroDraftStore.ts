import { create } from 'zustand';

// Rascunho do cadastro: carrega o invite_code vindo do deep link (rota /register)
// e o último erro de validação de convite para a UI exibir na tela de passo-1.
type CadastroDraftState = {
  inviteCode: string | null;
  lastInviteError: string | null;
  setInviteCode: (code: string | null) => void;
  setLastInviteError: (error: string | null) => void;
  clear: () => void;
};

export const useCadastroDraftStore = create<CadastroDraftState>((set) => ({
  inviteCode: null,
  lastInviteError: null,
  setInviteCode: (code) => set({ inviteCode: code }),
  setLastInviteError: (error) => set({ lastInviteError: error }),
  clear: () => set({ inviteCode: null, lastInviteError: null }),
}));
