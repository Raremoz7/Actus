# Polimento editorial do onboarding (Bloco 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar login, professor-info, troca-senha e o wizard de cadastro (3 passos) ao nível editorial já estabelecido pela `escolha-perfil`, via um átomo `ScreenHero` (faixa-hero: foto + fade + título da tela).

**Architecture:** Cria-se um átomo `ScreenHero` em `src/components/ui/`. As telas de propósito único (login, professor, troca) deixam de usar `<Screen>` e passam a seguir o padrão da `escolha-perfil` (root `View` + hero full-bleed + conteúdo em área segura). O wizard move hero + barra de progresso + botão voltar para **dentro de cada passo**, e o `_layout.tsx` do grupo cadastro fica só com `FormProvider` + `Stack`. **Apenas camada visual** — nenhuma lógica de formulário, mutation, store, schema ou roteamento de erro é alterada.

**Tech Stack:** React Native, Expo SDK 55, Expo Router, Unistyles 3, Reanimated, expo-linear-gradient (`~55.0.14`, já instalado), react-native-safe-area-context, Phosphor.

**Coordenação:** outra sessão finaliza o Bloco 1 (contrato/funcional) na mesma `branch/davi`. Este trabalho toca só JSX de apresentação + `StyleSheet`. Em arquivos de tela, **preservar integralmente** hooks, mutations, `Controller`s, schemas e handlers existentes — mexer só na moldura visual.

**Fotos:** placeholders remotos do Unsplash (source `{ uri }`), marcados `// [ASSET TEMPORÁRIO]`. Davi troca depois por `require(...)` das fotos curadas. Sem binários novos neste plano.

**Verificação (não há infra de testes no projeto):** cada tarefa termina com `npm run typecheck` (zero erro) + `npm run lint` (zero erro/any) + checkpoint visual no dev build, e um commit.

---

## Estrutura de arquivos

- **Criar:** `src/components/ui/ScreenHero.tsx` — átomo da faixa-hero (foto + fade + símbolo/voltar + eyebrow + título). Responsabilidade única: a moldura editorial do topo.
- **Modificar:** `src/components/ui/index.ts` — exportar `ScreenHero`.
- **Modificar:** `app/(auth)/login.tsx` — hero + reestrutura visual.
- **Modificar:** `app/(auth)/professor-info.tsx` — hero (mantém stagger).
- **Modificar:** `app/(auth)/trocar-senha.tsx` — hero + reestrutura visual.
- **Modificar:** `app/(auth)/cadastro/_layout.tsx` — remove header (voltar + progresso); fica só `FormProvider` + `Stack`.
- **Modificar:** `app/(auth)/cadastro/passo-1-convite.tsx` — hero compacto + progresso + voltar próprios.
- **Modificar:** `app/(auth)/cadastro/passo-2-voce.tsx` — idem.
- **Modificar:** `app/(auth)/cadastro/passo-3-acesso.tsx` — idem.

---

## Task 1: Átomo `ScreenHero`

**Files:**
- Create: `src/components/ui/ScreenHero.tsx`
- Modify: `src/components/ui/index.ts`

Padrão de referência: `app/(auth)/escolha-perfil.tsx` (hero full-bleed, sem `<Screen>`) e os átomos existentes (`Text.tsx`, `Logo.tsx`) para o estilo de código Unistyles. O fade usa `expo-linear-gradient` (`transparent → bgBase`), a única forma de escurecer a base da foto para legibilidade. Sem sombra (constraint: sombra só em modal/sheet/dropdown). O hero é estático; a animação de entrada (quando houver) é orquestrada pela tela.

- [ ] **Step 1: Criar o componente**

Create `src/components/ui/ScreenHero.tsx`:

```tsx
import { Image, Pressable, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './Text';
import { Logo } from './Logo';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Faixa-hero editorial: foto (cover) + fade transparente→bgBase + símbolo (ou voltar) no
// topo-esquerda + eyebrow/título ancorados na base sobre o fade.
// - compact: hero baixo do wizard (form-heavy); normal: telas de propósito único.
// - onBack: se setado, mostra o caret de voltar no topo-esquerda em vez do símbolo.
// - titleSize: tamanho do título display (cada tela define o seu).
type ScreenHeroProps = {
  photo: ImageSourcePropType;
  eyebrow: string;
  title: string; // aceita '\n' para 2 linhas
  titleSize: number;
  compact?: boolean;
  onBack?: () => void;
};

const BASE_HEIGHT = 168;
const COMPACT_HEIGHT = 116;

export function ScreenHero({
  photo,
  eyebrow,
  title,
  titleSize,
  compact = false,
  onBack,
}: ScreenHeroProps) {
  const insets = useSafeAreaInsets();
  const height = (compact ? COMPACT_HEIGHT : BASE_HEIGHT) + insets.top;

  return (
    <View style={[styles.root, { height }]}>
      <Image source={photo} style={styles.photo} resizeMode="cover" accessible={false} />
      <LinearGradient
        colors={['transparent', colors.bgBase]}
        locations={[0.35, 1]}
        style={styles.fade}
      />

      <View style={[styles.top, { top: insets.top + 12 }]}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            onPress={onBack}
          >
            <CaretLeft size={24} weight="duotone" color={colors.textPrimary} />
          </Pressable>
        ) : (
          <Logo variant="symbol" color="neon" width={28} />
        )}
      </View>

      <View style={styles.caption}>
        <AppText variant="eyebrow" color="primary" style={styles.eyebrow}>
          {eyebrow}
        </AppText>
        <AppText
          variant="h1"
          style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 0.92) }]}
        >
          {title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.bgBase,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  top: {
    position: 'absolute',
    left: theme.spacing.lg,
  },
  caption: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
  // Eyebrow branco lê bem sobre a base escurecida pelo fade.
  eyebrow: {
    marginBottom: theme.spacing.xs,
    letterSpacing: 2,
  },
  title: {
    // fontSize/lineHeight aplicados inline (titleSize por tela).
  },
}));
```

