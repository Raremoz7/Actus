// Passo de foto (aluno e professor). "Adicionar foto" fica pendente:
// [pendente: expo-image-picker (rebuild do dev client) + endpoint de upload]
// — o passo existe e é pulável, fiel à história.
import { View } from 'react-native';
import { UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { OnboardingScreen } from './OnboardingScreen';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  step: number;
  total: number;
  subtitle: string;
  onAdvance: () => void;
};

export function FotoStep({ step, total, subtitle, onAdvance }: Props) {
  return (
    <OnboardingScreen
      step={step}
      total={total}
      title="Adicione uma foto de perfil"
      subtitle={subtitle}
      ctaLabel="Adicionar foto"
      ctaDisabled
      onCta={() => undefined}
      skipLabel="Pular por enquanto"
      onSkip={onAdvance}
    >
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <UserCircle size={64} weight="duotone" color={colors.textTertiary} />
        </View>
        <AppText variant="metaSmall" color="tertiary">
          Disponível em breve neste build.
        </AppText>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatarWrap: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
