import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { PencilSimple, Trash, ChatCircle, CloudArrowUp, WarningCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import { mealTimeLabel, type FeedMeal } from '@/lib/meals';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  meal: FeedMeal;
  onEdit: () => void;
  onDelete: () => void;
};

export function MealCard({ meal, onEdit, onDelete }: Props) {
  const [showComments, setShowComments] = useState(false);
  const commentCount = meal.comments.length;

  return (
    <Card style={styles.cardExtra}>
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} resizeMode="cover" />
      ) : null}

      <View style={styles.headerRow}>
        <AppText variant="dataMed" color="neon">{mealTimeLabel(meal.eatenAt)}</AppText>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Editar refeição" hitSlop={10} onPress={onEdit}>
            <PencilSimple size={18} weight="duotone" color={colors.textSecondary} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Excluir refeição" hitSlop={10} onPress={onDelete}>
            <Trash size={18} weight="duotone" color={colors.error} />
          </Pressable>
        </View>
      </View>

      {meal.description ? (
        <AppText variant="bodyMd" style={styles.description}>{meal.description}</AppText>
      ) : null}

      {meal.tags.length > 0 ? (
        <View style={styles.tags}>
          {meal.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <AppText variant="metaSmall" color="secondary">{t}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {meal.sync !== 'synced' ? (
        <View style={styles.syncRow}>
          {meal.sync === 'error' ? (
            <WarningCircle size={14} weight="duotone" color={colors.error} />
          ) : (
            <CloudArrowUp size={14} weight="duotone" color={colors.textTertiary} />
          )}
          <AppText variant="metaSmall" color={meal.sync === 'error' ? 'error' : 'tertiary'}>
            {meal.sync === 'error' ? 'Falha ao enviar — tentar de novo' : 'Aguardando sincronização'}
          </AppText>
        </View>
      ) : null}

      {commentCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comentário do Personal"
          onPress={() => setShowComments((v) => !v)}
          style={styles.commentToggle}
        >
          <ChatCircle size={16} weight="duotone" color={colors.accentMuted} />
          <AppText variant="metaSmall" color="accentMuted">
            {`Comentário do Personal (${commentCount})`}
          </AppText>
        </Pressable>
      ) : null}

      {showComments
        ? meal.comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <AppText variant="metaSmall" color="tertiary">
                {c.author_name ?? 'Personal'} · {mealTimeLabel(c.created_at)}
              </AppText>
              <AppText variant="bodySm">{c.body}</AppText>
            </View>
          ))
        : null}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardExtra: {
    gap: theme.spacing.sm,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: theme.radius.thumb,
    marginBottom: theme.spacing.xs,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
  description: {},
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.accentMutedSurface,
  },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  commentToggle: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  comment: {
    gap: 2,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.accentMuted,
    paddingLeft: theme.spacing.sm,
  },
}));