- [ ] **Step 2: Exportar no barrel**

Modify `src/components/ui/index.ts` — adicionar após o export de `Screen` (linha 15):

```ts
export { ScreenHero } from './ScreenHero';
```

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck`
Expected: zero erro.
Run: `npm run lint`
Expected: zero erro/any.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ScreenHero.tsx src/components/ui/index.ts
git commit -m "feat(ui): atomo ScreenHero (faixa-hero editorial)"
```

---

## Task 2: Login com hero

**Files:**
- Modify: `app/(auth)/login.tsx`

Reescrita visual: troca `<Screen padded>` + `Logo` topo pela estrutura `View root → ScreenHero → KeyboardAvoidingView/ScrollView`. **Motion única** = entrada do hero (substitui o reveal de conteúdo atual). **Preservar 100%** da lógica: `useLoginMutation`, `useForm`/`Controller`s, `loginErrorMessage`, `FormErrorBanner`, marcação dos campos em `invalid_credentials`, `onSubmit`.

- [ ] **Step 1: Reescrever o arquivo**

Replace o conteúdo de `app/(auth)/login.tsx` por:

```tsx
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { WarningCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { LoginBodySchema, type LoginBody } from '@/types/auth';
import { useLoginMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const LOGIN_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&q=70&auto=format&fit=crop',
};

// [fluxo futuro] sem reset de senha na API v1 — não há link "Esqueci a senha".

// Resolve a mensagem de erro a partir do ApiError.code (campo "error" do backend),
// NUNCA pelo HTTP status. invalid_credentials/invalid_body → credenciais; network_error → conexão.
function loginErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    if (err.code === 'network_error') return 'Sem conexão com o servidor.';
    return authErrorMessage(err.code);
  }
  return authErrorMessage('unknown');
}

// O banner de erro aparece SEM animação (sem shake, sem alarme) — borda error radius 4.
function FormErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <WarningCircle size={18} weight="duotone" color={colors.error} />
      <AppText variant="bodySm" color="onSurface" style={styles.bannerText}>
        {message}
      </AppText>
    </View>
  );
}

export default function LoginScreen() {
  const mutation = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginBody>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  // ÚNICA animação da tela: entrada do hero (opacity 0→1 + translateY -16→0, 300ms).
  const heroReveal = useSharedValue(0);
  useEffect(() => {
    heroReveal.value = withTiming(1, { duration: motion.screenMs });
  }, [heroReveal]);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroReveal.value,
    transform: [{ translateY: (1 - heroReveal.value) * -16 }],
  }));

  // Erro de credencial/validação vindo da API marca os DOIS campos e o banner.
  const apiErrorMessage = mutation.isError ? loginErrorMessage(mutation.error) : null;
  const credentialError =
    isApiError(mutation.error) &&
    (mutation.error.code === 'invalid_credentials' || mutation.error.code === 'invalid_body');
  const fieldsHaveApiError = mutation.isError && credentialError;

  function onSubmit(values: LoginBody) {
    mutation.mutate(values, {
      onSuccess: () => {
        router.replace('/');
      },
    });
  }

  return (
    <View style={styles.root}>
      <Animated.View style={heroStyle}>
        <ScreenHero photo={LOGIN_PHOTO} eyebrow="Acesso" title="Entrar" titleSize={44} />
      </Animated.View>

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
          {apiErrorMessage ? <FormErrorBanner message={apiErrorMessage} /> : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  accessibilityLabel="E-mail"
                  error={
                    errors.email
                      ? 'Informe um e-mail válido.'
                      : fieldsHaveApiError
                        ? ' '
                        : undefined
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  accessibilityLabel="Senha"
                  error={
                    errors.password
                      ? 'Informe sua senha.'
                      : fieldsHaveApiError
                        ? ' '
                        : undefined
                  }
                />
              )}
            />

            <View style={styles.cta}>
              <Button
                variant="primary"
                label="Entrar"
                loading={mutation.isPending}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Recebi um convite, criar conta"
              hitSlop={8}
              onPress={() => router.push('/(auth)/cadastro')}
            >
              <AppText variant="bodyMd" color="secondary" style={styles.footerText}>
                Recebi um convite ·{' '}
                <AppText variant="bodyMd" color="neon" style={styles.footerLink}>
                  Criar conta
                </AppText>
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  bannerText: {
    flex: 1,
  },
  form: {
    gap: theme.spacing.lg,
  },
  cta: {
    marginTop: theme.spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
  },
  footerText: {
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
}));
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any.

- [ ] **Step 3: Checkpoint visual**

Abrir o login no dev build: hero com foto + fade + símbolo neon no canto + eyebrow ACESSO + título ENTRAR; campos abaixo; teclado não encobre os campos (scroll funciona); erro de credencial mostra banner + bordas. Hero entra com fade/slide ao montar.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/login.tsx
git commit -m "feat(login): faixa-hero editorial"
```

