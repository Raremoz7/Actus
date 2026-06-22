import { render, screen, fireEvent } from '@testing-library/react-native';

import { BadgeUnlockOverlay } from './BadgeUnlockOverlay';

describe('BadgeUnlockOverlay', () => {
  it('mostra o nome do badge e chama onContinue', () => {
    const onContinue = jest.fn();
    render(
      <BadgeUnlockOverlay
        badge={{ id: 'first_step', name: 'Primeiro Passo', description: '', asset_key: 'a' }}
        onContinue={onContinue}
      />,
    );
    expect(screen.getByText(/Você conquistou/i)).toBeTruthy();
    expect(screen.getByText('Primeiro Passo')).toBeTruthy();
    fireEvent.press(screen.getByText('Continuar'));
    expect(onContinue).toHaveBeenCalled();
  });
});
