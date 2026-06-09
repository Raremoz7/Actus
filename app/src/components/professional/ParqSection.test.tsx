import { render, screen } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

import { ParqSection } from './ParqSection';
import { useParqMock } from '@/mocks/parq';
import { buildSubmission } from '@/lib/parq';

function answers(yesIds: number[] = []) {
  return [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: yesIds.includes(id) }));
}

describe('ParqSection', () => {
  it('mostra "Aguardando resposta" quando o aluno não respondeu', () => {
    useParqMock.setState({ byStudent: {}, hydrated: true });
    render(<ParqSection studentId="sem-parq" />);
    expect(screen.getByText(/Aguardando resposta/i)).toBeTruthy();
  });

  it('lista as respostas quando há submissão (com sim → Atenção)', () => {
    const sub = buildSubmission('aluno-x', answers([2]), new Date(2026, 5, 9));
    useParqMock.setState({ byStudent: { 'aluno-x': sub }, hydrated: true });
    render(<ParqSection studentId="aluno-x" />);
    expect(screen.getByText('Atenção')).toBeTruthy();
  });
});
