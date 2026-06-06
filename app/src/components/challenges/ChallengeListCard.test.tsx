import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChallengeListCard } from './ChallengeListCard';

describe('ChallengeListCard', () => {
  it('mostra nome e "dia X de Y" quando participante ativo', () => {
    render(
      <ChallengeListCard
        name="Junho no shape"
        dayProgress={{ day: 12, total: 30 }}
        status="active"
        statusLabel="Ativo"
        participantStatus="active"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Junho no shape')).toBeTruthy();
    expect(screen.getByText('dia 12 de 30')).toBeTruthy();
    expect(screen.getByText('Ativo')).toBeTruthy();
  });

  it('quando "Em breve" (draft) mostra contagem regressiva no lugar da barra', () => {
    render(
      <ChallengeListCard
        name="Maratona de agosto"
        dayProgress={{ day: 0, total: 30 }}
        status="draft"
        statusLabel="Em breve"
        daysUntilStart={3}
        participantStatus="active"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('começa em 3 dias')).toBeTruthy();
    expect(screen.queryByText('dia 0 de 30')).toBeNull();
  });

  it('mostra teaser de ranking quando público (posição + sequência)', () => {
    render(
      <ChallengeListCard
        name="Junho no shape"
        dayProgress={{ day: 12, total: 30 }}
        status="active"
        statusLabel="Ativo"
        participantStatus="active"
        rankingTeaser={{ position: 2, streak: 5 }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Você está em 2º')).toBeTruthy();
    expect(screen.getByText('5 de sequência')).toBeTruthy();
  });

  it('quando convidado mostra "Aceitar" e "Recusar" e dispara onAccept', () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    render(
      <ChallengeListCard
        name="Desafio do agachamento"
        dayProgress={{ day: 0, total: 21 }}
        status="active"
        statusLabel="Convite"
        participantStatus="invited"
        onPress={jest.fn()}
        onAccept={onAccept}
        onDecline={onDecline}
      />,
    );
    expect(screen.getByText('Aceitar')).toBeTruthy();
    expect(screen.getByText('Recusar')).toBeTruthy();
    fireEvent.press(screen.getByText('Aceitar'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('durante "accepting" o toque em Aceitar não dispara de novo (botão travado)', () => {
    const onAccept = jest.fn();
    render(
      <ChallengeListCard
        name="Desafio do agachamento"
        dayProgress={{ day: 0, total: 21 }}
        status="active"
        statusLabel="Convite"
        participantStatus="invited"
        onPress={jest.fn()}
        onAccept={onAccept}
        onDecline={jest.fn()}
        accepting
      />,
    );
    fireEvent.press(screen.getByText('Aceitar'));
    expect(onAccept).not.toHaveBeenCalled();
  });
});
