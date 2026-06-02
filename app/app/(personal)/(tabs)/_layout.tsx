import { UsersIcon, BarbellIcon, TrophyIcon, UserIcon } from 'phosphor-react-native';
import { Tabs } from 'expo-router';

import { ActusTabBar, type TabSpec } from '@/components/navigation/ActusTabBar';

const ICON_SIZE = 24;

// Abas do personal — sem botão central.
const TABS: readonly TabSpec[] = [
  {
    name: 'alunos',
    label: 'ALUNOS',
    renderIcon: (color) => <UsersIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'treinos',
    label: 'TREINOS',
    renderIcon: (color) => <BarbellIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'desafios',
    label: 'DESAFIOS',
    renderIcon: (color) => <TrophyIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'perfil',
    label: 'PERFIL',
    renderIcon: (color) => <UserIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
];

export default function PersonalTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="alunos" />
      <Tabs.Screen name="treinos" />
      <Tabs.Screen name="desafios" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
