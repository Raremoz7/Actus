import { render, screen, fireEvent } from '@testing-library/react-native';
import { ObjetivoChips } from './ObjetivoChips';

describe('ObjetivoChips', () => {
  it('mostra "Todos" + objetivos e dispara onChange com o objetivo', () => {
    const onChange = jest.fn();
    render(<ObjetivoChips selected={null} onChange={onChange} />);
    expect(screen.getByText('Todos')).toBeTruthy();
    fireEvent.press(screen.getByText('Hipertrofia'));
    expect(onChange).toHaveBeenCalledWith('hipertrofia');
  });

  it('volta para null ao tocar em "Todos"', () => {
    const onChange = jest.fn();
    render(<ObjetivoChips selected="forca" onChange={onChange} />);
    fireEvent.press(screen.getByText('Todos'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
