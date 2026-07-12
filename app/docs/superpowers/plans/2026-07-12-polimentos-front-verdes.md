# Polimentos de front (itens verdes) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar os dois polimentos de front realmente mecânicos e com dado já disponível: data de início no atribuir-dieta, e a tag "Foco" (grupo muscular) na lista de treinos do profissional.

**Architecture:** Mudanças pontuais em 2 telas existentes, reusando componentes e dados que já existem. Sem novo endpoint, sem novo dado.

**Tech Stack:** React Native 0.83 bare · React Navigation 7 (shim `@/navigation`) · Unistyles 3 · TanStack Query v5 · Zod. Verificação: `npm run typecheck`, `npm run lint`, `npm test`, e visual no emulador/device (RN — não há preview no navegador).

**Escopo:** Só os itens 🟢 confirmados mecânicos. Os itens **#2 (ranking na Home), #3 (atalho de sessão na tela de exercício) e #4 (badge na TabBar)** ficam FORA — cada um exige uma decisão de produto/dado (ver seção final) e não são polimento trivial.

**Regras do projeto que valem em toda task:** datas sempre com `formatDateLocal` (nunca `toISOString` — bug UTC-3); cores só via tokens do tema; ícones Phosphor duotone; branch de trabalho `branch/davi`.

---

### Task 1: Data de início no atribuir-dieta

Hoje `atribuir-dieta.tsx` chumba `start_date = hoje`. O `atribuir-treino.tsx` já tem um seletor (`DateField`) — esta task espelha esse padrão para o nutri poder escolher quando a dieta começa.

**Files:**
- Modify: `app/src/screens/shared/atribuir-dieta.tsx`
- Reference (padrão a copiar): `app/src/screens/shared/atribuir-treino.tsx` (import `DateField` de `@/components/molecules`; estado `startDate`; uso do `<DateField>` por volta da linha 355; envio `start_date: startDate`)

- [ ] **Step 1: Importar o DateField**

No topo de `atribuir-dieta.tsx`, junto dos outros imports de componentes, adicionar:

```tsx
import { DateField } from '@/components/molecules';
```

- [ ] **Step 2: Estado do startDate (default = hoje local)**

Logo após `const assign = useAssignDiet();` (por volta da linha 90), adicionar o estado, com o mesmo default local usado hoje no envio:

```tsx
const [startDate, setStartDate] = useState<string | null>(formatDateLocal(new Date()));
```

(`formatDateLocal` e `useState` já estão importados neste arquivo.)

- [ ] **Step 3: Habilitar "Atribuir" só com data escolhida**

Trocar a linha do `canAssign` (linha ~147) para exigir também a data:

```tsx
const canAssign = Boolean(studentId) && templateId !== null && startDate !== null;
```

- [ ] **Step 4: Enviar a data escolhida (não mais `new Date()`)**

Em `handleAssign` (linha ~149), trocar o guard e o corpo do mutate:

```tsx
function handleAssign() {
  if (!studentId || !templateId || !startDate) return;
  setError(undefined);
  assign.mutate(
    {
      studentId,
      body: {
        diet_template_id: templateId,
        // start_date escolhido no DateField (ISO local, nunca toISOString → fuso UTC-3).
        start_date: startDate,
      },
    },
    {
      onSuccess: () => handleBack(),
      onError: (err) => setError(apiErrorMessage(err)),
    },
  );
}
```

- [ ] **Step 5: Renderizar o DateField**

No JSX, logo depois do bloco de seleção de template (a lista de dietas) e imediatamente ANTES do `<Button ... loading={assign.isPending}>` (linha ~247), inserir o seletor, copiando o padrão exato do `atribuir-treino.tsx` (linhas ~350-360):

```tsx
<AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
  Início
</AppText>
<DateField value={startDate} onChange={setStartDate} />
```

> Confirmar no `atribuir-treino.tsx` o nome exato da prop de callback do `DateField` (`onChange` vs `onChangeDate`) e copiar idêntico — não inventar a assinatura.

- [ ] **Step 6: Verificar tipos e lint**

Run: `cd app && npm run typecheck && npm run lint`
Expected: sem erros novos.

- [ ] **Step 7: Verificar no emulador**

Abrir Atribuir dieta (nutri → aluno → atribuir), confirmar: campo de data aparece com hoje pré-preenchido, dá pra trocar a data, e "Atribuir" só habilita com template + data. Atribuir e confirmar que a dieta é criada com a data escolhida.

