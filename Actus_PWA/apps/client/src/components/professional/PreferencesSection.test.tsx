import { render, screen } from '@testing-library/react-native';

import { PreferencesSection } from './PreferencesSection';
import { useStudentOnboardingMock } from '@/mocks/studentOnboarding';

jest.mock('@/lib/secureStorage', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

describe('PreferencesSection', () => {
  it('não renderiza nada sem respostas', () => {
    useStudentOnboardingMock.setState({ byStudent: {}, hydrated: true });
    const { toJSON } = render(<PreferencesSection studentId="x" />);
    expect(toJSON()).toBeNull();
  });

  it('lista as respostas do aluno', () => {
    useStudentOnboardingMock.setState({
      byStudent: {
        'aluno-1': { interesse: 'hipertrofia', dias_semana: '3', local: 'casa' },
      },
      hydrated: true,
    });
    render(<PreferencesSection studentId="aluno-1" />);
    expect(screen.getByText('Hipertrofia')).toBeTruthy();
    expect(screen.getByText(/3/)).toBeTruthy();
    expect(screen.getByText('Casa')).toBeTruthy();
  });
});
