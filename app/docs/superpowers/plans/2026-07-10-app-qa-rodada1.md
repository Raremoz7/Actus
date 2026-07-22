# App — QA rodada 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans / subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Corrigir 10 bugs/polimentos do app nativo levantados no QA (TEC-84…TEC-88, TEC-90…TEC-94).

**Architecture:** Fixes pontuais em telas/componentes RN + extração de um `BottomSheet` base reutilizável (safe-area + teclado). Card de macros da dieta redesenhado. Verificação de itens Android-dependentes fica com o Davi no device.

**Tech Stack:** React Native (bare 0.83, Gradle), Expo Router, react-native-unistyles, reanimated, gesture-handler, react-query, zod, jest.

**Branch:** `branch/davi-bare-android`. Commits frequentes, mensagens `tipo(escopo): descricao` em pt sem acento.

---

## Lote A — fixes diretos

### Task 1: TEC-85 — Altura em cm
**Files:** Modify `src/screens/onboarding-aluno/corpo.tsx`

- [ ] Ler o arquivo; localizar input de altura (~87–94), validação (~49–52), save (~55).
- [ ] Label "Altura (m)" → "Altura (cm)"; placeholder `1,98` → `175`; `keyboardType` → `"number-pad"`.
- [ ] Validação: aceitar inteiro 100–250 (cm) em vez de 1,00–2,50 (m); ajustar parse (sem vírgula decimal).
- [ ] Save: `altura_cm` recebe o valor digitado direto (remover `* 100`).
- [ ] Verificar `npx tsc --noEmit` limpo. Commit: `fix(onboarding): altura em centimetros no passo Seu corpo (TEC-85)`.

### Task 2: TEC-86 — Título "Minhas refeições"
**Files:** Modify `src/screens/aluno/alimentacao.tsx:131`

- [ ] Trocar `<AppText variant="h2">O que comi</AppText>` → `Minhas refeições`.
- [ ] Commit: `fix(alimentacao): titulo do header para Minhas refeicoes (TEC-86)`.

### Task 3: TEC-91 — Alinhamento "Descanso (s)"
**Files:** Modify `src/components/builder/ExerciseFormSheet.tsx` (`NumberField` ~109–142)

- [ ] No label `eyebrow` do `NumberField`, adicionar `numberOfLines={1}` (e `adjustsFontSizeToFit` se precisar) para não quebrar.
- [ ] Se ainda desalinhar, dar altura fixa ao bloco do label ou alinhar `numCol` por baixo, garantindo os 3 inputs na mesma linha de base.
- [ ] Commit: `fix(builder): impede quebra do label Descanso e alinha campos (TEC-91)`.

---

## Lote B — BottomSheet base (TEC-90 + TEC-92)

### Task 4: Criar componente base
**Files:** Create `src/components/ui/BottomSheet.tsx`; Test `src/components/ui/BottomSheet.test.tsx` (se testável sem native)

- [ ] Ler `ExerciseFormSheet.tsx` e `AddParticipantsSheet.tsx` para extrair a estrutura comum (Modal + overlay + handle + Animated.View + estilos).
- [ ] Criar `BottomSheet` com props: `visible`, `onClose`, `children`, opcional `footer`. Internamente: `useSafeAreaInsets()` somando `insets.bottom` no padding inferior; `KeyboardAvoidingView` com `behavior` por plataforma que funcione no Android (testar `behavior="height"` no Android / `"padding"` no iOS).
- [ ] Commit: `feat(ui): componente BottomSheet base com safe-area e teclado (TEC-90/TEC-92)`.

### Task 5: Migrar ExerciseFormSheet
**Files:** Modify `src/components/builder/ExerciseFormSheet.tsx`

- [ ] Substituir a estrutura manual (Modal/Animated.View/KAV ~307) pelo `BottomSheet` base, preservando conteúdo (título, campos, botão salvar).
- [ ] Verificar teclado sobe o campo em foco (Android) — anotar como "validar no device".
- [ ] Commit: `refactor(builder): ExerciseFormSheet usa BottomSheet base (TEC-92)`.