---

## Task 3: Professor-info com hero

**Files:**
- Modify: `app/(auth)/professor-info.tsx`

O botão voltar migra para o hero (`onBack`). O título editorial passa a ser do hero. **Mantém** o stagger dos `StepRow` como a motion da tela (hero estático). **Preservar** `STEPS`, `StepRow`, `CONTATO_URL`, os dois `Button` e o `Linking.openURL`.

- [ ] **Step 1: Reescrever o arquivo**

Replace o conteúdo de `app/(auth)/professor-info.tsx` por:

```tsx
// [fluxo futuro] auto-cadastro de profissional não existe na API v1 —
// a conta do professor é criada pela equipe Actus (credenciamento).
import { useEffect } from 'react';
import { Linking, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, ScreenHero } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PROFESSOR_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=70&auto=format&fit=crop',
};

// [ajuste: definir canal de contato real]
const CONTATO_URL = 'mailto:contato@actus.fit';

type Step = {
  num: string;
  title: string;
  detail: string;
};

const STEPS: readonly Step[] = [
  { num: '01', title: 'Você fala com a equipe', detail: 'WhatsApp ou e-mail — leva minutos' },
  { num: '02', title: 'Validamos seu CREF/CRN', detail: 'Registro profissional ativo' },
  { num: '03', title: 'Acesso liberado', detail: 'E-mail e senha provisória na sua caixa' },
] as const;

// Linha de passo com entrada própria (stagger orquestrado pelo pai via delay).
function StepRow({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.screenMs }));
    translateY.value = withDelay(delay, withTiming(0, { duration: motion.screenMs }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.step, !isLast && styles.stepDivider, style]}>
      <AppText variant="metaSmall" color="neon" style={styles.stepNum}>
        {step.num}
      </AppText>
      <View style={styles.stepBody}>
        <AppText variant="h3" style={styles.stepTitle}>
          {step.title}
        </AppText>
        <AppText variant="bodySm" color="tertiary" style={styles.stepDetail}>
          {step.detail}
        </AppText>
      </View>
    </Animated.View>
  );
}

export default function ProfessorInfoScreen() {
  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PROFESSOR_PHOTO}
        eyebrow="Acesso de professor"
        title={'Credenciamento\nActus'}
        titleSize={30}
        onBack={() => router.back()}
      />

      <View style={styles.body}>
        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <StepRow
              key={step.num}
              step={step}
              index={index}
              isLast={index === STEPS.length - 1}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            variant="primary"
            label="Entrar com meus dados"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            variant="secondary"
            label="Falar com a equipe Actus"
            onPress={() => {
              void Linking.openURL(CONTATO_URL);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  steps: {
    alignSelf: 'stretch',
  },
  step: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  stepNum: {
    fontSize: 13,
    lineHeight: 24,
  },
  stepBody: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  stepDetail: {
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
}));
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any.

- [ ] **Step 3: Checkpoint visual**

Hero com foto + título CREDENCIAMENTO ACTUS (2 linhas) + caret de voltar no canto (volta para escolha-perfil). Passos numerados com stagger ao entrar. CTAs no rodapé.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/professor-info.tsx
git commit -m "feat(professor-info): faixa-hero editorial"
```

---

## Task 4: Troca de senha com hero

**Files:**
- Modify: `app/(auth)/trocar-senha.tsx`

**Motion única** = entrada do hero (substitui o reveal de conteúdo). **Preservar** `TrocarSenhaFormSchema`, `useChangePasswordMutation`, `FormErrorBanner` (de `@/components/molecules`), roteamento por `ApiError.code`, o requisito `✓ 8+ caracteres`, o gate `Stack.Screen gestureEnabled:false`, `onSubmit`.

- [ ] **Step 1: Reescrever o arquivo**

Replace o conteúdo de `app/(auth)/trocar-senha.tsx` por:

