import { render, screen, fireEvent } from '@testing-library/react-native';
import { OptionCard } from './OptionCard';

describe('OptionCard', () => {
  it('mostra o rótulo e dispara onPress', () => {
    const onPress = jest.fn();
    render(<OptionCard label="Hipertrofia" selected={false} onPress={onPress} />);
    fireEvent.press(screen.getByText('Hipertrofia'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expõe o estado selecionado por acessibilidade', () => {
    render(<OptionCard label="Casa" selected onPress={jest.fn()} />);
    expect(screen.getByLabelText('Casa').props.accessibilityState?.selected).toBe(true);
  });
});
