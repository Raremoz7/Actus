import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChallengeListCard } from './ChallengeListCard';

describe('ChallengeListCard', () => {
  it('mostra nome e "dia X de Y" quando participante ativo', () => {
    render(
      <ChallengeListCard
        name="Junho no shape"
        dayProgress={{ day: 12, total: 30 }}
        status="active"
        participantStatus="active"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Junho no shape')).toBeTruthy();
    expect(screen.getByText('dia 12 de 30')).toBeTruthy();
  });

  it('quando convidado mostra "Aceitar" e "Recusar" e dispara onAccept', () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();
    render(
      <ChallengeListCard
        name="Desafio do agachamento"
        dayProgress={{ day: 0, total: 21 }}
        status="active"
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
});
