import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuickAction } from './QuickAction';

describe('QuickAction', () => {
  it('mostra o label e dispara onPress', () => {
    const onPress = jest.fn();
    render(<QuickAction icon={<Text>i</Text>} label="Convidar aluno" onPress={onPress} />);
    fireEvent.press(screen.getByText('Convidar aluno'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
