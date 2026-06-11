import { HouseIcon, UsersIcon, ForkKnifeIcon, UserIcon } from 'phosphor-react-native';
import { Tabs } from 'expo-router';

import { ActusTabBar, type TabSpec } from '@/components/navigation/ActusTabBar';

// Abas do nutricionista — sem botão central.
const TABS: readonly TabSpec[] = [
  {
    name: 'inicio',
    label: 'INÍCIO',
    renderIcon: (color, size) => <HouseIcon size={size} color={color} weight="duotone" />,
  },
  {
    name: 'alunos',
    label: 'ALUNOS',
    renderIcon: (color, size) => <UsersIcon size={size} color={color} weight="duotone" />,
  },
  {
    name: 'dietas',
    label: 'DIETAS',
    renderIcon: (color, size) => <ForkKnifeIcon size={size} color={color} weight="duotone" />,
  },
  {
    name: 'perfil',
    label: 'PERFIL',
    renderIcon: (color, size) => <UserIcon size={size} color={color} weight="duotone" />,
  },
];

export default function NutriTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="alunos" />
      <Tabs.Screen name="dietas" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
