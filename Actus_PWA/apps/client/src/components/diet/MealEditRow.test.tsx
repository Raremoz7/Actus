import { fireEvent, render, screen } from '@testing-library/react-native';

import { MealEditRow } from './MealEditRow';

function setup(overrides: Partial<React.ComponentProps<typeof MealEditRow>> = {}) {
  const props = {
    name: 'Café da manhã',
    kcal: 450,
    protein: 25,
    carbs: 50,
    fat: 12,
    position: 1,
    canMoveUp: true,
    canMoveDown: true,
    onEdit: jest.fn(),
    onRemove: jest.fn(),
    onMoveUp: jest.fn(),
    onMoveDown: jest.fn(),
    ...overrides,
  };
  render(<MealEditRow {...props} />);
  return props;
}

describe('MealEditRow', () => {
  it('mostra o nome e os chips de macros informados', () => {
    setup();
    expect(screen.getByText('Café da manhã')).toBeTruthy();
    expect(screen.getByText('450 kcal')).toBeTruthy();
    expect(screen.getByText('P 25g')).toBeTruthy();
    expect(screen.getByText('C 50g')).toBeTruthy();
    expect(screen.getByText('G 12g')).toBeTruthy();
  });

  it('omite chips de macros ausentes', () => {
    setup({ kcal: 300, protein: undefined, carbs: undefined, fat: undefined });
    expect(screen.getByText('300 kcal')).toBeTruthy();
    expect(screen.queryByText(/P /)).toBeNull();
    expect(screen.queryByText(/C /)).toBeNull();
    expect(screen.queryByText(/G /)).toBeNull();
  });

  it('dispara remover ao tocar no botão de remover', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Remover Café da manhã'));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it('dispara editar ao tocar no botão de editar', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Editar Café da manhã'));
    expect(props.onEdit).toHaveBeenCalledTimes(1);
  });

  it('reordena para cima e para baixo', () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText('Mover Café da manhã para cima'));
    fireEvent.press(screen.getByLabelText('Mover Café da manhã para baixo'));
    expect(props.onMoveUp).toHaveBeenCalledTimes(1);
    expect(props.onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('não dispara mover quando desabilitado', () => {
    const props = setup({ canMoveUp: false });
    fireEvent.press(screen.getByLabelText('Mover Café da manhã para cima'));
    expect(props.onMoveUp).not.toHaveBeenCalled();
  });
});
