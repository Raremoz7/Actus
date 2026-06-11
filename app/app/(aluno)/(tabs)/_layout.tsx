import { HouseIcon, BarbellIcon, TrophyIcon, UserIcon } from 'phosphor-react-native';
import { Tabs } from 'expo-router';

import { ActusTabBar, type TabSpec } from '@/components/navigation/ActusTabBar';

// Abas do aluno na ordem em que aparecem na barra.
const TABS: readonly TabSpec[] = [
  {
    name: 'index',
    label: 'HOJE',
    renderIcon: (color, size) => <HouseIcon size={size} color={color} weight="duotone" />,
  },
  {
    name: 'treinos',
    label: 'TREINOS',
    renderIcon: (color, size) => <BarbellIcon size={size} color={color} weight="duotone" />,
  },
  {
    name: 'desafios',
    label: 'DESAFIOS',
    renderIcon: (color, size) => <TrophyIcon size={size} color={color} weight="duotone" />,
  },
  {
    name: 'perfil',
    label: 'PERFIL',
    renderIcon: (color, size) => <UserIcon size={size} color={color} weight="duotone" />,
  },
];

export default function AlunoTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="treinos" />
      <Tabs.Screen name="desafios" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
