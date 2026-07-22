import { forwardRef, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { darkTheme } from '@/theme';
import { accessibleFieldLabel } from '@/lib/accessibleFieldLabel';
import { AppText } from './Text';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  // Pinta a borda de erro SEM renderizar linha de mensagem (a msg vive no banner do form).
  invalid?: boolean;
  // Habilita o botão de mostrar/ocultar senha (Eye/EyeSlash duotone).
  secureToggle?: boolean;
  // Anunciado só para leitor de tela (accessibleFieldLabel) — não muda o visual.
  required?: boolean;
};

const { motion, colors } = darkTheme;

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, invalid = false, secureToggle = false, required = false, onFocus, onBlur, style, ...rest },
  ref,
) {
  // Estado de senha oculta (só relevante quando secureToggle).
  const [hidden, setHidden] = useState(secureToggle);

  // Progresso de foco (0 → 1) para a transição da borda em 150ms.
  const focusProgress = useSharedValue(0);

  // Mensagem só quando há texto real; `invalid` pinta a borda sem ocupar linha.
  const errorText = error && error.trim().length > 0 ? error : null;
  const hasError = errorText != null || invalid;

  // Anúncio ativo pro leitor de tela: accessibilityLiveRegion do bloco abaixo só
  // funciona no Android, então anunciamos explicitamente também pra cobrir iOS.
  useEffect(() => {
    if (errorText) AccessibilityInfo.announceForAccessibility(errorText);
  }, [errorText]);

  const borderStyle = useAnimatedStyle(() => {
    // Erro tem prioridade sobre o estado de foco.
    if (hasError) {
      return { borderColor: colors.error };
    }
    return {
      borderColor: interpolateColor(
        focusProgress.value,
        [0, 1],
        [colors.outlineVariant, colors.neon],
      ),
    };
  });

  function handleFocus(e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
    focusProgress.value = withTiming(1, { duration: motion.microMs });
    onFocus?.(e);
  }

  function handleBlur(e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) {
    focusProgress.value = withTiming(0, { duration: motion.microMs });
    onBlur?.(e);
  }

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="eyebrow" color="tertiary" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <Animated.View style={[styles.field, borderStyle]}>
        <TextInput
          ref={ref}
          accessibilityLabel={accessibleFieldLabel(label, errorText, required)}
          aria-invalid={hasError || undefined}
          style={[styles.input, style]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureToggle ? hidden : rest.secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={12}
            onPress={() => setHidden((v) => !v)}
            style={styles.toggle}
          >
            {hidden ? (
              <EyeSlash size={20} weight="duotone" color={colors.textTertiary} />
            ) : (
              <Eye size={20} weight="duotone" color={colors.textTertiary} />
            )}
          </Pressable>
        ) : null}
      </Animated.View>

      {errorText ? (
        <View accessibilityLiveRegion="polite">
          <AppText variant="bodySm" color="error" style={styles.error}>
            {errorText}
          </AppText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.spacing.xs,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.typeScale.bodyMd,
    color: theme.colors.textPrimary,
  },
  toggle: {
    paddingLeft: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: theme.spacing.xs,
  },
}));