```tsx
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Input, Button, ScreenHero } from '@/components/ui';
import { FormErrorBanner } from '@/components/molecules';
import { useChangePasswordMutation } from '@/features/auth/hooks';
import { isApiError } from '@/api/errors';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const TROCA_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1080&q=70&auto=format&fit=crop',
};

// Tamanho mínimo da nova senha — espelha ChangePasswordBodySchema (new_password >= 8).
const MIN_NEW_PASSWORD = 8;

// Form local: além dos campos da API, há "confirmar" (validação 100% local).
const TrocarSenhaFormSchema = z
  .object({
    current_password: z.string().min(1, 'Informe a senha provisória.'),
    new_password: z
      .string()
      .min(MIN_NEW_PASSWORD, 'A nova senha precisa de ao menos 8 caracteres.'),
    confirm_password: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'As senhas não conferem.',
  });

type TrocarSenhaForm = z.infer<typeof TrocarSenhaFormSchema>;

export default function TrocarSenhaScreen() {
  const mutation = useChangePasswordMutation();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TrocarSenhaForm>({
    resolver: zodResolver(TrocarSenhaFormSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
    mode: 'onSubmit',
  });

  // ÚNICA animação da tela: entrada do hero (opacity 0→1 + translateY -16→0, 300ms).
  const heroReveal = useSharedValue(0);
  useEffect(() => {
    heroReveal.value = withTiming(1, { duration: motion.screenMs });
  }, [heroReveal]);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroReveal.value,
    transform: [{ translateY: (1 - heroReveal.value) * -16 }],
  }));

  const newPassword = watch('new_password');
  const meetsLength = newPassword.length >= MIN_NEW_PASSWORD;

  // Branch SEMPRE pelo ApiError.code (campo "error" do backend), NUNCA pelo HTTP status.
  const apiCode = isApiError(mutation.error) ? mutation.error.code : null;
  const currentPasswordApiError =
    apiCode === 'invalid_credentials' ? 'A senha atual não confere.' : undefined;
  const newPasswordApiError =
    apiCode === 'invalid_body'
      ? 'A nova senha precisa de ao menos 8 caracteres.'
      : undefined;
  const bannerMessage =
    mutation.isError && apiCode !== 'invalid_credentials' && apiCode !== 'invalid_body'
      ? 'Não foi possível alterar a senha. Tente de novo.'
      : null;

  function onSubmit(values: TrocarSenhaForm) {
    mutation.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
      },
      {
        onSuccess: () => {
          router.replace('/');
        },
      },
    );
  }

  return (
    <View style={styles.root}>
      {/* Gate: sem voltar (sem botão e sem gesture). Só sai trocando a senha. */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <Animated.View style={heroStyle}>
        <ScreenHero
          photo={TROCA_PHOTO}
          eyebrow="Primeiro acesso"
          title={'Defina sua\nsenha'}
          titleSize={30}
        />
      </Animated.View>

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
          <AppText variant="bodyMd" color="secondary" style={styles.intro}>
            Sua senha provisória expira agora.
          </AppText>

          {bannerMessage ? <FormErrorBanner message={bannerMessage} /> : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="current_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha provisória"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="next"
                  accessibilityLabel="Senha provisória"
                  error={errors.current_password?.message ?? currentPasswordApiError}
                />
              )}
            />

            <View style={styles.field}>
              <Controller
                control={control}
                name="new_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nova senha"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureToggle
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    accessibilityLabel="Nova senha"
                    error={errors.new_password?.message ?? newPasswordApiError}
                  />
                )}
              />
              {meetsLength ? (
                <AppText variant="metaSmall" color="neon" uppercase style={styles.hint}>
                  ✓ 8+ caracteres
                </AppText>
              ) : null}
            </View>

            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar nova senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  accessibilityLabel="Confirmar nova senha"
                  error={errors.confirm_password?.message}
                />
              )}
            />
          </View>

          <View style={styles.footer}>
            <Button
              variant="primary"
              label="Salvar e entrar"
              loading={mutation.isPending}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  intro: {
    marginBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.lg,
  },
  field: {
    alignSelf: 'stretch',
  },
  hint: {
    marginTop: theme.spacing.xs,
    marginLeft: 2,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any.

- [ ] **Step 3: Checkpoint visual**

Hero PRIMEIRO ACESSO / DEFINA SUA SENHA (sem voltar — é gate). Campos + requisito `✓ 8+ caracteres` aparece ao atingir 8. Teclado não encobre. `invalid_credentials` → erro no campo "senha provisória".

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/trocar-senha.tsx
git commit -m "feat(trocar-senha): faixa-hero editorial"
```

---

## Task 5: Enxugar o `_layout.tsx` do wizard

**Files:**
- Modify: `app/(auth)/cadastro/_layout.tsx`

