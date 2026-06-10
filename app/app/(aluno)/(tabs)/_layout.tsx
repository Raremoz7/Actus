import { HouseIcon, BarbellIcon, TrophyIcon, UserIcon, PlayIcon } from 'phosphor-react-native';
import { Tabs } from 'expo-router';

import { ActusTabBar, type TabSpec } from '@/components/navigation/ActusTabBar';

const ICON_SIZE = 24;

// Abas do aluno na ordem em que aparecem na barra.
const TABS: readonly TabSpec[] = [
  {
    name: 'index',
    label: 'HOJE',
    renderIcon: (color) => <HouseIcon size={ICON_SIZE} color={color} weight="duotone" />,
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

export default function AlunoTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <ActusTabBar
          {...props}
          tabs={TABS}
          center={{
            accessibilityLabel: 'Iniciar treino do dia',
            renderIcon: (color) => <PlayIcon size={28} color={color} weight="duotone" />,
            onPress: () => {
              // TODO Bloco 4: iniciar treino do dia
            },
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="treinos" />
      <Tabs.Screen name="desafios" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
