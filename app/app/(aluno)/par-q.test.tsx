import { fireEvent, render, screen } from '@testing-library/react-native';

import ParqScreen from './par-q';
import { PARQ_QUESTIONS, type ParqSubmission } from '@/types/parq';

const mockMutate = jest.fn(
  async (_args: { studentId: string; answers: { question_id: number; value: boolean }[] }) =>
    undefined,
);
let mockExisting: ParqSubmission | null = null;

jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { id: 'aluno-teste', tipo: 'aluno' } }),
}));
jest.mock('@/hooks/useParq', () => ({
  useParqSubmission: () => mockExisting,
  useSubmitParq: () => ({ mutateAsync: mockMutate }),
}));

beforeEach(() => {
  mockMutate.mockClear();
  mockExisting = null;
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

  it('envia com any_yes=false (todas não) e mostra a nota tranquila', async () => {
    render(<ParqScreen />);
    for (const no of screen.getAllByText('Não')) {
      fireEvent.press(no);
    }
    const cta = screen.getByLabelText('Enviar respostas');
    expect(cta.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(cta);
    expect(await screen.findByText(/Tudo certo/i)).toBeTruthy();
    expect(mockMutate).toHaveBeenCalledTimes(1);
    const arg = mockMutate.mock.calls[0]![0];
    expect(arg.studentId).toBe('aluno-teste');
    expect(arg.answers).toHaveLength(7);
    expect(arg.answers.some((a) => a.value)).toBe(false);
  });

  it('com um "sim", mostra a nota de avaliação médica', async () => {
    render(<ParqScreen />);
    fireEvent.press(screen.getAllByText('Sim')[0]!);
    for (const no of screen.getAllByText('Não').slice(1)) {
      fireEvent.press(no);
    }
    fireEvent.press(screen.getByLabelText('Enviar respostas'));

    expect(await screen.findByText(/avaliação médica/i)).toBeTruthy();
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0]![0].answers.some((a) => a.value)).toBe(true);
  });

  it('modo revisão: pré-preenche com a submissão anterior e troca o CTA', async () => {
    mockExisting = {
      student_id: 'aluno-teste',
      answers: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: id === 2 })),
      any_yes: true,
      answered_at: '2026-06-01',
      valid_until: '2027-06-01',
    };
    render(<ParqScreen />);
    expect(await screen.findByText('Suas respostas')).toBeTruthy();
    const cta = screen.getByLabelText('Atualizar respostas');
    expect(cta.props.accessibilityState?.disabled).toBe(false);
  });
});