O hero (com foto/título/voltar) e a barra de progresso passam para **dentro de cada passo** (Tasks 6–8), para deslizarem juntos com o slide do `Stack` (a motion do wizard). O layout fica só com `FormProvider` + injeção do `invite_code` + `Stack`. **Preservar** `useForm`/`CadastroFormSchema`/`cadastroDefaultValues` e o efeito que injeta `invite_code` do deep link.

> Nota de transição: após esta task e antes das Tasks 6–8, os passos ainda renderizam seu eyebrow/título antigos e ficam sem barra de progresso/voltar. É um estado intermediário funcional (typecheck/lint passam). As Tasks 6–8 fecham isso.

- [ ] **Step 1: Reescrever o arquivo**

Replace o conteúdo de `app/(auth)/cadastro/_layout.tsx` por:

```tsx
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { View } from 'react-native';

import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import {
  CadastroFormSchema,
  cadastroDefaultValues,
  type CadastroForm,
} from '@/features/auth/cadastroForm';

// Layout do wizard de cadastro:
// - FormProvider único: o estado dos 3 passos vive aqui (cada passo é uma rota
//   separada do Stack que lê/escreve via useFormContext).
// - Hero + barra de progresso + voltar vivem DENTRO de cada passo, para deslizarem
//   junto com o slide do Stack (a motion do wizard).
export default function CadastroLayout() {
  const inviteCode = useCadastroDraftStore((s) => s.inviteCode);

  const methods = useForm<CadastroForm>({
    resolver: zodResolver(CadastroFormSchema),
    defaultValues: cadastroDefaultValues,
    mode: 'onSubmit',
  });

  // invite_code vindo do deep link: injeta UMA vez ao montar o wizard.
  useEffect(() => {
    if (inviteCode) {
      methods.setValue('invite_code', inviteCode);
    }
    // Só na montagem inicial — não reescrever enquanto o usuário edita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormProvider {...methods}>
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            contentStyle: styles.content,
          }}
        />
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  content: {
    backgroundColor: theme.colors.bgBase,
  },
}));
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any. (Se o lint acusar imports não usados de passos antigos, eles serão resolvidos nas Tasks 6–8.)

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/cadastro/_layout.tsx
git commit -m "refactor(cadastro): layout so com FormProvider + Stack (hero migra p/ passos)"
```

---

## Task 6: Passo 1 (Convite) com hero compacto

**Files:**
- Modify: `app/(auth)/cadastro/passo-1-convite.tsx`

Hero compacto (`compact`) + `WizardProgress total={3} current={1}` no corpo + `onBack` que sai do wizard. Remove o eyebrow/título antigos (o hero assume) e o reveal de entrada (o slide do Stack é a motion). **Preservar** `useFormContext`, `useCadastroDraftStore`, `handleContinue`/`trigger(PASSO_1_FIELDS)`, o card MOCK do convidador, o `Input` do código e o `FormErrorBanner`.

- [ ] **Step 1: Reescrever o arquivo**

Replace o conteúdo de `app/(auth)/cadastro/passo-1-convite.tsx` por:

