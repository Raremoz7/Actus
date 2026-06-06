import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import DesafioProScreen from './[id]';

// Hooks de dados/mutations dependem de QueryClientProvider/store; mockamos para
// um render determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUpdate = jest.fn();
const mockAddParticipants = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

let mockParams: { id?: string } = {};
let mockDetail: { data: unknown; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};
let mockRanking: { data: unknown; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};
let mockReport: { data: unknown; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};
let mockStudents: { data: unknown; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};
let mockUpdateState = { mutate: mockUpdate, isPending: false };
let mockAddState = { mutate: mockAddParticipants, isPending: false };

jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/hooks/useProChallengeDetail', () => ({
  useProChallengeDetail: () => mockDetail,
}));

jest.mock('@/hooks/useProChallengeRanking', () => ({
  useProChallengeRanking: () => mockRanking,
}));

jest.mock('@/hooks/useProChallengeReport', () => ({
  useProChallengeReport: () => mockReport,
}));

jest.mock('@/hooks/useStudents', () => ({
  useStudents: () => mockStudents,
}));

jest.mock('@/hooks/useChallengeMutations', () => ({
  useChallengeMutations: () => ({
    create: { mutate: jest.fn(), isPending: false },
    update: mockUpdateState,
    addParticipants: mockAddState,
  }),
}));

const CHALLENGE_ID = '22222222-2222-2222-2222-222222222222';
const STUDENT_A = '11111111-1111-1111-1111-111111111111';
const STUDENT_B = '33333333-3333-3333-3333-333333333333';

