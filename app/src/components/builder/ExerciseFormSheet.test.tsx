import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExerciseFormSheet, type ExerciseFormValue } from './ExerciseFormSheet';

function setup(overrides: Partial<React.ComponentProps<typeof ExerciseFormSheet>> = {}) {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(
    <ExerciseFormSheet
      visible
      initialValue={null}
      onClose={onClose}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onClose, onConfirm };
}

describe('ExerciseFormSheet', () => {
  it('confirma e devolve os dados digitados com os defaults', () => {
    const props = setup();
    fireEvent.changeText(screen.getByLabelText('Exercício'), 'Agachamento livre');
    fireEvent.press(screen.getByText('Adicionar'));

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    const value = props.onConfirm.mock.calls[0][0] as ExerciseFormValue;
    expect(value).toEqual({
      name: 'Agachamento livre',
      sets: 3,
      reps: 10,
      restSeconds: 60,
      notes: null,
      // Nenhum grupo muscular marcado → null (não inventar).
      muscleGroup: null,
    });
  });

  it('devolve os números editados', () => {
    const props = setup();
    fireEvent.changeText(screen.getByLabelText('Exercício'), 'Supino');
    fireEvent.changeText(screen.getByLabelText('Séries'), '5');
    fireEvent.changeText(screen.getByLabelText('Reps'), '8');
    fireEvent.changeText(screen.getByLabelText('Descanso (s)'), '90');
    fireEvent.press(screen.getByText('Adicionar'));

    const value = props.onConfirm.mock.calls[0][0] as ExerciseFormValue;
    expect(value.sets).toBe(5);
    expect(value.reps).toBe(8);
    expect(value.restSeconds).toBe(90);
  });

  it('captura o grupo muscular escolhido por chip', () => {
    const props = setup();
    fireEvent.changeText(screen.getByLabelText('Exercício'), 'Supino reto');
    fireEvent.press(screen.getByLabelText('Peito'));
    fireEvent.press(screen.getByText('Adicionar'));

    const value = props.onConfirm.mock.calls[0][0] as ExerciseFormValue;
    expect(value.muscleGroup).toBe('Peito');
  });

  it('não confirma e mostra erro quando o nome está vazio', () => {
    const props = setup();
    fireEvent.press(screen.getByText('Adicionar'));

    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o nome do exercício')).toBeTruthy();
  });

  it('pré-preenche os campos ao editar', () => {
    const props = setup({
      initialValue: {
        name: 'Remada curvada',
        sets: 4,
        reps: 12,
        restSeconds: 75,
        notes: 'Pegada pronada',
        muscleGroup: 'Costas',
      },
    });
    expect(screen.getByDisplayValue('Remada curvada')).toBeTruthy();
    expect(screen.getByDisplayValue('Pegada pronada')).toBeTruthy();

    fireEvent.press(screen.getByText('Salvar exercício'));
    const value = props.onConfirm.mock.calls[0][0] as ExerciseFormValue;
    expect(value.name).toBe('Remada curvada');
    expect(value.sets).toBe(4);
    expect(value.notes).toBe('Pegada pronada');
    // Grupo muscular pré-preenchido é preservado.
    expect(value.muscleGroup).toBe('Costas');
  });

  it('fecha ao tocar no X', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Fechar'));
    expect(props.onClose).toHaveBeenCalled();
  });
});
