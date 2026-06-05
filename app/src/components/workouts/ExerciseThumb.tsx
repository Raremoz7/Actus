// [MOCK — sem endpoint na API v1: imagem do exercício virá do Wger pelo wger_exercise_id]
import { View } from 'react-native';
import { Barbell } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  size?: number;
  testID?: string;
};

export function ExerciseThumb({ size = 60, testID }: Props) {
  return (
    <View testID={testID} style={[styles.thumb, { width: size, height: size }]}>
      <Barbell size={Math.round(size * 0.42)} weight="duotone" color={colors.secondary} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  thumb: {
    borderRadius: 8,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
