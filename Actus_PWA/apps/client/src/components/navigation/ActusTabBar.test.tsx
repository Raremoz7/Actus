import { render, screen, fireEvent } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from '@/lib/haptics';
import { HouseIcon } from 'phosphor-react-native';
import { ActusTabBar, type TabSpec } from './ActusTabBar';

const TABS: readonly TabSpec[] = [
  { name: 'index', label: 'HOJE', renderIcon: (c) => <HouseIcon color={c} /> },
  { name: 'treinos', label: 'TREINOS', renderIcon: (c) => <HouseIcon color={c} /> },
];

function makeProps(index: number) {
  const routes = TABS.map((t, i) => ({ key: `${t.name}-${i}`, name: t.name }));
  return {
    state: { index, routes, key: 'tab', routeNames: TABS.map((t) => t.name) },
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };
}

describe('ActusTabBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza os labels de todas as abas', () => {
    render(<ActusTabBar {...(makeProps(0) as unknown as BottomTabBarProps)} tabs={TABS} />);
    expect(screen.getByText('HOJE')).toBeTruthy();
    expect(screen.getByText('TREINOS')).toBeTruthy();
  });

  it('toque em aba não-ativa navega e dispara haptic', () => {
    const props = makeProps(0);
    render(<ActusTabBar {...(props as unknown as BottomTabBarProps)} tabs={TABS} />);
    fireEvent.press(screen.getByLabelText('TREINOS'));
    expect(props.navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', canPreventDefault: true }),
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith('treinos');
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  it('toque na aba ativa não navega', () => {
    const props = makeProps(0);
    render(<ActusTabBar {...(props as unknown as BottomTabBarProps)} tabs={TABS} />);
    fireEvent.press(screen.getByLabelText('HOJE'));
    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
