import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { router, useLocalSearchParams, type Href } from '@/navigation';
import { CaretLeft, CaretRight, FilmSlate, Note as NoteIcon, Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { HeroCarousel } from '@/components/exercises/HeroCarousel';
import { ImageLightbox } from '@/components/exercises/ImageLightbox';
import { useWorkoutDetail } from '@/hooks/useWorkoutDetail';
import { goBackOr } from '@/lib/nav';
import { exerciseImageUrl } from '@/lib/exerciseImage';
import { wgerCatalog, exerciseDescription } from '@/lib/wger/catalog';
import { wgerImageSource, wgerVideoUrl } from '@/lib/wger/media';
import { exerciseCatalog, EQUIPMENT_PT } from '@/lib/exercises/catalog';
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
    exerciseId?: string;
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

  // Novo banco: busca pelo exerciseId (slug) do catálogo local.
  const exerciseIdParam = typeof params.exerciseId === 'string' ? params.exerciseId : '';
  const catalogEx =
    exerciseIdParam
      ? exerciseCatalog().getById(exerciseIdParam)
      // Fallback por nome: workouts legados (wger-only) sem exerciseId — tenta match no catálogo PT-BR.
      : name
        ? (exerciseCatalog().search(name, 1)[0] ?? null)
        : null;

  // Fallback legado: Wger (mantém retrocompatibilidade quando o catálogo PT-BR não encontrou nada).
  const wgerId = Number(params.wgerId);
  const wgerEx = !catalogEx && Number.isFinite(wgerId) && wgerId > 0 ? wgerCatalog().getExercise(wgerId) : null;

  // Monta array de imagens para o carrossel (1 ou 2 fontes).
  const heroImages: ImageSourcePropType[] = catalogEx
    ? ([
        catalogEx.image_0_url ? { uri: catalogEx.image_0_url } : null,
        catalogEx.image_1_url ? { uri: catalogEx.image_1_url } : null,
      ].filter(Boolean) as ImageSourcePropType[])
    : [wgerImageSource(wgerId) ?? { uri: exerciseImageUrl(muscle, 1200) }];

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const description = catalogEx
    ? null  // catálogo PT-BR ainda sem instruções na tela; mostra só o básico
    : wgerEx ? exerciseDescription(wgerEx) : null;
  const videoUrl = wgerEx ? wgerVideoUrl(wgerId) : null;
  // Sem vídeo próprio: abre uma busca no YouTube. Nome em inglês + termos de
  // tutorial garantem que o topo seja um vídeo demonstrativo da execução.
  // `sp=EgIYAQ%3D%3D` filtra duração < 4 min (enviesa p/ vídeos curtos).
  const youtubeSearchUrl = name
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${name} exercise proper form demonstration`)}&sp=EgIYAQ%253D%253D`
    : null;
  // Busca no YouTube é o padrão; o vídeo do Wger fica só como fallback.
  const videoHref = youtubeSearchUrl ?? videoUrl;

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
  // Equipamento: prioriza machine_type (ex.: "Smith Machine"); senão o equipment do catálogo
  // traduzido p/ PT-BR (presente na maioria dos exercícios); por fim o equipment vindo por param
  // (workouts legados sem exerciseId). Antes só usava machine_type/param e quase nunca aparecia.
  const catalogEquipment = catalogEx?.equipment
    ? (EQUIPMENT_PT[catalogEx.equipment] ?? catalogEx.equipment)
    : '';
  const displayEquipment = catalogEx?.machine_type || catalogEquipment || equipment;
  // Grupo muscular + equipamento viram um eyebrow único sobre a foto (sem repetir o nome).
  const heroMeta = [muscle, displayEquipment].filter(Boolean).join(' · ');

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
        wgerId: String(sibling.wger_exercise_id ?? ''),
        exerciseId: sibling.exercise_id ?? '',
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
          {/* Hero cinematográfico com carrossel de imagens. */}
          <HeroCarousel
            images={heroImages}
            height={heroHeight}
            onTap={(idx) => setLightboxIndex(idx)}
          >
            {/* Scrim de baixo p/ cima — garante leitura do título sobre qualquer foto. */}
            <LinearGradient
              pointerEvents="none"
              colors={[...gradients.heroScrim]}
              locations={[...heroScrimLocations]}
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
          </HeroCarousel>

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
            {videoHref ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={youtubeSearchUrl ? 'Buscar demonstração no YouTube' : 'Ver demonstração em vídeo'}
                style={styles.videoBtn}
                onPress={() => void Linking.openURL(videoHref)}
              >
                <View style={styles.videoPlay}>
                  <Play size={16} weight="fill" color={colors.textInverse} />
                </View>
                <AppText variant="label">
                  {youtubeSearchUrl ? 'Buscar demonstração no YouTube' : 'Ver demonstração em vídeo'}
                </AppText>
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

            {/* Crédito de licença Wger (apenas para exercícios legados). */}
            {wgerEx ? (
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
                    <AppText variant="metaSmall" color="secondary" numberOfLines={1} style={styles.navText}>
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
                    <AppText variant="metaSmall" color="secondary" numberOfLines={1} style={styles.navText}>
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

      <ImageLightbox
        images={heroImages}
        initialIndex={lightboxIndex ?? 0}
        visible={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  scroll: {},
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  navText: { flex: 1, flexShrink: 1 },
}));