### Task 6: Migrar AddParticipantsSheet
**Files:** Modify `src/components/challenges/AddParticipantsSheet.tsx`

- [ ] Substituir a estrutura manual pelo `BottomSheet` base; remover `paddingBottom` fixo.
- [ ] Botão "Adicionar" agora respeita `insets.bottom`.
- [ ] Commit: `fix(challenges): AddParticipantsSheet usa BottomSheet base (safe-area) (TEC-90)`.

---

## Lote C — card de macros

### Task 7: TEC-94 — Redesign do card
**Files:** Modify `src/screens/aluno/dieta/[id].tsx` (card ~121–152, estilos ~253–265). Opcional: Create `src/components/diet/DietMacroCard.tsx`

- [ ] Extrair (ou reescrever inline) o card no layout aprovado:
  - Bloco calorias no topo: eyebrow "Calorias" + "% da meta" à direita; valor grande neon + `/ meta kcal` apagado; barra ~4px.
  - Divisor hairline.
  - Linha de 3 macros (prot/carb/gord): label + `valor` branco + `/ meta g` apagado + barra ~3px.
- [ ] Preservar: sem `target` → só valor, sem barra; aviso "Totais parciais"; cálculo via `totalRows`.
- [ ] Verificar `tsc` limpo. Commit: `feat(dieta): redesign do card de macros (kcal destaque + 3 macros) (TEC-94)`.

---

## Lote D — código + validação no device

### Task 8: TEC-84 — Erro do cadastro
**Files:** Modify `src/features/auth/errors.ts`, `src/screens/auth/cadastro/index.tsx`. Test `src/features/auth/errors.test.ts` (se existir/couber)

- [ ] Ler `errors.ts`: garantir que `authErrorMessage` priorize a mensagem da API (campo de erro do response) e só use `FALLBACK_MESSAGE` quando não houver.
- [ ] Se houver mapeamento de status/códigos, cobrir os casos comuns (e-mail duplicado, validação).
- [ ] Anotar: root cause real precisa de log/response do device (Davi).
- [ ] Commit: `fix(auth): propaga mensagem real de erro no cadastro (TEC-84)`.

### Task 9: TEC-87 — Bounce do carrossel + botão
**Files:** Modify `src/components/exercises/HeroCarousel.tsx`, revisar `src/screens/aluno/exercicio/[id].tsx`

- [ ] Ler `HeroCarousel`: no gesto Pan/spring, clampar o `translateX` nas bordas para eliminar overscroll/bounce.
- [ ] Conferir botão "Buscar demonstração no YouTube": se `866374e` já resolveu quebra, nada a fazer; senão ajustar `videoBtnExtra`.
- [ ] Commit: `fix(exercicio): remove bounce do HeroCarousel (TEC-87)`.

### Task 10: TEC-88 — Verificar nav bar
**Files:** Review/Modify `src/screens/aluno/treino/[id].tsx`

- [ ] Confirmar que `insets.bottom` (commit `866374e`) cobre o caso; se persistir por edge-to-edge, garantir padding mínimo (`Math.max(insets.bottom, spacing.md)`).
- [ ] Commit (se mudar): `fix(treino): garante padding minimo do CTA acima da nav bar (TEC-88)`.

### Task 11: TEC-93 — Autofill do login
**Files:** Modify `src/components/ui/Input.tsx`, `src/screens/auth/login.tsx`

- [ ] Garantir que `Input` repasse `importantForAutofill` ao `TextInput`; no login setar `importantForAutofill="yes"` e `autoComplete` específicos (`"username"`/`"current-password"`) nos campos.
- [ ] Anotar: validar prompt de salvar no device (build release).
- [ ] Commit: `fix(auth): melhora autofill dos campos de login (TEC-93)`.

---

## Verificação final
- [ ] `npx tsc --noEmit` limpo.
- [ ] `npm test` (jest) verde nos arquivos tocados.
- [ ] Lint dos arquivos alterados.
- [ ] Handoff device (Davi): TEC-84, TEC-87 bounce, TEC-88, TEC-92 teclado, TEC-93 autofill.
- [ ] Atualizar status das issues no Linear.
