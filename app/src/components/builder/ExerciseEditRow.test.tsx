import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExerciseEditRow } from './ExerciseEditRow';

function setup(overrides: Partial<React.ComponentProps<typeof ExerciseEditRow>> = {}) {
  const props = {
    name: 'Supino reto',
    sets: 4,
    reps: 10,
    restSeconds: 60,
    position: 1,
    canMoveUp: true,
    canMoveDown: true,
    onEdit: jest.fn(),
    onRemove: jest.fn(),
    onMoveUp: jest.fn(),
    onMoveDown: jest.fn(),
    ...overrides,
  };
  render(<ExerciseEditRow {...props} />);
  return props;
}

describe('ExerciseEditRow', () => {
  it('mostra nome e chips Sx Rr · Ds', () => {
    setup();
    expect(screen.getByText('Supino reto')).toBeTruthy();
    expect(screen.getByText('4×10')).toBeTruthy();
    expect(screen.getByText('60s')).toBeTruthy();
  });

  it('dispara remover ao tocar no botão de remover', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Remover Supino reto'));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it('dispara editar ao tocar no botão de editar', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Editar Supino reto'));
    expect(props.onEdit).toHaveBeenCalledTimes(1);
  });

  it('reordena para cima e para baixo', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Mover Supino reto para cima'));
    fireEvent.press(screen.getByLabelText('Mover Supino reto para baixo'));
    expect(props.onMoveUp).toHaveBeenCalledTimes(1);
    expect(props.onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('não dispara mover quando desabilitado', () => {
    const props = setup({ canMoveUp: false });
    fireEvent.press(screen.getByLabelText('Mover Supino reto para cima'));
    expect(props.onMoveUp).not.toHaveBeenCalled();
  });
});
