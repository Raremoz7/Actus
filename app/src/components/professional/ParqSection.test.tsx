import { render, screen } from '@testing-library/react-native';

import { ParqSection } from './ParqSection';
import type { ParqSubmission } from '@/types/parq';

let mockSub: ParqSubmission | null = null;
jest.mock('@/hooks/useParq', () => ({
  useParqSubmission: () => mockSub,
}));

beforeEach(() => {
  mockSub = null;
});

describe('ParqSection', () => {
  it('mostra "Aguardando resposta" e o lembrete futuro quando o aluno não respondeu', () => {
    mockSub = null;
    render(<ParqSection studentId="sem-parq" />);
    expect(screen.getByText(/Aguardando resposta/i)).toBeTruthy();
    // Affordance do lembrete [fluxo futuro: push] — informativa, sem navegação morta.
    expect(screen.getByText('Lembrar aluno')).toBeTruthy();
    expect(screen.getByText('em breve')).toBeTruthy();
  });

  it('lista as respostas com os "sim" destacados e o selo Atenção', () => {
    mockSub = {
      student_id: 'aluno-x',
      answers: [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: id === 2 })),
      any_yes: true,
      answered_at: '2026-06-09',
      valid_until: '2027-06-09',
    };
    render(<ParqSection studentId="aluno-x" />);
    expect(screen.getByText('Atenção')).toBeTruthy();
    // 1 resposta "sim" destacada + 6 "não".
    expect(screen.getAllByText('Sim')).toHaveLength(1);
    expect(screen.getAllByText('Não')).toHaveLength(6);
  });
});