```tsx
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { FormErrorBanner, WizardProgress } from '@/components/molecules';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { authErrorMessage } from '@/features/auth/errors';
import { type CadastroForm, PASSO_1_FIELDS } from '@/features/auth/cadastroForm';

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO1_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&q=70&auto=format&fit=crop',
};

// [MOCK — sem endpoint na API v1: GET /invites/:code/preview]
// O nome de quem convidou não existe na API. Card exibido com dado falso até o endpoint existir.
const MOCK_INVITER = {
  initials: 'CM',
  name: 'Carlos Mendes',
  role: 'Personal Trainer · convidou você',
} as const;

export default function Passo1ConviteScreen() {
  const {
    control,
    trigger,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const inviteFromLink = useCadastroDraftStore((s) => s.inviteCode);
  const lastInviteError = useCadastroDraftStore((s) => s.lastInviteError);
  const setLastInviteError = useCadastroDraftStore((s) => s.setLastInviteError);

  const inviteError = lastInviteError ? authErrorMessage(lastInviteError) : null;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/escolha-perfil');
    }
  }

  async function handleContinue() {
    const ok = await trigger([...PASSO_1_FIELDS]);
    if (ok) {
      router.push('/(auth)/cadastro/passo-2-voce');
    }
  }

  const fieldErrorMessage = errors.invite_code?.message;

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PASSO1_PHOTO}
        eyebrow="Passo 01 / Convite"
        title="Seu convite"
        titleSize={28}
        compact
        onBack={handleBack}
      />

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
          <View style={styles.progress}>
            <WizardProgress total={3} current={1} />
          </View>

          {inviteError ? (
            <View style={styles.banner}>
              <FormErrorBanner message={inviteError} />
            </View>
          ) : null}

          {/* Card do convidador — dado MOCK (ver comentário no topo). */}
          <View style={styles.inviterCard}>
            <View style={styles.avatar}>
              <AppText variant="h3" color="neon">
                {MOCK_INVITER.initials}
              </AppText>
            </View>
            <View style={styles.inviterInfo}>
              <AppText variant="h3" style={styles.inviterName}>
                {MOCK_INVITER.name}
              </AppText>
              <AppText variant="bodySm" color="tertiary">
                {MOCK_INVITER.role}
              </AppText>
            </View>
          </View>

          {__DEV__ ? (
            <View style={styles.mockBadge}>
              <AppText variant="metaSmall" style={styles.mockText}>
                Demonstração — dado mock
              </AppText>
            </View>
          ) : null}

          <View style={styles.field}>
            <Controller
              control={control}
              name="invite_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Código do convite"
                  value={value}
                  onChangeText={(text) => {
                    // Editar o campo limpa o erro de convite vindo da rede.
                    if (lastInviteError) setLastInviteError(null);
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  returnKeyType="next"
                  onSubmitEditing={handleContinue}
                  accessibilityLabel="Código do convite"
                  style={styles.codeInput}
                  error={fieldErrorMessage}
                />
              )}
            />
          </View>

          {inviteFromLink ? (
            <AppText variant="metaSmall" color="tertiary" style={styles.fromLink}>
              ✓ Código recebido pelo link
            </AppText>
          ) : null}

          <AppText variant="bodySm" color="tertiary" style={styles.helper}>
            O vínculo com seu personal é confirmado ao criar a conta.
          </AppText>

          <View style={styles.cta}>
            <Button variant="primary" label="Usar meu convite" onPress={handleContinue} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  progress: {
    marginBottom: theme.spacing.xl,
  },
  banner: {
    marginBottom: theme.spacing.lg,
  },
  inviterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviterInfo: {
    flex: 1,
    gap: 2,
  },
  inviterName: {
    fontSize: 15,
  },
  mockBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.tag,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  mockText: {
    fontSize: 8,
    letterSpacing: 1.6,
    color: theme.colors.warning,
  },
  field: {
    alignSelf: 'stretch',
  },
  codeInput: {
    fontFamily: theme.fontFamily.mono,
    letterSpacing: 1,
  },
  fromLink: {
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
  },
  helper: {
    marginTop: theme.spacing.md,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any.

- [ ] **Step 3: Checkpoint visual**

Hero compacto PASSO 01 / CONVITE + SEU CONVITE + caret de voltar (sai do wizard). Barra de progresso (1/3) abaixo do hero. Card MOCK + selo Demonstração + input mono do código + "✓ Código recebido pelo link" (se deep link). Teclado não encobre.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/cadastro/passo-1-convite.tsx
git commit -m "feat(cadastro): passo 1 com hero compacto + progresso"
```

---

## Task 7: Passo 2 (Você) com hero compacto

**Files:**
- Modify: `app/(auth)/cadastro/passo-2-voce.tsx`

Hero compacto (foto distinta) + `WizardProgress total={3} current={2}` + `onBack={() => router.back()}`. **Preservar**: `useFormContext`, o efeito que aplica `lastCpfError` ao remontar, `handleContinue`/`trigger(PASSO_2_FIELDS)` e os campos `FormField`/`DateField`/`GenderChips`/`MaskedField` (datetimepicker e formatação de data com componentes locais ficam intactos). Título real preservado: "Quem treina".

- [ ] **Step 1: Reescrever o arquivo**

Replace o conteúdo de `app/(auth)/cadastro/passo-2-voce.tsx` por:

