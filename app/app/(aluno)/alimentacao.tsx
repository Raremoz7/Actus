import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaretLeft, Plus, ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, ConfirmDialog, ListState } from '@/components/ui';
import { MealCard, MealFormSheet } from '@/components/meals';
import { goBackOr } from '@/lib/nav';
import { toast } from '@/store/toastStore';
import { groupFeedByDay, type DayGroup, type FeedMeal } from '@/lib/meals';
import { useMeals, useCreateMeal, useUpdateMeal, useDeleteMeal } from '@/hooks/useMeals';
import { useMealQueueStore } from '@/store/mealQueueStore';
import type { MealInput } from '@/types/meals';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export default function AlimentacaoScreen() {
  const list = useMeals();
  const create = useCreateMeal();
  const update = useUpdateMeal();
  const del = useDeleteMeal();
  const queueItems = useMealQueueStore((s) => s.items);
  const hydrateQueue = useMealQueueStore((s) => s.hydrate);
  const removeFromQueue = useMealQueueStore((s) => s.remove);
  const enqueue = useMealQueueStore((s) => s.enqueue);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<(MealInput & { id?: string }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void hydrateQueue();
  }, [hydrateQueue]);

  const groups = useMemo<DayGroup[]>(() => {
    const server: FeedMeal[] = (list.data ?? []).map((m) => ({
      key: m.id, id: m.id, photoUri: m.photo_url, eatenAt: m.eaten_at,
      description: m.description, tags: m.tags, comments: m.comments, sync: 'synced',
    }));
    const pending: FeedMeal[] = Object.values(queueItems).map((q) => ({
      key: q.localId, id: null, photoUri: q.photoUri, eatenAt: q.eatenAt,
      description: q.description, tags: q.tags, comments: [], sync: q.status,
    }));
    return groupFeedByDay([...server, ...pending]);
  }, [list.data, queueItems]);

  const isEmpty = !list.isLoading && !list.isError && groups.length === 0;

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function handleConfirm(input: MealInput) {
    setSheetOpen(false);
    if (editing?.id) {
      update.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => toast('Refeição atualizada'),
          onError: () => toast('Não foi possível atualizar'),
        },
      );
      return;
    }
    create.mutate(input, {
      onSuccess: () => toast('Refeição registrada'),
      onError: () => {
        enqueue({ photoUri: input.photoUri, description: input.description, tags: input.tags, eatenAt: input.eatenAt });
        toast('Salvo — aguardando sincronização');
      },
    });
  }

  function handleEdit(m: FeedMeal) {
    setEditing({
      id: m.id ?? undefined,
      photoUri: m.photoUri,
      description: m.description,
      tags: m.tags,
      eatenAt: m.eatenAt,
    });
    setSheetOpen(true);
  }

  function handleDelete(m: FeedMeal) {
    if (m.id) setDeleteId(m.id);
    else removeFromQueue(m.key);
  }

  function confirmDelete() {
    if (!deleteId) return;
    del.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
      onSuccess: () => toast('Refeição excluída'),
      onError: () => toast('Não foi possível excluir'),
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} onPress={() => goBackOr()} style={styles.back}>
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="tertiary">Alimentação</AppText>
          <AppText variant="h2">O que comi</AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Adicionar refeição" onPress={openAdd} style={styles.addBtn}>
          <Plus size={22} weight="bold" color={colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.flex}>
        {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}
        {isEmpty ? (
          <ListState kind="empty" icon={ForkKnife} title="Nenhuma refeição registrada" message="Toque em + para registrar o que você comeu" actionLabel="Adicionar refeição" onAction={openAdd} />
        ) : null}
        {list.isError && groups.length === 0 ? (
          <ListState kind="error" title="Não foi possível carregar" message="Verifique sua conexão e tente novamente." actionLabel="Tentar de novo" onAction={() => void list.refetch()} />
        ) : null}

        {groups.length > 0 ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.neon} colors={[colors.neon]} />}
          >
            {groups.map((g) => (
              <View key={g.dateKey} style={styles.day}>
                <AppText variant="eyebrow" color="tertiary">{g.dayLabel}</AppText>
                {g.meals.map((m) => (
                  <MealCard key={m.key} meal={m} onEdit={() => handleEdit(m)} onDelete={() => handleDelete(m)} />
                ))}
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <MealFormSheet visible={sheetOpen} initial={editing} onClose={() => setSheetOpen(false)} onConfirm={handleConfirm} />
      <ConfirmDialog visible={deleteId !== null} title="Excluir refeição" message="Esta ação não pode ser desfeita." confirmLabel="Excluir" tone="destructive" loading={del.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: theme.spacing.xs },
  addBtn: { width: 44, height: 44, borderRadius: theme.radius.pill, backgroundColor: theme.colors.neon, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xl },
  day: { gap: theme.spacing.sm, marginTop: theme.spacing.lg },
}));
