// Atribuir dieta ao aluno (rota '/atribuir-dieta?student=<studentId>').
//
// Fluxo: o nutricionista escolhe UM template existente (GET /diet-templates) e
// atribui via POST /students/:student_id/diets.
// start_date = hoje LOCAL por padrão (formatDateLocal — nunca toISOString, bug UTC-3).
//
// NOTA: não há tela de "criar template" aqui — isto reutiliza os templates já
// montados em /montar-dieta. Sem template selecionado, "Atribuir" fica desabilitado.

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from '@/navigation';
import { ForkKnife, Check, CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Card } from '@/components/ui';
import { useDietTemplates } from '@/hooks/useDietTemplates';
import { useDietTemplateDetail } from '@/hooks/useDietTemplateDetail';
import { useAssignDiet } from '@/hooks/useAssignDiet';
import { useStudents } from '@/hooks/useStudents';
import { formatDateLocal } from '@/lib/format';
import { apiErrorMessage } from '@/lib/apiErrorMessage';
import { parseDietBody, type DietTemplateListItem } from '@/types/diets';
import { darkTheme } from '@/theme';
import { StudentTargetHeader } from '@/components/professional/StudentTargetHeader';

const { colors, motion } = darkTheme;

// Rótulo de refeições do resumo do body.
function mealsLabel(n: number): string {
  return n === 1 ? '1 refeição' : `${n} refeições`;
}

type TemplateCardProps = {
  template: DietTemplateListItem;
  selected: boolean;
  // Resumo do body ("3 refeições · 1800 kcal") — só do template selecionado (detalhe carregado).
  summary?: string | null;
  onPress: () => void;
};

// Card de template SELECIONÁVEL (seleção única). Visual alinhado ao card de
// dietas da aba do nutricionista; borda/realce neon quando selecionado.
// O template selecionado mostra um resumo do body (refeições + kcal) quando há.
function TemplateCard({ template, selected, summary, onPress }: TemplateCardProps) {
  return (
    <Card
      onPress={onPress}
      surface={selected ? 'surface2' : 'surface1'}
      emphasis={selected}
      padding="lg"
      style={styles.cardExtra}
      accessibilityLabel={template.name}
    >
      <View style={styles.cardIcon}>
        <ForkKnife size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.cardText}>
        <AppText variant="h3" numberOfLines={1}>
          {template.name}
        </AppText>
        {summary ? (
          <AppText variant="metaSmall" color="tertiary" numberOfLines={1}>
            {summary}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.checkMark}>
          <Check size={16} weight="bold" color={colors.textInverse} />
        </View>
      ) : (
        <View style={styles.checkEmpty} />
      )}
    </Card>
  );
}

export default function AtribuirDietaScreen() {
  const params = useLocalSearchParams<{ student?: string }>();
  const studentId = typeof params.student === 'string' ? params.student : undefined;

  const list = useDietTemplates();
  const assign = useAssignDiet();
  const students = useStudents();

  // Aluno-alvo resolvido do cache de useStudents (id chega por param; nome vem do cache).
  const student = useMemo(
    () => students.data?.students.find((s) => s.id === studentId),
    [students.data, studentId],
  );
  const studentName = student
    ? (student.full_name?.trim() || student.email)
    : null;

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  // Detalhe do template SELECIONADO → resumo do body (refeições + kcal). A lista
  // não traz body, então só o escolhido é detalhado (uma request, sob demanda).
  const detail = useDietTemplateDetail(templateId ?? undefined);
  const summary = useMemo(() => {
    if (!detail.data) return null;
    const body = parseDietBody(detail.data.body);
    const meals = body.meals.length;
    if (meals === 0) return null;
    const kcal = body.target_kcal;
    const parts = [mealsLabel(meals)];
    if (typeof kcal === 'number' && kcal > 0) {
      parts.push(`${Math.round(kcal)} kcal`);
    }
    return parts.join(' · ');
  }, [detail.data]);

  // 1 momento de motion por tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  const templates = useMemo(() => list.data?.diet_templates ?? [], [list.data]);

  function selectTemplate(id: string) {
    if (error) setError(undefined);
    setTemplateId(id);
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(nutri)/(tabs)/alunos');
    }
  }

  // "Atribuir" só habilita com template selecionado + aluno conhecido.
  const canAssign = Boolean(studentId) && templateId !== null;

  function handleAssign() {
    if (!studentId || !templateId) return;
    setError(undefined);
    assign.mutate(
      {
        studentId,
        body: {
          diet_template_id: templateId,
          // start_date = hoje LOCAL (componentes do Date, nunca toISOString → fuso UTC-3).
          start_date: formatDateLocal(new Date()),
        },
      },
      {
        onSuccess: () => handleBack(),
        onError: (err) => setError(apiErrorMessage(err)),
      },
    );
  }

  const isEmpty = !list.isLoading && !list.isError && templates.length === 0;

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
            Aluno
          </AppText>
          <AppText variant="h2">Atribuir dieta</AppText>
        </View>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <StudentTargetHeader name={studentName} email={student?.email} />

          <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
            Dieta
          </AppText>

          {list.isLoading ? (
            <AppText variant="bodySm" color="tertiary">
              Carregando dietas…
            </AppText>
          ) : list.isError ? (
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar suas dietas.
            </AppText>
          ) : isEmpty ? (
            <View style={styles.emptyBlock}>
              <AppText variant="bodySm" color="tertiary">
                Nenhuma dieta criada ainda. Monte uma dieta antes de atribuir.
              </AppText>
              <Button
                variant="secondary"
                label="Montar dieta"
                onPress={() => router.push('/montar-dieta' as Href)}
              />
            </View>
          ) : (
            <View style={styles.list}>
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={templateId === t.id}
                  summary={templateId === t.id ? summary : null}
                  onPress={() => selectTemplate(t.id)}
                />
              ))}
            </View>
          )}

          {error ? (
            <AppText variant="bodySm" color="error" style={styles.error}>
              {error}
            </AppText>
          ) : null}
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          label="Atribuir"
          loading={assign.isPending}
          disabled={!canAssign}
          onPress={handleAssign}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
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
    paddingBottom: theme.spacing.xl,
  },
  secLabel: {
    marginBottom: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  emptyBlock: {
    gap: theme.spacing.md,
  },
  cardExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
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
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  error: {
    marginTop: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
}));
