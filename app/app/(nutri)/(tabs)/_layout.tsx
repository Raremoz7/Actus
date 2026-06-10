import { UsersIcon, ForkKnifeIcon, UserIcon } from 'phosphor-react-native';
import { Tabs } from 'expo-router';

import { ActusTabBar, type TabSpec } from '@/components/navigation/ActusTabBar';

const ICON_SIZE = 24;

// Abas do nutricionista — sem botão central.
const TABS: readonly TabSpec[] = [
  {
    name: 'alunos',
    label: 'ALUNOS',
    renderIcon: (color) => <UsersIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'dietas',
    label: 'DIETAS',
    renderIcon: (color) => <ForkKnifeIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'perfil',
    label: 'PERFIL',
    renderIcon: (color) => <UserIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
];

export default function NutriTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="alunos" />
      <Tabs.Screen name="dietas" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
