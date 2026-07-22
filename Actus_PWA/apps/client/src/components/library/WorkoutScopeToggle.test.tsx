import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkoutScopeToggle } from './WorkoutScopeToggle';

describe('WorkoutScopeToggle', () => {
  it('dispara onChange("banco") ao tocar em Banco', () => {
    const onChange = jest.fn();
    render(<WorkoutScopeToggle value="meus" onChange={onChange} />);
    fireEvent.press(screen.getByText('Banco'));
    expect(onChange).toHaveBeenCalledWith('banco');
  });

  it('dispara onChange("meus") ao tocar em Meus', () => {
    const onChange = jest.fn();
    render(<WorkoutScopeToggle value="banco" onChange={onChange} />);
    fireEvent.press(screen.getByText('Meus'));
    expect(onChange).toHaveBeenCalledWith('meus');
  });
});