function makeChallenge(overrides: Record<string, unknown> = {}) {
  return {
    id: CHALLENGE_ID,
    owner_professional_id: '99999999-9999-9999-9999-999999999999',
    name: 'Janeiro sem falta',
    starts_on: '2026-01-01',
    ends_on: '2026-01-31',
    visibility: 'public_among_participants',
    status: 'draft',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const participants = [
  {
    student_id: STUDENT_A,
    status: 'active',
    display_name: 'Marina',
    invited_at: '2026-01-01T00:00:00.000Z',
    responded_at: '2026-01-02T00:00:00.000Z',
  },
];

const students = [
  {
    id: STUDENT_A,
    email: 'marina@ex.com',
    full_name: 'Marina',
    birth_date: null,
    professional_role: 'personal',
    linked_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: STUDENT_B,
    email: 'bruno@ex.com',
    full_name: 'Bruno',
    birth_date: null,
    professional_role: 'personal',
    linked_at: '2026-01-01T00:00:00.000Z',
  },
];

beforeEach(() => {
  mockUpdate.mockReset();
  mockAddParticipants.mockReset();
  mockBack.mockReset();
  mockReplace.mockReset();
  mockParams = { id: CHALLENGE_ID };
  mockDetail = {
    data: { challenge: makeChallenge(), participants },
    isLoading: false,
    isError: false,
  };
  mockRanking = { data: { visibility: 'public_among_participants', ranking: [] }, isLoading: false, isError: false };
  mockReport = {
    data: {
      ok: true,
      challenge_id: CHALLENGE_ID,
      invited_count: 2,
      active_count: 3,
      declined_count: 1,
      average_active_days: 4.5,
      average_adherence_ratio: 0.72,
      challenge_day_span: 31,
      participants: [
        {
          student_id: STUDENT_A,
          display_name: 'Marina',
          active_days: 5,
          streak_current_in_challenge: 0,
          last_activity_date: '2026-01-10',
          streak_broken_hint: true,
        },
      ],
    },
    isLoading: false,
    isError: false,
  };
  mockStudents = { data: { students }, isLoading: false, isError: false };
  mockUpdateState = { mutate: mockUpdate, isPending: false };
  mockAddState = { mutate: mockAddParticipants, isPending: false };
});

describe('DesafioProScreen', () => {
  it('mostra nome, status, período e visibilidade do desafio', () => {
    render(<DesafioProScreen />);
    expect(screen.getByText('Janeiro sem falta')).toBeTruthy();
    // O Tag aplica uppercase via estilo (textTransform); o nó de texto mantém o casing original.
    expect(screen.getByText('Rascunho')).toBeTruthy();
    expect(screen.getByText('01/01 – 31/01')).toBeTruthy();
    expect(
      screen.getByText('Ranking público entre participantes'),
    ).toBeTruthy();
  });

  it('lista os participantes atuais com status', () => {
    render(<DesafioProScreen />);
    expect(screen.getByText('Marina')).toBeTruthy();
    // Tag de status do participante (uppercase é só visual via estilo).
    expect(screen.getByText('Ativo')).toBeTruthy();
  });

  it('publica o rascunho com status active', () => {
    render(<DesafioProScreen />);
    fireEvent.press(screen.getByText('Publicar desafio'));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][0]).toMatchObject({
      id: CHALLENGE_ID,
      body: { status: 'active' },
    });
  });

  it('encerra o desafio ativo (via confirmação) com status ended', () => {
    // Dispara o callback do botão destrutivo do Alert de confirmação.
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_t, _m, buttons) => {
        const endBtn = buttons?.find((b) => b.text === 'Encerrar desafio');
        endBtn?.onPress?.();
      });
    mockDetail = {
      data: { challenge: makeChallenge({ status: 'active' }), participants },
      isLoading: false,
      isError: false,
    };
    render(<DesafioProScreen />);
    fireEvent.press(screen.getByText('Encerrar desafio'));
    expect(mockUpdate.mock.calls[0][0].body.status).toBe('ended');
    alertSpy.mockRestore();
  });

  it('não mostra ação de status quando encerrado', () => {
    mockDetail = {
      data: { challenge: makeChallenge({ status: 'ended' }), participants },
      isLoading: false,
      isError: false,
    };
    render(<DesafioProScreen />);
    expect(screen.queryByText('Publicar desafio')).toBeNull();
    expect(screen.queryByText('Encerrar desafio')).toBeNull();
    expect(screen.queryByText('Adicionar participantes')).toBeNull();
  });

  it('abre o sheet e adiciona participantes selecionados (exclui quem já está)', () => {
    render(<DesafioProScreen />);
    fireEvent.press(screen.getByText('Adicionar participantes'));

    // Marina já é participante → não aparece na seleção; Bruno é elegível.
    expect(screen.getByLabelText('Bruno')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Bruno'));
    fireEvent.press(screen.getByText('Adicionar 1 aluno'));

    expect(mockAddParticipants).toHaveBeenCalledTimes(1);
    expect(mockAddParticipants.mock.calls[0][0]).toMatchObject({
      id: CHALLENGE_ID,
      studentIds: [STUDENT_B],
    });
  });

  it('renderiza linhas do ranking quando há dados', () => {
    mockRanking = {
      data: {
        visibility: 'public_among_participants',
        ranking: [
          {
            position: 1,
            student_id: STUDENT_A,
            display_name: 'Marina',
            streak_current_in_challenge: 7,
            active_days: 20,
          },
        ],
      },
      isLoading: false,
      isError: false,
    };
    render(<DesafioProScreen />);
    expect(screen.getByText('20d ativos')).toBeTruthy();
  });

  it('mostra mensagem discreta quando o ranking falha', () => {
    mockRanking = { data: undefined, isLoading: false, isError: true };
    render(<DesafioProScreen />);
    expect(screen.getByText('Ranking indisponível agora.')).toBeTruthy();
  });

  it('mostra estado de erro do detalhe', () => {
    mockDetail = { data: undefined, isLoading: false, isError: true };
    render(<DesafioProScreen />);
    expect(
      screen.getByText('Não foi possível carregar este desafio.'),
    ).toBeTruthy();
  });

  it('mostra o bloco de KPIs do relatório (aderência, dias ativos, participação)', () => {
    render(<DesafioProScreen />);
    // average_adherence_ratio 0.72 → 72%.
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('Aderência média')).toBeTruthy();
    // average_active_days 4.5.
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('Média de dias ativos')).toBeTruthy();
    expect(screen.getByText('Participação')).toBeTruthy();
  });

  it('realça quem quebrou a sequência (gancho de retenção)', () => {
    render(<DesafioProScreen />);
    expect(screen.getByText('Quebrou a sequência')).toBeTruthy();
  });

  it('mostra "convidado há N dias" em participantes convidados', () => {
    mockDetail = {
      data: {
        challenge: makeChallenge(),
        participants: [
          {
            student_id: STUDENT_B,
            status: 'invited',
            display_name: 'Bruno',
            // ~3 dias atrás a partir de agora.
            invited_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
            responded_at: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
    };
    render(<DesafioProScreen />);
    expect(screen.getByText('convidado há 3 dias')).toBeTruthy();
  });
});