```tsx
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Button, ScreenHero } from '@/components/ui';
import {
  DateField,
  FormField,
  GenderChips,
  MaskedField,
  WizardProgress,
} from '@/components/molecules';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { type CadastroForm, PASSO_2_FIELDS } from '@/features/auth/cadastroForm';
import type { Gender } from '@/types/auth';

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO2_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1080&q=70&auto=format&fit=crop',
};

export default function Passo2VoceScreen() {
  const {
    control,
    trigger,
    setError,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const lastCpfError = useCadastroDraftStore((s) => s.lastCpfError);
  const setLastCpfError = useCadastroDraftStore((s) => s.setLastCpfError);

  // Erro de CPF já-em-uso vindo do register (passo 3): aplica ao remontar este passo.
  useEffect(() => {
    if (lastCpfError) {
      setError('cpf', { message: lastCpfError });
      setLastCpfError(null);
    }
  }, [lastCpfError, setError, setLastCpfError]);

  async function handleContinue() {
    const ok = await trigger([...PASSO_2_FIELDS]);
    if (ok) {
      router.push('/(auth)/cadastro/passo-3-acesso');
    }
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PASSO2_PHOTO}
        eyebrow="Passo 02 / Você"
        title="Quem treina"
        titleSize={28}
        compact
        onBack={() => router.back()}
      />

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
          <View style={styles.progress}>
            <WizardProgress total={3} current={2} />
          </View>

          <View style={styles.form}>
            <FormField
              control={control}
              name="full_name"
              label="Nome completo"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              error={errors.full_name?.message}
            />

            <Controller
              control={control}
              name="birth_date"
              render={({ field: { onChange, value } }) => (
                <DateField
                  label="Nascimento"
                  value={value === '' ? null : value}
                  onChange={onChange}
                  error={errors.birth_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <GenderChips
                  label="Gênero · opcional"
                  value={value === '' || value === undefined ? undefined : value}
                  onChange={(g: Gender) => onChange(g)}
                />
              )}
            />

            <Controller
              control={control}
              name="cpf"
              render={({ field: { onChange, value } }) => (
                <MaskedField
                  label="CPF · opcional"
                  mask="cpf"
                  value={value}
                  onChangeText={(digits) => {
                    if (lastCpfError) setLastCpfError(null);
                    onChange(digits);
                  }}
                  returnKeyType="done"
                  error={errors.cpf?.message}
                />
              )}
            />
          </View>

          <View style={styles.cta}>
            <Button variant="primary" label="Continuar" onPress={handleContinue} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  progress: {
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.lg,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any.

- [ ] **Step 3: Checkpoint visual**

Hero compacto PASSO 02 / VOCÊ + QUEM TREINA + voltar (volta ao passo 1). Progresso 2/3. **O form respira** — nome, nascimento, gênero (chips), CPF visíveis sem aperto; teclado não encobre; o picker de data abre.

- [ ] **Step 4: Caso de teste do bug de fuso (manual)**

Selecionar 01/01/2000 no picker → o valor formatado/enviado deve ser `"2000-01-01"` (componentes locais), nunca `"1999-12-31"`. Confirmar que a lógica de data **não** foi tocada.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/cadastro/passo-2-voce.tsx
git commit -m "feat(cadastro): passo 2 com hero compacto + progresso"
```

---

## Task 8: Passo 3 (Acesso) com hero compacto

**Files:**
- Modify: `app/(auth)/cadastro/passo-3-acesso.tsx`

Mesmo padrão. **Preservar** os campos email/telefone/senha, o `POST /auth/register` (mutation existente), o roteamento de erros do register entre passos (`invalid_invite*` → passo 1, `email_already_in_use` → campo email, etc.) e o `FormErrorBanner` form-level. Só a moldura visual muda.

- [ ] **Step 1: Reescrever o arquivo**

Replace o conteúdo de `app/(auth)/cadastro/passo-3-acesso.tsx` por:

