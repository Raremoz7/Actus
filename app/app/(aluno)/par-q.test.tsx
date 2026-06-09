import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ParqScreen from './par-q';
import { PARQ_QUESTIONS, type ParqAnswer } from '@/types/parq';
import { useParqMock } from '@/mocks/parq';
import { buildSubmission } from '@/lib/parq';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { id: 'aluno-teste', tipo: 'aluno' } }),
}));

function answers(yesIds: number[] = []): ParqAnswer[] {
  return [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: yesIds.includes(id) }));
}

// O store é módulo-singleton: zera entre testes para um teste não vazar no outro.
beforeEach(() => {
  useParqMock.setState({ byStudent: {}, hydrated: false });
});

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

  it('habilita o envio após as 7 respostas e grava com any_yes=false (todas não)', async () => {
    render(<ParqScreen />);
    for (const no of screen.getAllByText('Não')) {
      fireEvent.press(no);
    }
    const cta = screen.getByLabelText('Enviar respostas');
    expect(cta.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(cta);
    // Pós-envio sem nenhum "sim": nota tranquila, sem alarme.
    expect(await screen.findByText(/Tudo certo/i)).toBeTruthy();
    await waitFor(() => {
      expect(useParqMock.getState().byStudent['aluno-teste']?.any_yes).toBe(false);
    });
  });

  it('com um "sim", mostra a nota de avaliação médica e grava any_yes=true', async () => {
    render(<ParqScreen />);
    fireEvent.press(screen.getAllByText('Sim')[0]!);
    for (const no of screen.getAllByText('Não').slice(1)) {
      fireEvent.press(no);
    }
    fireEvent.press(screen.getByLabelText('Enviar respostas'));

    expect(await screen.findByText(/avaliação médica/i)).toBeTruthy();
    await waitFor(() => {
      expect(useParqMock.getState().byStudent['aluno-teste']?.any_yes).toBe(true);
    });
  });

  it('modo revisão: pré-preenche com a submissão anterior e troca o CTA', async () => {
    const sub = buildSubmission('aluno-teste', answers([2]), new Date(2026, 5, 1));
    useParqMock.setState({ byStudent: { 'aluno-teste': sub }, hydrated: true });

    render(<ParqScreen />);
    expect(await screen.findByText('Suas respostas')).toBeTruthy();
    // Pré-preenchido (7 respostas) → o CTA de atualização já nasce habilitado.
    const cta = screen.getByLabelText('Atualizar respostas');
    expect(cta.props.accessibilityState?.disabled).toBe(false);
  });
});
