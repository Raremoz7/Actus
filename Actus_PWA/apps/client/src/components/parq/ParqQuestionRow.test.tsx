import { render, screen, fireEvent } from '@testing-library/react-native';
import { ParqQuestionRow } from './ParqQuestionRow';

describe('ParqQuestionRow', () => {
  it('mostra o texto da pergunta', () => {
    render(<ParqQuestionRow text="Sente dor no peito?" value={null} onChange={jest.fn()} />);
    expect(screen.getByText('Sente dor no peito?')).toBeTruthy();
  });

  it('chama onChange(true) ao tocar em Sim', () => {
    const onChange = jest.fn();
    render(<ParqQuestionRow text="P" value={null} onChange={onChange} />);
    fireEvent.press(screen.getByText('Sim'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('chama onChange(false) ao tocar em Não', () => {
    const onChange = jest.fn();
    render(<ParqQuestionRow text="P" value={null} onChange={onChange} />);
    fireEvent.press(screen.getByText('Não'));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
