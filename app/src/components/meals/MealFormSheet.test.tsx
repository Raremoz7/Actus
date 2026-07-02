jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealFormSheet } from './MealFormSheet';

describe('MealFormSheet', () => {
  it('mantém "Salvar" desabilitado sem descrição nem foto e confirma com descrição', () => {
    const onConfirm = jest.fn();
    render(
      <MealFormSheet visible initial={null} onClose={() => {}} onConfirm={onConfirm} />,
    );
    const salvar = screen.getByLabelText('Salvar refeição');
    expect(salvar.props.accessibilityState?.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Descrição'), 'Panqueca');
    fireEvent.press(salvar);
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Panqueca', photoUri: null }),
    );
  });
});
