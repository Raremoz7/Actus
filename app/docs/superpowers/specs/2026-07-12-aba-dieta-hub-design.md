# Aba DIETA + hub de nutrição (aluno) — design

Data: 2026-07-12 · Papel: aluno · Status: validado (mockups no companion)

## Problema

A Dieta é o único plano prescrito pelo profissional que não tem destino de navegação próprio: hoje vive como card na Home (`home/DietCard`, `home/AlimentacaoCard`) → `dieta/[id]` (dieta atribuída) e `alimentacao` (registro "o que comi"). O aluno definiu o registro alimentar como hábito diário — logar refeição precisa de acesso de primeira classe. Assimetria: TREINOS é aba, DIETA não.

## Decisão

Elevar a Dieta a uma **5ª aba** e criar uma **tela-hub** que junta plano prescrito + diário.

### Navegação

- Tab bar do aluno passa a: **HOJE · TREINOS · DIETA · DESAFIOS · PERFIL**.
- Rótulo `DIETA`, ícone Phosphor duotone garfo+faca (`ForkKnife`).
- Posição: entre TREINOS e DESAFIOS (os dois planos prescritos — treino e dieta — ficam adjacentes).
- Mudança em `src/navigation/*` (`ALUNO_TABS` + `AlunoTabs.Screen`): nova tab `dieta` apontando para a tela-hub. Nova screen em `src/screens/aluno/tabs/dieta.tsx`.
- 5 abas em ~375px ≈ 75px/aba — aceitável com rótulos condensados (Barlow Condensed uppercase, padrão da tab bar).

### Tela-hub — layout "Plano primeiro"

Composta de peças que já existem; nada duplicado. Ordem de cima para baixo:

1. **Header** — eyebrow "Nutrição" / `h2` "Dieta" (sem back — é aba raiz).
2. **Card do plano do dia** — reusar `DietMacroCard`: kcal alvo + macros (proteína/carbo/gordura), com crédito "por [nome do nutri]". Fonte: `useStudentDiet` / `useStudentDietDetail`. Estado vazio quando não há dieta atribuída (ver Estados).
3. **Próxima refeição** — chip neon com "Almoço · 12:30". Reusar a lógica `nextMealIndex`/`timeToMinutes` que já existe em `screens/aluno/dieta/[id].tsx` (extrair para `lib/diet.ts` se ainda estiver inline na tela).
4. **CTA "Registrar refeição"** — botão pill neon (primário). Abre o `MealFormSheet` (foto + descrição + tags) já usado em `alimentacao`. O envio passa pela fila offline `store/mealQueueStore` (mesmo caminho da tela de alimentação).
5. **Diário de hoje** — refeições logadas de hoje via `useMeals`, renderizadas com `components/meals/MealCard` (foto, horário, descrição, comentário do nutri quando houver). Filtrar o feed só para o dia atual (`eaten_at` local, usar `formatDateLocal` — nunca `toISOString`, regra de fuso UTC-3).
6. **Links de saída** — "Ver diário completo →" (`alimentacao`) e "Ver dieta completa do nutri →" (`dieta/[id]`).

### Realidade do dado (guiou o design)

O registro "o que comi" (`types/meals.ts` → `MealLog`) é **qualitativo**: `photo_url`, `description`, `tags`, `comments[]` (do profissional). **Não há kcal/macros por refeição.** Logo:

- O hub é "plano prescrito + diário de coaching", **não** um contador de calorias.
- Os números de macro/kcal do card do plano são sempre os **alvos** do nutri (da dieta atribuída), nunca "consumido vs meta".
- Não existe barra de progresso calórico — seria dado inventado.

## Estados

- **Sem dieta atribuída** — card do plano vira estado vazio ("Nenhuma dieta atribuída ainda"); próxima refeição some; CTA "Registrar refeição" e o diário continuam funcionando (o aluno pode logar mesmo sem plano).
- **Sem refeições hoje** — seção "Diário de hoje" mostra estado vazio ("Nada registrado hoje") com o CTA como ação óbvia.
- **Offline** — o registro entra na fila (`mealQueueStore`) e aparece como pendente no diário, igual à tela `alimentacao` atual.
- **Loading** — skeleton no card do plano e no diário (padrão das telas existentes).

## Fora de escopo

- Contador de calorias / soma nutricional do que foi comido (dado não existe).
- Edição da dieta pelo aluno (dieta é read-only para o aluno; edição é do nutri).
- Mexer na tela `dieta/[id]` ou `alimentacao` além de extrair helpers reusados.

## Impacto técnico

- Novo: `src/screens/aluno/tabs/dieta.tsx` (a tela-hub).
- Alterado: `src/navigation/*` (registro da 5ª aba + ícone).
- Reuso: `DietMacroCard`, `components/meals/MealCard`, `MealFormSheet`, `useStudentDiet(Detail)`, `useMeals`, `mealQueueStore`, helpers de `lib/diet.ts`/`lib/meals.ts`.
- Tokens do tema apenas; sem hex hardcoded. 1 momento de motion na tela (reveal do conteúdo, padrão das outras telas).
