import { render, screen } from '@testing-library/react-native';

import ContaAlunoScreen from './index';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';

jest.mock('@/features/auth/hooks', () => ({
  useRegisterMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

describe('Conta do aluno (tela única)', () => {
  beforeEach(() => useCadastroDraftStore.getState().clear());

  it('renderiza os campos essenciais (telefone agora obrigatório)', () => {
    render(<ContaAlunoScreen />);
    expect(screen.getByLabelText('Nome completo. campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('Telefone. campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('E-mail. campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('Senha. campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar senha. campo obrigatório')).toBeTruthy();
    expect(screen.getByText('Nascimento')).toBeTruthy();
  });

  it('com convite do deep link mostra o selo do código', () => {
    useCadastroDraftStore.getState().setInviteCode('ACTUSDEMO');
    render(<ContaAlunoScreen />);
    expect(screen.getByText(/Código recebido pelo link/i)).toBeTruthy();
  });

  it('sem convite NÃO mostra o selo (cadastro sem vínculo)', () => {
    render(<ContaAlunoScreen />);
    expect(screen.queryByText(/Código recebido pelo link/i)).toBeNull();
  });
});
