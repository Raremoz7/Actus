// Criar convite (rota '/convite/novo'). Duas vistas numa só tela (estado local):
//  1) CONFIGURAR (Direção C): chips de validade (7 / 14 / 30 dias) + limite de
//     usos (1 / 5 / 10) → "Gerar convite" chama POST /invites com expires_at
//     calculado como (agora + N dias) em ISO 8601 completo (relógio do device).
//  2) COMPARTILHAR (Direção A): no sucesso, mostra o código grande + chips de
//     validade/usos + compartilhar (Share) + copiar link (clipboard) + "Concluir"
//     que volta para a lista (/convite).

import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import * as Clipboard from 'expo-clipboard';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Tag } from '@/components/ui';
import { useInviteActions } from '@/hooks/useInviteActions';
import { inviteDeepLink, inviteShareMessage, isoInDays } from '@/lib/invite';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Opções de configuração (validade em dias / limite de usos).
const EXPIRY_OPTIONS = [7, 14, 30] as const;
const USES_OPTIONS = [1, 5, 10] as const;

type ExpiryDays = (typeof EXPIRY_OPTIONS)[number];
type MaxUses = (typeof USES_OPTIONS)[number];

function expiryLabel(days: number): string {
  return `${days} dias`;
}

function usesLabel(uses: number): string {
  return uses === 1 ? '1 uso' : `${uses} usos`;
}

// Chip selecionável (validade / usos). Estilo distinto quando ativo.
function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  styles.useVariants({ selected });
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.chip}
    >
      <AppText variant="label" color={selected ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function NovoConviteScreen() {
  const { create } = useInviteActions();

  const [expiryDays, setExpiryDays] = useState<ExpiryDays>(7);
  const [maxUses, setMaxUses] = useState<MaxUses>(1);
  // Vista de compartilhar: setada no sucesso do create (guarda o code gerado).
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  function handleGenerate() {
    create.mutate(
      { expiresAt: isoInDays(expiryDays), maxUses },
      {
        onSuccess: (invite) => setCreatedCode(invite.code),
        onError: () => {
          Alert.alert(
            'Não foi possível gerar',
            'Tente novamente em instantes.',
          );
        },
      },
    );
  }

  async function handleShare(code: string) {
    try {
      await Share.share({ message: inviteShareMessage(code) });
    } catch {
      // Compartilhamento cancelado/indisponível — silencioso.
    }
  }

  async function handleCopy(code: string) {
    await Clipboard.setStringAsync(inviteDeepLink(code));
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/convite');
    }
  }

  const isShareView = createdCode !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={handleBack}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="tertiary">
            {isShareView ? 'Convite gerado' : 'Novo convite'}
          </AppText>
          <AppText variant="h2">{isShareView ? 'Pronto' : 'Criar'}</AppText>
        </View>
      </View>

      <View style={styles.flex}>
        <Animated.View style={[styles.flex, revealStyle]}>
          {isShareView ? (
            // --- Vista COMPARTILHAR (Direção A) ---
            <View style={styles.body}>
              <AppText variant="bodySm" color="tertiary" style={styles.intro}>
                Compartilhe o código abaixo. Ele abre o cadastro já vinculado a
                você.
              </AppText>

              <View style={styles.codeCard}>
                <AppText variant="eyebrow" color="tertiary">
                  Código
                </AppText>
                <AppText variant="dataBig" color="neon" style={styles.code}>
                  {createdCode}
                </AppText>
                <View style={styles.tags}>
                  <Tag label={expiryLabel(expiryDays)} tone="neutral" />
                  <Tag label={usesLabel(maxUses)} tone="neutral" />
                </View>
              </View>

              <View style={styles.actions}>
                <Button
                  variant="primary"
                  label="Compartilhar convite"
                  onPress={() => void handleShare(createdCode)}
                />
                <Button
                  variant="secondary"
                  label="Copiar link"
                  onPress={() => void handleCopy(createdCode)}
                />
                <Button
                  variant="ghost"
                  label="Concluir"
                  onPress={() => router.replace('/convite')}
                />
              </View>
            </View>
          ) : (
            // --- Vista CONFIGURAR (Direção C) ---
            <View style={styles.body}>
              <View style={styles.group}>
                <AppText variant="eyebrow" color="tertiary">
                  Validade
                </AppText>
                <View style={styles.row}>
                  {EXPIRY_OPTIONS.map((d) => (
                    <Chip
                      key={d}
                      label={expiryLabel(d)}
                      selected={expiryDays === d}
                      onPress={() => setExpiryDays(d)}
                      accessibilityLabel={`Validade de ${d} dias`}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.group}>
                <AppText variant="eyebrow" color="tertiary">
                  Limite de usos
                </AppText>
                <View style={styles.row}>
                  {USES_OPTIONS.map((u) => (
                    <Chip
                      key={u}
                      label={usesLabel(u)}
                      selected={maxUses === u}
                      onPress={() => setMaxUses(u)}
                      accessibilityLabel={`Limite de ${u} ${u === 1 ? 'uso' : 'usos'}`}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.footer}>
                <Button
                  variant="primary"
                  label="Gerar convite"
                  loading={create.isPending}
                  onPress={handleGenerate}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  intro: {
    marginBottom: theme.spacing.xl,
  },
  group: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    variants: {
      selected: {
        true: {
          backgroundColor: theme.colors.neon,
          borderColor: theme.colors.neon,
        },
        false: {
          backgroundColor: 'transparent',
          borderColor: theme.colors.outline,
        },
      },
    },
  },
  codeCard: {
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  code: {
    letterSpacing: 3,
  },
  tags: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  actions: {
    gap: theme.spacing.md,
  },
  footer: {
    marginTop: 'auto',
  },
}));
