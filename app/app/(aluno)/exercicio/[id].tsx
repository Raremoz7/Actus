import { useEffect } from 'react';
import { Image, Linking, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { CaretLeft, CaretRight, FilmSlate, Note as NoteIcon, Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { useWorkoutDetail } from '@/hooks/useWorkoutDetail';
import { goBackOr } from '@/lib/nav';
import { exerciseImageUrl } from '@/lib/exerciseImage';
import { wgerCatalog, exerciseDescription } from '@/lib/wger/catalog';
import { wgerImageSource, wgerVideoUrl } from '@/lib/wger/media';
import { darkTheme } from '@/theme';

const { motion, colors, gradients, heroScrimLocations } = darkTheme;

function parseIntOr(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function ExercicioDemoScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    workoutId?: string;
    position?: string;
    name?: string;
    muscle?: string;
    equipment?: string;
    sets?: string;
    reps?: string;
    rest?: string;
    note?: string;
    wgerId?: string;
  }>();
  const name = typeof params.name === 'string' ? params.name : '';
  const muscle = typeof params.muscle === 'string' ? params.muscle : '';
  const equipment = typeof params.equipment === 'string' ? params.equipment : '';
  const note = typeof params.note === 'string' ? params.note : '';
  const workoutId = typeof params.workoutId === 'string' ? params.workoutId : '';
  const position = typeof params.position === 'string' ? Number(params.position) : NaN;

  const sets = parseIntOr(params.sets, 0);
  const reps = parseIntOr(params.reps, 0);
  const rest = Number(params.rest);
  const hasRest = Number.isFinite(rest) && rest >= 0;
  const hasPrescription = sets > 0 && reps > 0;

  // Dados reais do Wger: imagem local, descrição e URL de vídeo.
  const wgerId = Number(params.wgerId);
  const ex = Number.isFinite(wgerId) && wgerId > 0 ? wgerCatalog().getExercise(wgerId) : null;
  const heroSource = wgerImageSource(wgerId) ?? { uri: exerciseImageUrl(muscle, 1200) };
  const description = ex ? exerciseDescription(ex) : null;
  const videoUrl = wgerVideoUrl(wgerId);

  // Reaproveita o cache do detalhe do treino p/ navegar entre exercícios irmãos.
  const detail = useWorkoutDetail(workoutId);
  const exercises = detail.data?.workout.exercises ?? [];
  const idx = Number.isFinite(position)
    ? exercises.findIndex((e) => e.position === position)
    : -1;
  const prev = idx > 0 ? exercises[idx - 1] : null;
  const next = idx >= 0 && idx < exercises.length - 1 ? exercises[idx + 1] : null;

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Hero cinematográfico: ~42% da tela, com piso/teto p/ não exagerar em telas
  // muito baixas/altas. O título e o eyebrow ficam ancorados na base, sobre o scrim.
  const heroHeight = Math.min(Math.max(height * 0.42, 300), 440);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity, params.id]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const title = name || 'Exercício';
  // Grupo muscular + equipamento viram um eyebrow único sobre a foto (sem repetir o nome).
  const heroMeta = [muscle, equipment].filter(Boolean).join(' · ');

  function goTo(sibling: NonNullable<typeof next>) {
    router.replace({
      pathname: '/(aluno)/exercicio/[id]',
      params: {
        id: sibling.id,
        workoutId,
        position: String(sibling.position),
        name: sibling.name_snapshot,
        muscle: sibling.muscle_group ?? '',
        sets: String(sibling.sets),
        reps: String(sibling.reps),
        rest: String(sibling.rest_seconds),
        note: sibling.notes ?? '',
        wgerId: String(sibling.wger_exercise_id),
      },
    } as Href);
  }

  return (
    <View style={styles.safe}>
      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero cinematográfico full-bleed (sob a status bar). */}
          <View style={[styles.hero, { height: heroHeight }]}>
            <Image
              accessible={false}
              source={heroSource}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
            {/* Scrim de baixo p/ cima — garante leitura do título sobre qualquer foto. */}
            <LinearGradient
              pointerEvents="none"
              colors={gradients.heroScrim}
              locations={heroScrimLocations}
              style={StyleSheet.absoluteFill}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={12}
              onPress={() => goBackOr('/(aluno)/(tabs)/treinos')}
              style={[styles.back, { top: insets.top + darkTheme.spacing.sm }]}
            >
              <CaretLeft size={20} weight="bold" color={colors.textPrimary} />
            </Pressable>

            <View style={styles.heroText}>
              {heroMeta ? (
                <AppText variant="eyebrow" color="neon" numberOfLines={1} style={styles.heroEyebrow}>
                  {heroMeta}
                </AppText>
              ) : null}
              <AppText variant="h1" numberOfLines={2}>
                {title}
              </AppText>
            </View>
          </View>

          <View style={styles.body}>
            {/* Prescrição factual em mono — o conteúdo de maior valor da tela. */}
            {hasPrescription || hasRest ? (
              <View style={styles.prescription}>
                {hasPrescription ? (
                  <View style={styles.presMain}>
                    <AppText variant="eyebrow" color="tertiary">
                      Séries × reps
                    </AppText>
                    <AppText variant="dataBig">
                      {`${sets}×${reps}`}
                    </AppText>
                  </View>
                ) : null}
                {hasPrescription && hasRest ? <View style={styles.presDivider} /> : null}
                {hasRest ? (
                  <View style={styles.presSide}>
                    <AppText variant="eyebrow" color="tertiary">
                      Descanso
                    </AppText>
                    <AppText variant="dataBig">
                      {`${rest}s`}
                    </AppText>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Nota do personal para este exercício. */}
            {note ? (
              <View style={styles.noteCard}>
                <NoteIcon size={16} weight="duotone" color={colors.textSecondary} />
                <AppText variant="bodySm" color="secondary" style={styles.noteText}>
                  {note}
                </AppText>
              </View>
            ) : null}

            {/* Como executar: descrição real do Wger quando disponível. */}
            {description ? (
              <>
                <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>Como executar</AppText>
                <AppText variant="bodySm" color="secondary">{description}</AppText>
              </>
            ) : null}

            {/* Demonstração em vídeo: botão neon quando há URL, aviso honesto quando não há. */}
            {videoUrl ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver demonstração em vídeo"
                style={styles.videoBtn}
                onPress={() => void Linking.openURL(videoUrl)}
              >
                <View style={styles.videoPlay}>
                  <Play size={16} weight="fill" color={colors.textInverse} />
                </View>
                <AppText variant="label">Ver demonstração em vídeo</AppText>
              </Pressable>
            ) : (
              <View style={styles.demo}>
                <View style={styles.demoIcon}>
                  <FilmSlate size={22} weight="duotone" color={colors.textSecondary} />
                </View>
                <AppText variant="bodySm" color="tertiary" style={styles.demoText}>
                  Demonstração em vídeo ainda não disponível para este exercício.
                </AppText>
              </View>
            )}

            {/* Crédito de licença Wger. */}
            {ex ? (
              <AppText variant="metaSmall" color="tertiary" style={styles.credit}>Wger · CC-BY-SA</AppText>
            ) : null}

            {/* Navegação entre exercícios do mesmo treino. */}
            {prev || next ? (
              <View style={styles.nav}>
                {prev ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Anterior: ${prev.name_snapshot}`}
                    style={[styles.navBtn, styles.navPrev]}
                    onPress={() => goTo(prev)}
                  >
                    <CaretLeft size={16} weight="bold" color={colors.textSecondary} />
                    <AppText variant="metaSmall" color="secondary" numberOfLines={1}>
                      {prev.name_snapshot}
                    </AppText>
                  </Pressable>
                ) : (
                  <View style={styles.navSpacer} />
                )}
                {next ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Próximo: ${next.name_snapshot}`}
                    style={[styles.navBtn, styles.navNext]}
                    onPress={() => goTo(next)}
                  >
                    <AppText variant="metaSmall" color="secondary" numberOfLines={1}>
                      {next.name_snapshot}
                    </AppText>
                    <CaretRight size={16} weight="bold" color={colors.textSecondary} />
                  </Pressable>
                ) : (
                  <View style={styles.navSpacer} />
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  scroll: {},
  // Hero cinematográfico full-bleed (altura definida inline pelo tamanho da tela).
  hero: {
    backgroundColor: theme.colors.surface2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  back: {
    position: 'absolute',
    left: theme.spacing.lg,
    width: 38,
    height: 38,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  heroEyebrow: { marginBottom: theme.spacing.sm },
  body: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  // Prescrição: métrica dominante (séries×reps) + secundária (descanso), divididas.
  prescription: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  presMain: { flex: 1.5, gap: theme.spacing.xs },
  presSide: { flex: 1, gap: theme.spacing.xs },
  presDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.outlineVariant,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface1,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.neon,
    borderRadius: theme.radius.tag,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  noteText: { flex: 1 },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  demoIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoText: { flex: 1 },
  secLabel: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  videoPlay: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credit: { marginTop: theme.spacing.lg },
  nav: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  navPrev: { justifyContent: 'flex-start' },
  navNext: { justifyContent: 'flex-end' },
  navSpacer: { flex: 1 },
}));
