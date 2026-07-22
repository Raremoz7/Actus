import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from '@/lib/imagePicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Camera } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, BottomSheet, Button, Card, Input } from '@/components/ui';
import { isMealInputValid } from '@/lib/meals';
import type { MealInput } from '@/types/meals';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export const MEAL_TAGS = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Pré-treino', 'Pós-treino'] as const;

type Props = {
  visible: boolean;
  initial: (MealInput & { id?: string }) | null; // null = adicionar
  onClose: () => void;
  onConfirm: (input: MealInput) => void;
};

export function MealFormSheet({ visible, initial, onClose, onConfirm }: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [eatenAt, setEatenAt] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPhotoUri(initial?.photoUri ?? null);
    setDescription(initial?.description ?? '');
    setTags(initial?.tags ?? []);
    setEatenAt(initial?.eatenAt ? new Date(initial.eatenAt) : new Date());
    setShowPicker(false);
  }, [visible, initial]);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled) return;
    setPhotoUri(result.assets[0]?.uri ?? null);
  }

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  const canSave = isMealInputValid({
    eatenAt: eatenAt.toISOString(),
    description: description.trim() === '' ? null : description,
    photoUri,
  });

  function handleConfirm() {
    if (!canSave) return;
    onConfirm({
      photoUri,
      description: description.trim() === '' ? null : description.trim(),
      tags,
      eatenAt: eatenAt.toISOString(),
    });
  }

  const timeLabel = `${String(eatenAt.getHours()).padStart(2, '0')}:${String(eatenAt.getMinutes()).padStart(2, '0')}`;

  return (
    <BottomSheet
      visible={visible}
      title={initial?.id ? 'Editar refeição' : 'Adicionar refeição'}
      onClose={onClose}
      closeLabel="Fechar formulário"
    >
      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card
          accessibilityLabel="Adicionar foto"
          onPress={() => void pickPhoto()}
          padding="none"
          style={styles.photoBoxExtra}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Camera size={32} weight="duotone" color={colors.textTertiary} />
          )}
        </Card>

        <Pressable accessibilityRole="button" accessibilityLabel="Horário" onPress={() => setShowPicker(true)} style={styles.timeRow}>
          <AppText variant="eyebrow" color="tertiary">Horário</AppText>
          <AppText variant="dataMed">{timeLabel}</AppText>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={eatenAt}
            mode="time"
            onChange={(_e, d) => {
              setShowPicker(Platform.OS === 'ios');
              if (d) setEatenAt(d);
            }}
          />
        ) : null}

        <Input label="Descrição" accessibilityLabel="Descrição" placeholder="O que você comeu?" value={description} onChangeText={setDescription} multiline />

        <AppText variant="eyebrow" color="tertiary" style={styles.tagsLabel}>Tags</AppText>
        <View style={styles.tags}>
          {MEAL_TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => toggleTag(t)} style={[styles.tag, on && styles.tagOn]}>
                <AppText variant="metaSmall" color={on ? 'inverse' : 'secondary'}>{t}</AppText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.cta}>
        <Button variant="primary" label="Salvar refeição" disabled={!canSave} onPress={handleConfirm} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Limita a altura da área rolável; o rodapé (CTA) fica fixo abaixo.
  body: { maxHeight: 420 },
  photoBoxExtra: {
    height: 160, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  photo: { width: '100%', height: '100%' },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.surface1, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.input, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  tagsLabel: { marginBottom: theme.spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  tag: { paddingVertical: 6, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.outline },
  tagOn: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
  cta: { marginTop: theme.spacing.xs },
}));
