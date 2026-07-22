import { render, screen } from '@testing-library/react-native';

import CadastroProScreen from './cadastro-pro';

jest.mock('@/features/auth/hooks', () => ({
  useRegisterProfessionalMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

describe('Conta do professor', () => {
  it('renderiza os 4 campos do PDF + confirmação (sem nascimento, sem CREF)', () => {
    render(<CadastroProScreen />);
    expect(screen.getByLabelText('Nome completo. campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('Telefone. campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('E-mail. campo obrigatório')).toBeTruthy();
    expect(screen.getByLabelText('Senha. campo obrigatório')).toBeTruthy();
    expect(screen.queryByText('Nascimento')).toBeNull();
    expect(screen.queryByLabelText('CREF')).toBeNull();
  });
});
