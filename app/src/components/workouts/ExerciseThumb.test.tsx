import { render } from '@testing-library/react-native';
import { Image } from 'react-native';
import { ExerciseThumb } from './ExerciseThumb';

jest.mock('@/lib/wger/media', () => ({ wgerImageSource: (id: number | null) => (id === 101 ? { uri: 'wger-101' } : null) }));

describe('ExerciseThumb', () => {
  it('usa a imagem do Wger quando o id tem imagem', () => {
    const { UNSAFE_getAllByType } = render(<ExerciseThumb wgerExerciseId={101} muscleGroup="Peito" testID="t" />);
    const images = UNSAFE_getAllByType(Image);
    expect(images.some((img) => (img.props.source as { uri: string })?.uri === 'wger-101')).toBe(true);
  });
  it('cai no placeholder por grupo quando não há imagem Wger', () => {
    const { getByTestId } = render(<ExerciseThumb wgerExerciseId={999} muscleGroup="Peito" testID="t" />);
    expect(getByTestId('t')).toBeTruthy();
  });
});