```tsx
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { FormErrorBanner, MaskedField, WizardProgress } from '@/components/molecules';
import { useRegisterMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { isApiError } from '@/api/errors';
import {
  buildRegisterBody,
  routeRegisterError,
  type CadastroForm,
} from '@/features/auth/cadastroForm';

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO3_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1080&q=70&auto=format&fit=crop',
};

export default function Passo3AcessoScreen() {
  const {
    control,
    getValues,
    setError,
    formState: { errors },
  } = useFormContext<CadastroForm>();

  const clearDraft = useCadastroDraftStore((s) => s.clear);
  const setLastInviteError = useCadastroDraftStore((s) => s.setLastInviteError);
  const setLastCpfError = useCadastroDraftStore((s) => s.setLastCpfError);

  const mutation = useRegisterMutation();

  // Banner form-level (erro genérico/rede); o e-mail já-em-uso oferece link "Entrar".
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  function handleApiError(err: unknown) {
    if (!isApiError(err)) {
      setFormError(authErrorMessage('unknown'));
      return;
    }

    const route = routeRegisterError(err.code, err.extras);

    // Passo 1 — convite inválido: grava o erro no draft store e volta ao passo 1.
    if (route.passo === 1) {
      setLastInviteError(err.code);
      router.dismissTo('/(auth)/cadastro/passo-1-convite');
      return;
    }

    // Passo 2 — CPF já em uso: guarda a mensagem e volta ao passo 2 (que aplica ao montar).
    if (route.passo === 2) {
      setLastCpfError(route.fieldMessage ?? authErrorMessage(err.code));
      router.dismissTo('/(auth)/cadastro/passo-2-voce');
      return;
    }

    // Passo 3 — fica aqui.
    if (route.formLevel) {
      setFormError(authErrorMessage(err.code));
      return;
    }

    if (route.campo) {
      const message = route.fieldMessage ?? authErrorMessage(err.code);
      setError(route.campo, { message });
      if (route.campo === 'email' && err.code === 'email_already_in_use') {
        setEmailTaken(true);
      }
    } else {
      setFormError(authErrorMessage(err.code));
    }
  }

  function handleCreate() {
    setFormError(null);
    setEmailTaken(false);

    const values = getValues();

    // Confirmação de senha: bloqueia o envio se não conferir (passo 3 não roda zod).
    if (values.password !== values.confirm_password) {
      setError('confirm_password', { message: 'As senhas não conferem.' });
      return;
    }

    const body = buildRegisterBody(values);
    mutation.mutate(body, {
      onSuccess: () => {
        // O store já fez tokens → /me → status; o index.tsx despacha por tipo.
        clearDraft();
        router.replace('/');
      },
      onError: handleApiError,
    });
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PASSO3_PHOTO}
        eyebrow="Passo 03 / Acesso"
        title="Seu acesso"
        titleSize={28}
        compact
        onBack={() => router.back()}
      />

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
          <View style={styles.progress}>
            <WizardProgress total={3} current={3} />
          </View>

          {formError ? (
            <View style={styles.banner}>
              <FormErrorBanner message={formError} />
            </View>
          ) : null}

          {emailTaken ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Já tenho conta, entrar"
              hitSlop={8}
              onPress={() => router.replace('/(auth)/login')}
              style={styles.entrarRow}
            >
              <AppText variant="bodySm" color="secondary">
                Já tem conta?{' '}
                <AppText variant="bodySm" color="neon" style={styles.entrarLink}>
                  Entrar
                </AppText>
              </AppText>
            </Pressable>
          ) : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail"
                  value={value}
                  onChangeText={(text) => {
                    if (emailTaken) setEmailTaken(false);
                    onChange(text);
                  }}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  accessibilityLabel="E-mail"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <MaskedField
                  label="Telefone · opcional"
                  mask="phone"
                  value={value}
                  onChangeText={onChange}
                  returnKeyType="next"
                  error={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleCreate}
                  accessibilityLabel="Senha"
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          <AppText variant="bodySm" color="tertiary" style={styles.helper}>
            Ao criar a conta você concorda com os termos de uso e a política de
            privacidade do Actus.
          </AppText>

          <View style={styles.cta}>
            <Button
              variant="primary"
              label="Criar conta"
              loading={mutation.isPending}
              onPress={handleCreate}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  progress: {
    marginBottom: theme.spacing.xl,
  },
  banner: {
    marginBottom: theme.spacing.md,
  },
  entrarRow: {
    marginBottom: theme.spacing.lg,
  },
  entrarLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
  form: {
    gap: theme.spacing.lg,
  },
  helper: {
    marginTop: theme.spacing.lg,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: theme.spacing.xl,
  },
}));
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any.

- [ ] **Step 3: Checkpoint visual**

Hero compacto PASSO 03 / ACESSO + SEU ACESSO + voltar. Progresso 3/3. Campos email/telefone/senha; teclado não encobre. Botão "Criar conta". Link "Entrar" aparece quando o e-mail já existe.

- [ ] **Step 4: Caso de teste de roteamento de erro (manual, contra API real)**

Forçar `email_already_in_use` no register → erro deve cair no campo email no passo 3 (não navegar para passo 1). Forçar `invalid_invite`/`invite_expired` → deve voltar ao passo 1 com a copy do código. Confirmar que essa lógica **não** foi alterada.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/cadastro/passo-3-acesso.tsx
git commit -m "feat(cadastro): passo 3 com hero compacto + progresso"
```

---

## Task 9: Verificação final do bloco

**Files:** nenhum (verificação).

- [ ] **Step 1: Typecheck + lint + doctor**

Run: `npm run typecheck` → zero erro.
Run: `npm run lint` → zero erro/any.
Run: `npx expo-doctor` → limpo (ou só avisos pré-existentes não relacionados).

- [ ] **Step 2: Varredura de tokens**

Confirmar que nenhum hex foi hardcodado nas telas/átomo tocados (tudo via `theme`/`darkTheme`). Exceção permitida: as `uri` de placeholder Unsplash (marcadas `[ASSET TEMPORÁRIO]`).

- [ ] **Step 3: Sweep visual final no dev build**

Percorrer escolha-perfil → login → professor → troca de senha → wizard (1, 2, 3): a faixa-hero é coerente entre telas; cada tela tem **exatamente um** momento de motion; fotos distintas no wizard; nada de sombra fora de modal/sheet/dropdown.

- [ ] **Step 4: Salvar na branch pessoal**

Usar o comando `/salvar` (push na `branch/davi`) — não fazer merge na dev (isso é decisão do designer após validar tudo, e coordenar com a sessão que finaliza o contrato).

---

## Notas de execução

- **Não tocar** em `src/api/`, `src/store/`, `src/features/auth/hooks`, `errors`, schemas Zod ou qualquer lógica de mutation/roteamento — é território da sessão paralela. Em conflito de merge num arquivo de tela, preservar a lógica e remontar só a camada visual.
- Quando Davi entregar as 6 fotos curadas: trocar cada `const *_PHOTO = { uri: ... }` por `require('../../assets/images/<arquivo>.png')` (ou `../../../` no wizard) e remover o marcador `[ASSET TEMPORÁRIO]`.
- `WizardProgress` é consumido com `total`/`current` (já usado hoje no `_layout`); apenas muda o local de renderização (passos, não layout).
```
