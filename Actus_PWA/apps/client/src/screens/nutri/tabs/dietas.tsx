import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from '@/navigation';
import { CaretRight, ForkKnife, Plus } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, Button, ListState, TopBar } from '@/components/ui';
import { useDietTemplates } from '@/hooks/useDietTemplates';
import type { DietTemplateListItem } from '@/types/diets';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Contador no eyebrow: "1 dieta" / "N dietas".
function countLabel(n: number): string {
  return n === 1 ? '1 dieta' : `${n} dietas`;
}

// Data curta a partir do created_at (ISO). Usa componentes LOCAIS do Date
// (nunca toISOString) → "dd/mm/aaaa". Se a string não for uma data válida,
// devolve string vazia (o card simplesmente omite a linha).
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

type CardProps = {
  template: DietTemplateListItem;
  onPress: () => void;
};

// Card de template de dieta: ícone + nome + data de criação curta. Tocável →
// abre o builder em modo edição. Visual alinhado ao ProWorkoutCard
// (surface1 + borda outlineVariant + radius card).
function DietTemplateCard({ template, onPress }: CardProps) {
  const created = shortDate(template.created_at);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={template.name}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardIcon}>
        <ForkKnife size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.cardText}>
        <AppText variant="h3" numberOfLines={1}>
          {template.name}
        </AppText>
        {created.length > 0 ? (
          <AppText variant="metaSmall" color="tertiary">
            {`Criada em ${created}`}
          </AppText>
        ) : null}
      </View>
      <CaretRight size={16} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

// Aba de dietas do nutricionista: lista de templates criados.
// GET /diet-templates via useDietTemplates. "Nova dieta" e cada card abrem o
// builder (/montar-dieta), criando ou editando (?id=).
export default function NutriDietasScreen() {
  const list = useDietTemplates();

  // 1 momento de motion por tela: reveal de entrada (opacity + translateY, 300ms).
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const templates = useMemo(() => list.data?.diet_templates ?? [], [list.data]);

  function openBuilder() {
    router.push('/montar-dieta' as Href);
  }

  function openTemplate(id: string) {
    router.push(('/montar-dieta?id=' + id) as Href);
  }

  const isEmpty = !list.isLoading && !list.isError && templates.length === 0;

  return (
    <Screen edges={['top']}>
      <TopBar title="Dietas" eyebrow={countLabel(templates.length)} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View style={revealStyle}>
        <View style={styles.newBtn}>
          <Button
            variant="primary"
            label="Nova dieta"
            icon={<Plus size={18} weight="bold" color={colors.textInverse} />}
            onPress={openBuilder}
          />
        </View>

        <View style={styles.list}>
          {templates.map((t) => (
            <DietTemplateCard
              key={t.id}
              template={t}
              onPress={() => openTemplate(t.id)}
            />
          ))}
        </View>

        {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}

        {isEmpty ? (
          <ListState
            kind="empty"
            icon={ForkKnife}
            title="Nenhuma dieta ainda"
            message="Monte seu primeiro template para atribuir aos alunos"
            actionLabel="Nova dieta"
            onAction={openBuilder}
          />
        ) : null}

        {list.isError ? (
          <ListState
            kind="error"
            title="Não foi possível carregar"
            message="Verifique sua conexão e tente novamente."
            actionLabel="Tentar de novo"
            onAction={() => void list.refetch()}
          />
        ) : null}
      </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  newBtn: {
    marginBottom: theme.spacing.xl,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  note: {
    marginTop: theme.spacing.lg,
  },
}));
