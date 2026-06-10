// Tela empilhada (raiz, fora dos grupos) de edição de perfil → PATCH /me.
//
// LEITURA: GET /me/profile (useMyProfile) devolve o perfil rico — display_name,
// full_name, phone, gender, body_weight_kg (+ avatar/timezone/nascimento). Pré-preenchemos
// TODOS os campos editáveis com ele. No envio, mandamos só o que MUDOU em relação ao
// perfil carregado (PATCH /me parcial), validado por PatchMeBodySchema.
// Sucesso → router.back(). Erro discreto, sem banner pesado.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { goBackOr } from '@/lib/nav';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import { GenderChips } from '@/components/molecules';
import { useMyProfile } from '@/hooks/useMyProfile';
import { usePatchMe } from '@/hooks/usePatchMe';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { PatchMeBodySchema, type PatchMeBody } from '@/types/me';
import type { Gender } from '@/types/auth';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Converte o texto do campo de peso em número (kg). Aceita vírgula ou ponto.
// Retorna null quando vazio/inválido — o campo é opcional.
function parseWeight(input: string): number | null {
  const normalized = input.replace(',', '.').trim();
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export default function EditarPerfilScreen() {
  const profile = useMyProfile();
  const patchMe = usePatchMe();
  const uploadAvatar = useUploadAvatar();

  // Todos pré-preenchidos com GET /me/profile.
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [weight, setWeight] = useState('');

  // Erro discreto de salvamento (string única, sem banner pesado).
  const [saveError, setSaveError] = useState<string | null>(null);

  // Valores remotos (baseline) para detectar o que mudou no envio.
  const p = profile.data;
  const remote = useMemo(
    () => ({
      display_name: p?.display_name ?? '',
      full_name: p?.full_name ?? '',
      phone: p?.phone ?? '',
      gender: p?.gender ?? undefined,
      weight: p?.body_weight_kg != null ? String(p.body_weight_kg) : '',
    }),
    [p],
  );

  // Semeia os campos UMA vez, quando o perfil chega. Se o usuário já digitou antes do
  // perfil carregar (rede lenta), NÃO sobrescreve o que ele escreveu.
  const seeded = useRef(false);
  useEffect(() => {
    if (!p || seeded.current) return;
    seeded.current = true;
    const userTyped =
      displayName !== '' || fullName !== '' || phone !== '' || weight !== '' || gender !== undefined;
    if (userTyped) return;
    setDisplayName(remote.display_name);
    setFullName(remote.full_name);
    setPhone(remote.phone);
    setGender(remote.gender);
    setWeight(remote.weight);
  }, [p, remote, displayName, fullName, phone, weight, gender]);

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  // Monta o body apenas com os campos preenchidos. display_name só entra se
  // mudou em relação ao valor remoto (evita PATCH redundante quando intocado).
  const body = useMemo<PatchMeBody>(() => {
    const next: PatchMeBody = {};
    const tName = displayName.trim();
    if (tName !== '' && tName !== remote.display_name) next.display_name = tName;
    const tFull = fullName.trim();
    if (tFull !== '' && tFull !== remote.full_name) next.full_name = tFull;
    const tPhone = phone.trim();
    if (tPhone !== remote.phone) next.phone = tPhone === '' ? null : tPhone;
    if (gender !== undefined && gender !== remote.gender) next.gender = gender;
    const w = parseWeight(weight);
    const remoteW = remote.weight === '' ? null : Number(remote.weight);
    if (w !== remoteW) next.body_weight_kg = w;
    return next;
  }, [displayName, fullName, phone, gender, weight, remote]);

  const hasChanges = Object.keys(body).length > 0;

  // Iniciais para o fallback do avatar (1ª letra do primeiro e do último nome).
  const initials = useMemo(() => {
    const parts = (remote.display_name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
    return (first + last).toUpperCase();
  }, [remote.display_name]);

  async function pickAvatar() {
    setSaveError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSaveError('Precisamos de acesso às fotos para trocar o avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    uploadAvatar.mutate(
      { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName },
      { onError: () => setSaveError('Não foi possível enviar a foto. Tente de novo.') },
    );
  }

  function handleSave() {
    setSaveError(null);
    // Peso preenchido mas não-numérico → erro explícito (não limpa o valor em silêncio).
    if (weight.trim() !== '' && parseWeight(weight) === null) {
      setSaveError('Peso inválido. Use só números, ex.: 82,5.');
      return;
    }
    // Valida antes de enviar (pelo menos 1 campo, peso 20–400, etc.).
    const parsed = PatchMeBodySchema.safeParse(body);
    if (!parsed.success) {
      setSaveError(parsed.error.issues[0]?.message ?? 'Revise os campos preenchidos.');
      return;
    }
    patchMe.mutate(parsed.data, {
      onSuccess: () => {
        goBackOr('/(aluno)/(tabs)/perfil');
      },
      onError: () => {
        setSaveError('Não foi possível salvar. Tente de novo.');
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => goBackOr('/(aluno)/(tabs)/perfil')}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          Editar perfil
        </AppText>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={revealStyle}>
            <AppText variant="h3" style={styles.title}>
              Seus dados
            </AppText>
            <AppText variant="bodySm" color="tertiary" style={styles.subtitle}>
              Atualize o que quiser. Campos em branco ficam como estão.
            </AppText>

            {profile.isLoading && !profile.data ? (
              <AppText variant="bodySm" color="tertiary" style={styles.stateRow}>
                Carregando seu perfil…
              </AppText>
            ) : profile.isError && !profile.data ? (
              <View style={styles.stateRow}>
                <AppText variant="bodySm" color="error">
                  Não foi possível carregar seu perfil.
                </AppText>
                <Pressable onPress={() => profile.refetch()} accessibilityRole="button" hitSlop={8}>
                  <AppText variant="label" color="neon">
                    Tentar de novo
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                {profile.data?.avatar_url ? (
                  <Image
                    source={{ uri: profile.data.avatar_url }}
                    style={styles.avatarImg}
                    accessibilityLabel="Sua foto"
                  />
                ) : (
                  <AppText variant="h3" color="neon">
                    {initials}
                  </AppText>
                )}
              </View>
              <Pressable
                onPress={pickAvatar}
                accessibilityRole="button"
                accessibilityLabel="Trocar foto"
                disabled={uploadAvatar.isPending}
                hitSlop={8}
              >
                <AppText variant="label" color={uploadAvatar.isPending ? 'tertiary' : 'neon'}>
                  {uploadAvatar.isPending ? 'Enviando…' : 'Trocar foto'}
                </AppText>
              </Pressable>
            </View>

            <View style={styles.form}>
              <Input
                label="Nome de exibição"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Como você aparece no app"
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Nome de exibição"
              />

              <Input
                label="Nome completo · opcional"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nome completo"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                accessibilityLabel="Nome completo"
              />

              <Input
                label="Telefone · opcional"
                value={phone}
                onChangeText={setPhone}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                accessibilityLabel="Telefone"
              />

              <GenderChips label="Gênero · opcional" value={gender} onChange={setGender} />

              <Input
                label="Peso (kg) · opcional"
                value={weight}
                onChangeText={setWeight}
                placeholder="0"
                keyboardType="decimal-pad"
                accessibilityLabel="Peso em quilos"
              />
            </View>

            {saveError ? (
              <AppText variant="bodySm" color="error" style={styles.error}>
                {saveError}
              </AppText>
            ) : null}
          </Animated.View>

          <View style={styles.footer}>
            <Button
              variant="primary"
              label="Salvar"
              loading={patchMe.isPending}
              disabled={!hasChanges}
              onPress={handleSave}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.xl,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  form: {
    gap: theme.spacing.lg,
  },
  error: {
    marginTop: theme.spacing.lg,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
