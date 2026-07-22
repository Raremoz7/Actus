# App — QA rodada 1 (correções e polimentos)

**Data:** 2026-07-10
**Branch:** `branch/davi-bare-android`
**Linear:** [TEC-83](https://linear.app/actusfit/issue/TEC-83) (issue-mãe) + sub-issues TEC-84…TEC-94
**Escopo:** somente o app nativo (React Native / Expo bare + Gradle). PWA em stand by.

## Contexto

Rodada de QA no device levantou 11 observações. Este spec cobre as **10** que entram
agora. A TEC-89 (trocar o treino no "Editar treino" do professor) fica **fora do lote**:
exige mudança de backend (ver §Fora de escopo).

Pré-requisito de execução: o repo está com WIP de build não commitado
(babel/metro/package.json/App.tsx, sentry removido). Commitar esse WIP num commit
separado **antes** de começar os fixes, para não misturar.

Verificação: os itens que dependem de Android real (TEC-84, TEC-87, TEC-88, TEC-93)
são implementados por código e **validados no device pelo Davi**.

## Itens

### TEC-85 — Altura em centímetros
- **Arquivo:** `src/screens/onboarding-aluno/corpo.tsx` (`CorpoScreen`).
- Trocar label "Altura (m)" → "Altura (cm)", placeholder `1,98` → `175`,
  `keyboardType="decimal-pad"` → `"number-pad"`.
- Validação: faixa 1,00–2,50 m → 100–250 cm (inteiro).
- Conversão: hoje `altura_cm: Math.round(m * 100)` → salvar o valor direto (sem ×100).
- Mantém o mock `saveStudentAnswers` (backend ainda não tem o campo).

### TEC-86 — Título da tela de alimentação
- **Arquivo:** `src/screens/aluno/alimentacao.tsx` (~linha 131).
- Título `h2` "O que comi" → **"Minhas refeições"**. Eyebrow "Alimentação" mantém.

### TEC-90 + TEC-92 — BottomSheet base (safe-area + teclado)
- **Decisão:** extrair um componente base `src/components/ui/BottomSheet.tsx` (ou
  `src/components/ui/Sheet.tsx`) que encapsula: overlay + handle + `Animated.View`,
  `useSafeAreaInsets()` somando `insets.bottom` no padding inferior, e keyboard
  handling que funcione no **Android** (`KeyboardAvoidingView` com `behavior`
  adequado por plataforma, ou tratamento por altura do teclado).
- Migrar os dois sheets existentes para o base:
  - `src/components/builder/ExerciseFormSheet.tsx` (hoje: KAV só efetivo no iOS —
    `behavior` `undefined` no Android; linhas ~307–309).
  - `src/components/challenges/AddParticipantsSheet.tsx` (hoje: `paddingBottom` fixo
    `theme.spacing.xxl`, sem `useSafeAreaInsets()`, sem KAV).
- Resultado esperado: botão do rodapé acima da nav bar do Android em ambos; ao focar
  um input, o sheet sobe/ajusta e o campo fica visível acima do teclado.

### TEC-91 — Alinhamento "Descanso (s)" no ExerciseFormSheet
- **Arquivo:** `src/components/builder/ExerciseFormSheet.tsx`, sub-componente
  `NumberField` (~linhas 109–142) e `styles.numRow`/`numCol` (~722–729).
- O label `eyebrow` "Descanso (s)" quebra em 2 linhas e empurra o input da 3ª coluna.
- Fix: `numberOfLines={1}` no label (com ajuste de fonte se necessário) **e/ou**
  alinhar as colunas de forma que o input tenha posição fixa independente da altura
  do label (ex.: reservar altura do label ou alinhar por baixo).

### TEC-84 — Cadastro falha com erro genérico
- **Arquivos:** `src/screens/auth/cadastro/index.tsx` (`handleApiError` ~88–102) e
  `src/features/auth/errors.ts` (`authErrorMessage`/`FALLBACK_MESSAGE` ~14–19).
- Fix de código: garantir que a mensagem específica retornada pela API seja exibida
  quando existir, caindo no `FALLBACK_MESSAGE` só quando não houver mensagem.
- Root cause real (por que o cadastro falha) depende de reproduzir com o backend —
  Davi fornece log/response. Documentar o achado.

### TEC-87 — Carrossel: bounce + botão YouTube
- **Arquivos:** `src/screens/aluno/exercicio/[id].tsx` e
  `src/components/exercises/HeroCarousel.tsx`.
- Bounce: remover overscroll no `HeroCarousel` (clamp na `Gesture.Pan` /
  ajustar spring de paginação para não "esticar" além das bordas).
- Botão "Buscar demonstração no YouTube" (`videoBtnExtra` ~378–383): confirmar se o
  commit `866374e` (quebra de linha em botões) já resolveu; se não, ajustar para o
  texto caber.

### TEC-88 — Botão "Iniciar treino" atrás da nav bar
- **Arquivo:** `src/screens/aluno/treino/[id].tsx` (`ctaBar` ~148/214).
- A tela **já** usa `insets.bottom` (commit `866374e`). Verificar se resolveu;
  se o problema persistir por edge-to-edge, garantir um padding mínimo além do inset.

### TEC-93 — Login não oferece salvar credenciais
- **Arquivos:** `src/screens/auth/login.tsx` e `src/components/ui/Input.tsx`.
- Campos já têm `autoComplete`/`textContentType`. Fix de código: no Android, garantir
  `importantForAutofill="yes"` e `autoComplete` específicos (`"username"` /
  `"current-password"`) repassados pelo `Input` ao `TextInput`. Validar no device.

### TEC-94 — Redesign do card de macros da dieta
- **Arquivo:** `src/screens/aluno/dieta/[id].tsx` (card inline ~121–152, estilos
  `totbandExtra`/`totRow`/`tot`/`track`/`fill` ~253–265). Dados: `totalRows` (~81–86),
  `dietTotals`/`hasAnyMacro` de `src/lib/diet`.
- **Layout aprovado:**
  1. **Calorias em destaque no topo:** eyebrow "Calorias" + "% da meta" à direita;
     valor grande (neon) `2170` + `/ 2200 kcal` (apagado); barra grossa (~4px) full-width.
  2. **Divisor** hairline.
  3. **3 macros na linha** (prot / carb / gord): label eyebrow, `valor` (branco) +
     `/ meta g` (apagado), mini barra (~3px). Sem kcal na fileira → cada macro ganha espaço.
- Formatação: separar valor/meta com espaço e unidade; nunca colar números.
- Preservar comportamento atual: quando não há `target`, mostrar só o valor (sem barra);
  manter o aviso "Totais parciais". Considerar extrair para `DietMacroCard`.

## Fora de escopo (documentado)

### TEC-89 — Trocar o treino no "Editar treino" (professor)
Viável, **requer mudança de backend**:
- Backend `api/src/routes/studentWorkouts.ts`: `patchAssignWorkoutSchema` (~22–30) só
  aceita `weekdays`/`start_date`. Adicionar `workout_id` (opcional) ao schema e ao
  `UPDATE ... SET`, com a mesma validação de posse do POST (workout pertence ao personal).
  A coluna `student_workouts.workout_id` já existe.
- App `src/screens/shared/atribuir-treino.tsx`: liberar o seletor de template no modo
  edição (hoje read-only ~304) e incluir `workout_id` no PATCH (`useUpdateStudentWorkout`).
Fica como sub-projeto próprio (spec → plano) por ter camada de backend.

## Sequência sugerida
1. Commit do WIP de build (separado).
2. Lote A: TEC-85, TEC-86, TEC-91.
3. BottomSheet base → TEC-90 + TEC-92 (migra ExerciseFormSheet e AddParticipantsSheet).
4. TEC-94 (card; possível extração `DietMacroCard`).
5. Lote C (código + validação no device): TEC-84, TEC-87, TEC-88, TEC-93.
