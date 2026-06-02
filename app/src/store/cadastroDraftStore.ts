import { create } from 'zustand';

// Rascunho do cadastro: carrega o invite_code vindo do deep link (rota /register)
// e o último erro de validação de convite para a UI exibir na tela de passo-1.
// Também guarda o erro de CPF já-em-uso para o passo-2 reexibir ao remontar
// (o passo 3 dispara o register, mas o CPF mora no passo 2).
type CadastroDraftState = {
  inviteCode: string | null;
  lastInviteError: string | null;
  lastCpfError: string | null;
  setInviteCode: (code: string | null) => void;
  setLastInviteError: (error: string | null) => void;
  setLastCpfError: (error: string | null) => void;
  clear: () => void;
};

export const useCadastroDraftStore = create<CadastroDraftState>((set) => ({
  inviteCode: null,
  lastInviteError: null,
  lastCpfError: null,
  setInviteCode: (code) => set({ inviteCode: code }),
  setLastInviteError: (error) => set({ lastInviteError: error }),
  setLastCpfError: (error) => set({ lastCpfError: error }),
  clear: () => set({ inviteCode: null, lastInviteError: null, lastCpfError: null }),
}));
