import { fireEvent, render, screen } from '@testing-library/react-native';

import { MealFormSheet, type MealFormValue } from './MealFormSheet';

function setup(overrides: Partial<React.ComponentProps<typeof MealFormSheet>> = {}) {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(
    <MealFormSheet
      visible
      initialValue={null}
      onClose={onClose}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onClose, onConfirm };
}

describe('MealFormSheet', () => {
  it('confirma e devolve só o nome quando macros ficam vazios', () => {
    const props = setup();
    fireEvent.changeText(screen.getByLabelText('Refeição'), 'Café da manhã');
    fireEvent.press(screen.getByText('Adicionar'));

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    const value = props.onConfirm.mock.calls[0][0] as MealFormValue;
    // Macros opcionais ausentes (não inventar zeros).
    expect(value).toEqual({ name: 'Café da manhã' });
  });

  it('devolve alimentos e macros preenchidos', () => {
    const props = setup();
    fireEvent.changeText(screen.getByLabelText('Refeição'), 'Almoço');
    fireEvent.changeText(screen.getByLabelText('Alimentos'), 'Arroz, frango, salada');
    fireEvent.changeText(screen.getByLabelText('Kcal'), '650');
    fireEvent.changeText(screen.getByLabelText('Proteína (g)'), '45');
    fireEvent.changeText(screen.getByLabelText('Carbo (g)'), '60');
    fireEvent.changeText(screen.getByLabelText('Gordura (g)'), '15');
    fireEvent.press(screen.getByText('Adicionar'));

    const value = props.onConfirm.mock.calls[0][0] as MealFormValue;
    expect(value).toEqual({
      name: 'Almoço',
      foods: 'Arroz, frango, salada',
      kcal: 650,
      protein: 45,
      carbs: 60,
      fat: 15,
    });
  });

  it('não confirma e mostra erro quando o nome está vazio', () => {
    const props = setup();
    fireEvent.press(screen.getByText('Adicionar'));

    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Informe o nome da refeição')).toBeTruthy();
  });

  it('pré-preenche os campos ao editar', () => {
    const props = setup({
      initialValue: {
        name: 'Jantar',
        foods: 'Omelete',
        kcal: 400,
        protein: 30,
      },
    });
    expect(screen.getByDisplayValue('Jantar')).toBeTruthy();
    expect(screen.getByDisplayValue('Omelete')).toBeTruthy();
    expect(screen.getByDisplayValue('400')).toBeTruthy();

    fireEvent.press(screen.getByText('Salvar refeição'));
    const value = props.onConfirm.mock.calls[0][0] as MealFormValue;
    expect(value.name).toBe('Jantar');
    expect(value.kcal).toBe(400);
    expect(value.protein).toBe(30);
    // carbs/fat não foram informados → ausentes.
    expect(value.carbs).toBeUndefined();
    expect(value.fat).toBeUndefined();
  });

  it('fecha ao tocar no X', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Fechar'));
    expect(props.onClose).toHaveBeenCalled();
  });
});
