import { render, screen } from '@testing-library/react-native';

let mockTipo: string | undefined = 'personal';
jest.mock('@/hooks/useMe', () => ({ useMe: () => ({ data: { tipo: mockTipo } }) }));
// Substituímos os sub-dashboards por marcadores — aqui testamos só o switch por tipo.
jest.mock('./PersonalDashboard', () => {
  const { Text } = require('react-native');
  return { PersonalDashboard: () => <Text>PERSONAL_DASH</Text> };
});
jest.mock('./NutriDashboard', () => {
  const { Text } = require('react-native');
  return { NutriDashboard: () => <Text>NUTRI_DASH</Text> };
});

import { DashboardScreen } from './DashboardScreen';

describe('DashboardScreen', () => {
  it('renderiza o dashboard do personal quando tipo=personal', () => {
    mockTipo = 'personal';
    render(<DashboardScreen />);
    expect(screen.getByText('PERSONAL_DASH')).toBeTruthy();
  });

  it('renderiza o dashboard do nutri quando tipo=nutricionista', () => {
    mockTipo = 'nutricionista';
    render(<DashboardScreen />);
    expect(screen.getByText('NUTRI_DASH')).toBeTruthy();
  });

  it('não renderiza sub-dashboard enquanto o tipo é desconhecido', () => {
    mockTipo = undefined;
    render(<DashboardScreen />);
    expect(screen.queryByText('PERSONAL_DASH')).toBeNull();
    expect(screen.queryByText('NUTRI_DASH')).toBeNull();
  });
});
