import { render, screen, fireEvent } from '@testing-library/react-native';
import { ParqPromptCard } from './ParqPromptCard';

describe('ParqPromptCard', () => {
  it('mostra CTA quando pendente e dispara onPress', () => {
    const onPress = jest.fn();
    render(<ParqPromptCard status="not_started" onPress={onPress} />);
    fireEvent.press(screen.getByText('Responder Par-Q'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('mostra estado "em dia" com a validade quando clear', () => {
    render(<ParqPromptCard status="clear" validUntil="2027-06-09" onPress={jest.fn()} />);
    expect(screen.getByText(/em dia/i)).toBeTruthy();
  });
});
