// Tela empilhada (raiz, fora dos grupos) de edição de perfil → PATCH /me.
//
// REALIDADE DE DADOS (honestidade obrigatória): o GET /me devolve SÓ
// { id, tipo, display_name } (MeSchema). Os campos full_name / phone / gender /
// body_weight_kg / avatar_url / timezone são WRITE-ONLY via PATCH /me — não
// voltam em NENHUM GET. Por isso só `display_name` faz round-trip e é
// pré-preenchido com useMe(). Os demais começam vazios (placeholder), pois não
// há fonte de leitura — pré-preenchê-los seria inventar dado.
// [MOCK — leitura dos campos ricos: sem endpoint na API v1 até o backend
//  expô-los num GET.]
//
// Enviamos só os campos efetivamente preenchidos (pelo menos 1), validados por
// PatchMeBodySchema. Sucesso → router.back(). Erro discreto, sem banner pesado.

import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
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
import { useMe } from '@/hooks/useMe';
import { usePatchMe } from '@/hooks/usePatchMe';
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
  const me = useMe();
  const patchMe = usePatchMe();

  // display_name é o único campo com fonte de leitura → pré-preenchido.
  const [displayName, setDisplayName] = useState('');
  // Demais campos: write-only, sem pré-preenchimento (placeholder vazio).
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [weight, setWeight] = useState('');

  // Erro discreto de salvamento (string única, sem banner pesado).
  const [saveError, setSaveError] = useState<string | null>(null);

  // Semeia o display_name assim que o /me resolve (uma vez, quando muda o valor remoto).
  const remoteDisplayName = me.data?.display_name ?? '';
  useEffect(() => {
    setDisplayName(remoteDisplayName);
  }, [remoteDisplayName]);

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
    const trimmedName = displayName.trim();
    if (trimmedName !== '' && trimmedName !== remoteDisplayName) {
      next.display_name = trimmedName;
    }
    const trimmedFull = fullName.trim();
    if (trimmedFull !== '') next.full_name = trimmedFull;
    const trimmedPhone = phone.trim();
    if (trimmedPhone !== '') next.phone = trimmedPhone;
    if (gender !== undefined) next.gender = gender;
    const parsedWeight = parseWeight(weight);
    if (parsedWeight !== null) next.body_weight_kg = parsedWeight;
    return next;
  }, [displayName, remoteDisplayName, fullName, phone, gender, weight]);

  const hasChanges = Object.keys(body).length > 0;

  function handleSave() {
    setSaveError(null);
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

              {/* full_name é write-only: sem pré-preenchimento (placeholder vazio). */}
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

              {/* phone é write-only: sem pré-preenchimento (placeholder vazio). */}
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

              {/* gender é write-only: nada vem selecionado por padrão. */}
              <GenderChips label="Gênero · opcional" value={gender} onChange={setGender} />

              {/* body_weight_kg é write-only: sem pré-preenchimento. */}
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
