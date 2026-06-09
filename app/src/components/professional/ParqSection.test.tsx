import { render, screen } from '@testing-library/react-native';

import { ParqSection } from './ParqSection';
import { useParqMock } from '@/mocks/parq';
import { buildSubmission } from '@/lib/parq';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

function answers(yesIds: number[] = []) {
  return [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: yesIds.includes(id) }));
}

describe('ParqSection', () => {
  it('mostra "Aguardando resposta" e o lembrete futuro quando o aluno não respondeu', () => {
    useParqMock.setState({ byStudent: {}, hydrated: true });
    render(<ParqSection studentId="sem-parq" />);
    expect(screen.getByText(/Aguardando resposta/i)).toBeTruthy();
    // Affordance do lembrete [fluxo futuro: push] — informativa, sem navegação morta.
    expect(screen.getByText('Lembrar aluno')).toBeTruthy();
    expect(screen.getByText('em breve')).toBeTruthy();
  });

  it('lista as respostas com os "sim" destacados e o selo Atenção', () => {
    const sub = buildSubmission('aluno-x', answers([2]), new Date(2026, 5, 9));
    useParqMock.setState({ byStudent: { 'aluno-x': sub }, hydrated: true });
    render(<ParqSection studentId="aluno-x" />);
    expect(screen.getByText('Atenção')).toBeTruthy();
    // 1 resposta "sim" destacada + 6 "não".
    expect(screen.getAllByText('Sim')).toHaveLength(1);
    expect(screen.getAllByText('Não')).toHaveLength(6);
  });
});
