import { render, screen } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { id: 'aluno-teste', tipo: 'aluno' } }),
}));

import ParqScreen from './par-q';
import { PARQ_QUESTIONS } from '@/types/parq';

describe('Tela Par-Q (aluno)', () => {
  it('renderiza as 7 perguntas', () => {
    render(<ParqScreen />);
    for (const q of PARQ_QUESTIONS) {
      expect(screen.getByText(q.text)).toBeTruthy();
    }
  });

  it('mantém "Enviar respostas" desabilitado até responder todas', () => {
    render(<ParqScreen />);
    const cta = screen.getByLabelText('Enviar respostas');
    expect(cta.props.accessibilityState?.disabled).toBe(true);
  });
});