- [ ] **Step 8: Commit**

```bash
git add app/src/screens/shared/atribuir-dieta.tsx
git commit -m "feat(app): data de inicio selecionavel no atribuir-dieta"
```

---

### Task 2: Tag "Foco" (grupo muscular) na lista de treinos do pro

O item da lista de treinos do profissional (`ProWorkoutsResponseSchema`) já traz `muscle_groups: string` (ex.: "Peito e Tríceps"), mas o `ProWorkoutCard` não o mostra. Esta task renderiza o foco no card.

**Files:**
- Modify: `app/src/screens/personal/tabs/treinos.tsx` (função `ProWorkoutCard`, linhas ~43-71)

- [ ] **Step 1: Ler o muscle_groups no card**

No início de `ProWorkoutCard` (após `const notes = workout.notes?.trim();`, linha 44), derivar o foco:

```tsx
const foco = workout.muscle_groups?.trim();
```

- [ ] **Step 2: Renderizar a linha de foco**

No `styles.cardText`, entre o nome (`<AppText variant="h3">`) e a linha de notas, inserir a linha de foco (só quando houver). Fica:

```tsx
<View style={styles.cardText}>
  <AppText variant="h3" numberOfLines={1}>
    {workout.name}
  </AppText>
  {foco && foco.length > 0 ? (
    <AppText variant="metaSmall" color="neon" numberOfLines={1}>
      {`Foco · ${foco}`}
    </AppText>
  ) : null}
  {notes && notes.length > 0 ? (
    <AppText variant="bodySm" color="secondary" numberOfLines={1}>
      {notes}
    </AppText>
  ) : null}
  <AppText variant="metaSmall" color="tertiary">
    {exerciseLabel(workout.exercise_count)}
  </AppText>
</View>
```

> `color="neon"` para o foco dar um respiro visual sem virar hierarquia demais; se o `AppText` não aceitar `neon` como cor de variante, usar `color="secondary"`. Confirmar as cores válidas de `AppText` antes.

- [ ] **Step 3: Verificar tipos e lint**

Run: `cd app && npm run typecheck && npm run lint`
Expected: sem erros novos. Se o TS reclamar que `muscle_groups` não existe no tipo do `workout`, confirmar que `CardProps.workout` é o item de `ProWorkoutsResponseSchema` (que tem `muscle_groups`) e ajustar o tipo se estiver frouxo.

- [ ] **Step 4: Verificar no emulador**

Aba TREINOS do personal → cada card mostra "Foco · [grupos]" abaixo do nome, para treinos que têm grupo muscular; treinos sem grupo não mostram a linha (sem quebra).

- [ ] **Step 5: Commit**

```bash
git add app/src/screens/personal/tabs/treinos.tsx
git commit -m "feat(app): tag de foco muscular na lista de treinos do pro"
```

---

## Fora deste plano — precisam de decisão antes de virar task

Estes três foram levantados como "polimento" mas cada um esconde uma escolha; não entram como task até resolver:

- **#2 Ranking no ChallengeCard da Home.** O `ChallengeTeaser`/`useChallenges` **não** carrega posição — o ranking vem de um endpoint separado (`GET /me/challenges/:id/ranking`) que pode dar 403 (ranking privado). Mostrar "3º de 12" na Home exige um fetch extra + tratar privado/erro. **Decisão:** vale o fetch extra na Home, ou o ranking fica só na aba Desafios (onde já aparece)? Recomendo deixar só na aba Desafios (baixo valor de repetir na Home).
- **#3 Atalho "iniciar sessão" na tela de exercício.** Iniciar sessão precisa do `student_workout_id` (via `useCreateSession`). A tela `exercicio/[id]` pode ser aberta de um treino (tem contexto) ou do catálogo (não tem). **Decisão/checagem:** confirmar os params que `exercicio/[id]` recebe; só faz sentido mostrar o atalho quando vier de um treino. Precisa ler os params antes de planejar.
- **#4 Badge de pendência no ícone HOJE da TabBar.** O `ActusTabBar` hoje não tem badge, e o "sinal" não está definido. **Decisão:** o que o badge significa? Proposta: um ponto neon quando o treino de hoje ainda não foi concluído (reusa o `todayDone` que a Home já calcula). Se aprovado, vira task (com plumbing do badge no `ActusTabBar` + fonte do sinal no navigator).
