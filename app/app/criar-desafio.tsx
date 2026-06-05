// Form de criação de desafio (rota '/criar-desafio'). Cria sempre como rascunho
// ('draft'); publicar/encerrar é via PATCH no detalhe. No sucesso, vai direto
// para o detalhe (/desafio-pro/:id) para adicionar participantes.
//
// Datas data-only LOCAIS: DateField devolve "YYYY-MM-DD" via formatDateLocal
// (nunca toISOString). `maximumDate={null}` libera datas futuras (período do
// desafio); o fim tem `minimumDate` = início escolhido.

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import { DateField } from '@/components/molecules';
import { useChallengeMutations } from '@/hooks/useChallengeMutations';
import type { CreateChallengeBody } from '@/types/challenges';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

type Visibility = CreateChallengeBody['visibility'];

// Opções de visibilidade (2 chips). public_among_participants = ranking visível
// entre participantes; private_ranking = ranking privado (só o profissional).
const VISIBILITY_OPTIONS: readonly { label: string; value: Visibility }[] = [
  { label: 'Ranking público', value: 'public_among_participants' },
  { label: 'Ranking privado', value: 'private_ranking' },
];

// "YYYY-MM-DD" → Date LOCAL (evita o parse UTC implícito de new Date(iso)).
function parseLocalDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export default function CriarDesafioScreen() {
  const { create } = useChallengeMutations();

  const [name, setName] = useState('');
  const [startsOn, setStartsOn] = useState<string | null>(null);
  const [endsOn, setEndsOn] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>(
    'public_among_participants',
  );

  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [startError, setStartError] = useState<string | undefined>(undefined);
  const [endError, setEndError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  // Fim nunca antes do início: trava o picker do fim no início escolhido.
  const endMinimum = useMemo(
    () => parseLocalDate(startsOn) ?? undefined,
    [startsOn],
  );

  const saving = create.isPending;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(personal)/(tabs)/desafios');
    }
  }

  function handleCreate() {
    const trimmedName = name.trim();
    let valid = true;

    if (trimmedName.length === 0) {
      setNameError('Dê um nome ao desafio');
      valid = false;
    } else {
      setNameError(undefined);
    }

    if (!startsOn) {
      setStartError('Escolha a data de início');
      valid = false;
    } else {
      setStartError(undefined);
    }

    if (!endsOn) {
      setEndError('Escolha a data de fim');
      valid = false;
    } else if (startsOn && endsOn < startsOn) {
      // Comparação de strings "YYYY-MM-DD" é segura (ordem lexicográfica = cronológica).
      setEndError('O fim deve ser igual ou depois do início');
      valid = false;
    } else {
      setEndError(undefined);
    }

    if (!valid || !startsOn || !endsOn) return;

    setSubmitError(undefined);
    create.mutate(
      {
        name: trimmedName,
        starts_on: startsOn,
        ends_on: endsOn,
        visibility,
      },
      {
        onSuccess: (created) => {
          router.replace(('/desafio-pro/' + created.id) as Href);
        },
        onError: () => {
          setSubmitError('Não foi possível criar agora. Tente novamente.');
        },
      },
    );
  }

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
            Novo desafio
          </AppText>
          <AppText variant="h2">Criar desafio</AppText>
        </View>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Input
              label="Nome do desafio"
              accessibilityLabel="Nome do desafio"
              placeholder="Ex.: Janeiro sem falta"
              value={name}
              onChangeText={(t) => {
                if (nameError) setNameError(undefined);
                setName(t);
              }}
              autoCapitalize="sentences"
              error={nameError}
            />

            <View style={styles.dates}>
              <View style={styles.dateCol}>
                <DateField
                  label="Início"
                  value={startsOn}
                  onChange={(v) => {
                    if (startError) setStartError(undefined);
                    setStartsOn(v);
                    // Se o fim ficou antes do novo início, limpa para reescolher.
                    if (endsOn && v > endsOn) {
                      setEndsOn(null);
                    }
                  }}
                  maximumDate={null}
                  error={startError}
                />
              </View>
              <View style={styles.dateCol}>
                <DateField
                  label="Fim"
                  value={endsOn}
                  onChange={(v) => {
                    if (endError) setEndError(undefined);
                    setEndsOn(v);
                  }}
                  minimumDate={endMinimum}
                  maximumDate={null}
                  error={endError}
                />
              </View>
            </View>

            <View style={styles.visibility}>
              <AppText variant="eyebrow" color="tertiary">
                Visibilidade
              </AppText>
              <View style={styles.chips}>
                {VISIBILITY_OPTIONS.map((option) => {
                  const active = visibility === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={option.label}
                      hitSlop={6}
                      onPress={() => setVisibility(option.value)}
                      style={[styles.chip, active ? styles.chipActive : null]}
                    >
                      <AppText
                        variant="bodySm"
                        color={active ? 'inverse' : 'secondary'}
                      >
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {submitError ? (
              <AppText variant="bodySm" color="error">
                {submitError}
              </AppText>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          label="Criar desafio"
          loading={saving}
          onPress={handleCreate}
        />
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
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.lg,
  },
  dates: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateCol: {
    flex: 1,
  },
  visibility: {
    gap: theme.spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  chipActive: {
    backgroundColor: theme.colors.neon,
    borderColor: theme.colors.neon,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
}));
