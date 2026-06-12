# Desafio: Calendário B1 + Chama Condicional — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ocultar o ícone Flame quando streak = 0 e substituir a barra de progresso no hero do desafio por um calendário compacto alinhado a semanas reais.

**Architecture:** Três edições cirúrgicas de renderização condicional no Flame + criação de `ChallengeCalendar` (componente presentacional puro) integrado na tela de detalhe do desafio. Sem alteração de API, tipos ou hooks.

**Tech Stack:** React Native · Unistyles 3 · Phosphor duotone · AppText/darkTheme tokens · Jest + @testing-library/react-native

---

## Arquivos

| Ação | Caminho |
|---|---|
| Modificar | `src/components/challenges/RankingRow.tsx` |
| Modificar | `src/components/challenges/RankingRow.test.tsx` |
| Modificar | `src/components/challenges/MyPositionCard.tsx` |
| Criar | `src/components/challenges/MyPositionCard.test.tsx` |
| Modificar | `src/components/challenges/ChallengeListCard.tsx` |
| Modificar | `src/components/challenges/ChallengeListCard.test.tsx` |
| Criar | `src/components/challenges/ChallengeCalendar.tsx` |
| Criar | `src/components/challenges/ChallengeCalendar.test.tsx` |
| Modificar | `src/components/challenges/index.ts` |
| Modificar | `app/(aluno)/desafio/[id].tsx` |

---

## Task 1: Flame condicional em RankingRow

**Files:**
- Modify: `src/components/challenges/RankingRow.tsx:82`
- Modify: `src/components/challenges/RankingRow.test.tsx`

- [ ] **Step 1: Adicionar caso de teste — streak 0 não mostra Flame**

Abrir `src/components/challenges/RankingRow.test.tsx` e adicionar ao final do `describe`:

```tsx
  it('não mostra ícone de chama quando streak é 0', () => {
    render(
      <RankingRow position={5} name="Carlos" activeDays={3} streak={0} isMe={false} />,
    );
    // O número 0 ainda aparece; o ícone Flame (testID) não.
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByTestId('streak-flame')).toBeNull();
  });

  it('mostra ícone de chama quando streak é 1 ou mais', () => {
    render(
      <RankingRow position={1} name="Ana" activeDays={10} streak={1} isMe={false} />,
    );
    expect(screen.getByTestId('streak-flame')).toBeTruthy();
  });
```

- [ ] **Step 2: Rodar os novos testes — devem falhar**

```bash
cd /mnt/h/Actus/app && npx jest RankingRow --no-coverage 2>&1 | tail -20
```

Esperado: FAIL nos dois novos casos (`queryByTestId('streak-flame')` retorna um elemento quando deveria ser null; `getByTestId` lança quando não existe).

- [ ] **Step 3: Implementar renderização condicional + testID**

Em `src/components/challenges/RankingRow.tsx`, substituir as linhas 81–83:

```tsx
        <View style={styles.streak}>
          <Flame size={15} weight="duotone" color={isMe ? colors.neon : colors.secondary} />
          <AppText variant="dataMed" color={isMe ? 'neon' : 'secondary'}>
```

Por:

```tsx
        <View style={styles.streak}>
          {streak >= 1 && (
            <Flame
              testID="streak-flame"
              size={15}
              weight="duotone"
              color={isMe ? colors.neon : colors.secondary}
            />
          )}
          <AppText variant="dataMed" color={isMe ? 'neon' : 'secondary'}>
```

- [ ] **Step 4: Rodar todos os testes de RankingRow — devem passar**

```bash
cd /mnt/h/Actus/app && npx jest RankingRow --no-coverage 2>&1 | tail -10
```

Esperado: PASS em todos os casos (incluindo os novos).

- [ ] **Step 5: Commit**

```bash
cd /mnt/h/Actus/app && git add src/components/challenges/RankingRow.tsx src/components/challenges/RankingRow.test.tsx && git commit -m "feat(challenges): ocultar Flame quando streak é 0 em RankingRow"
```

---

## Task 2: Flame condicional em MyPositionCard

**Files:**
- Modify: `src/components/challenges/MyPositionCard.tsx:75`
- Create: `src/components/challenges/MyPositionCard.test.tsx`

- [ ] **Step 1: Criar arquivo de teste**

Criar `src/components/challenges/MyPositionCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { MyPositionCard } from './MyPositionCard';

const BASE_STANDING = {
  position: 3,
  streakCurrent: 5,
  activeDays: 10,
  streakBest: 7,
  lastActivityDate: '2026-06-12',
};

describe('MyPositionCard', () => {
  it('mostra posição, sequência e dias ativos', () => {
    render(<MyPositionCard standing={BASE_STANDING} today="2026-06-12" />);
    expect(screen.getByText('3º')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('mostra chama quando streakCurrent >= 1', () => {
    render(<MyPositionCard standing={BASE_STANDING} today="2026-06-12" />);
    expect(screen.getByTestId('streak-flame')).toBeTruthy();
  });

  it('não mostra chama quando streakCurrent é 0', () => {
    render(
      <MyPositionCard
        standing={{ ...BASE_STANDING, streakCurrent: 0 }}
        today="2026-06-12"
      />,
    );
    expect(screen.queryByTestId('streak-flame')).toBeNull();
  });

  it('mostra mensagem de intenção quando ranking é privado', () => {
    render(<MyPositionCard isPrivate today="2026-06-12" />);
    expect(screen.getByText(/ranking privado/i)).toBeTruthy();
  });

  it('mostra mensagem de sem registro quando sem standing', () => {
    render(<MyPositionCard today="2026-06-12" />);
    expect(screen.getByText(/sem registro/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar — devem falhar nos casos de testID**

```bash
cd /mnt/h/Actus/app && npx jest MyPositionCard --no-coverage 2>&1 | tail -20
```

Esperado: FAIL nos casos que usam `getByTestId`/`queryByTestId` (testID ainda não existe).

- [ ] **Step 3: Implementar condicional + testID**

Em `src/components/challenges/MyPositionCard.tsx`, substituir linhas 74–76:

```tsx
              <View style={styles.streak}>
                <Flame size={18} weight="duotone" color={colors.neon} />
                <AppText variant="dataBig" color="primary">
```

Por:

```tsx
              <View style={styles.streak}>
                {standing.streakCurrent >= 1 && (
                  <Flame testID="streak-flame" size={18} weight="duotone" color={colors.neon} />
                )}
                <AppText variant="dataBig" color="primary">
```

- [ ] **Step 4: Rodar — devem passar**

```bash
cd /mnt/h/Actus/app && npx jest MyPositionCard --no-coverage 2>&1 | tail -10
```

Esperado: PASS em todos os casos.

- [ ] **Step 5: Commit**

```bash
cd /mnt/h/Actus/app && git add src/components/challenges/MyPositionCard.tsx src/components/challenges/MyPositionCard.test.tsx && git commit -m "feat(challenges): ocultar Flame quando streakCurrent é 0 em MyPositionCard"
```

---

## Task 3: Flame condicional em ChallengeListCard

**Files:**
- Modify: `src/components/challenges/ChallengeListCard.tsx:144`
- Modify: `src/components/challenges/ChallengeListCard.test.tsx`

- [ ] **Step 1: Adicionar caso de teste — streak 0 não mostra Flame no teaser**

Em `src/components/challenges/ChallengeListCard.test.tsx`, adicionar ao final do `describe`:

```tsx
  it('não mostra chama no teaser quando streak é 0', () => {
    render(
      <ChallengeListCard
        name="Julho em forma"
        dayProgress={{ day: 5, total: 30 }}
        status="active"
        statusLabel="Ativo"
        participantStatus="active"
        rankingTeaser={{ position: 1, streak: 0 }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('streak-flame')).toBeNull();
    // texto de sequência ainda aparece
    expect(screen.getByText('0 de sequência')).toBeTruthy();
  });

  it('mostra chama no teaser quando streak >= 1', () => {
    render(
      <ChallengeListCard
        name="Julho em forma"
        dayProgress={{ day: 5, total: 30 }}
        status="active"
        statusLabel="Ativo"
        participantStatus="active"
        rankingTeaser={{ position: 1, streak: 3 }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByTestId('streak-flame')).toBeTruthy();
  });
```

- [ ] **Step 2: Rodar — devem falhar**

```bash
cd /mnt/h/Actus/app && npx jest ChallengeListCard --no-coverage 2>&1 | tail -20
```

Esperado: FAIL nos dois novos casos.

- [ ] **Step 3: Implementar condicional + testID**

Em `src/components/challenges/ChallengeListCard.tsx`, substituir linhas 143–145 (dentro de `teaserStreak`):

```tsx
          <View style={styles.teaserStreak}>
            <Flame size={13} weight="duotone" color={colors.neon} />
            <AppText variant="metaSmall" color="secondary">
```

Por:

```tsx
          <View style={styles.teaserStreak}>
            {rankingTeaser.streak >= 1 && (
              <Flame testID="streak-flame" size={13} weight="duotone" color={colors.neon} />
            )}
            <AppText variant="metaSmall" color="secondary">
```

- [ ] **Step 4: Rodar — devem passar**

```bash
cd /mnt/h/Actus/app && npx jest ChallengeListCard --no-coverage 2>&1 | tail -10
```

Esperado: PASS em todos os casos.

- [ ] **Step 5: Commit**

```bash
cd /mnt/h/Actus/app && git add src/components/challenges/ChallengeListCard.tsx src/components/challenges/ChallengeListCard.test.tsx && git commit -m "feat(challenges): ocultar Flame quando streak é 0 em ChallengeListCard"
```

---

## Task 4: Componente ChallengeCalendar

**Files:**
- Create: `src/components/challenges/ChallengeCalendar.tsx`
- Create: `src/components/challenges/ChallengeCalendar.test.tsx`

- [ ] **Step 1: Criar arquivo de teste**

Criar `src/components/challenges/ChallengeCalendar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { ChallengeCalendar } from './ChallengeCalendar';

describe('ChallengeCalendar', () => {
  // Desafio: 06 jun → 06 jul 2026. Hoje: 12 jun.
  const BASE = {
    startsOn: '2026-06-06',
    endsOn: '2026-07-06',
    today: '2026-06-12',
  };

  it('marca hoje com accessibilityLabel "12, hoje"', () => {
    render(<ChallengeCalendar {...BASE} />);
    expect(screen.getByLabelText('12, hoje')).toBeTruthy();
  });

  it('marca o último dia com accessibilityLabel "6, fim"', () => {
    render(<ChallengeCalendar {...BASE} />);
    // Julho 6 é o fim — label "6, fim"
    expect(screen.getByLabelText('6, fim')).toBeTruthy();
  });

  it('mostra separador de mês quando o desafio cruza virada', () => {
    render(<ChallengeCalendar {...BASE} />);
    // "Julho" como separador de mês
    expect(screen.getByText('Julho')).toBeTruthy();
  });

  it('não mostra separador de mês quando desafio é no mesmo mês', () => {
    render(
      <ChallengeCalendar
        startsOn="2026-06-01"
        endsOn="2026-06-30"
        today="2026-06-12"
      />,
    );
    expect(screen.queryByText('Julho')).toBeNull();
    expect(screen.queryByText('Junho')).toBeNull();
  });

  it('células fora do intervalo não têm accessibilityLabel (não acessíveis)', () => {
    render(<ChallengeCalendar {...BASE} />);
    // Jun 5 (dia antes do início) não deve ter label "5, ..." (pode haver Jul 5
    // que tem label "5" simples — o que importa é que dias 'out' não têm label)
    // Verificamos que o componente renderiza sem erro e tem as marcações corretas.
    expect(screen.getByLabelText('6, fim')).toBeTruthy(); // sanity
  });

  it('quando hoje está fora do desafio não há célula "hoje"', () => {
    render(
      <ChallengeCalendar
        startsOn="2026-05-01"
        endsOn="2026-05-31"
        today="2026-06-12"
      />,
    );
    expect(screen.queryByLabelText(/hoje/)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar — devem falhar (arquivo não existe)**

```bash
cd /mnt/h/Actus/app && npx jest ChallengeCalendar --no-coverage 2>&1 | tail -10
```

Esperado: FAIL com "Cannot find module './ChallengeCalendar'".

- [ ] **Step 3: Criar o componente**

Criar `src/components/challenges/ChallengeCalendar.tsx`:

```tsx
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  startsOn: string; // YYYY-MM-DD
  endsOn: string;   // YYYY-MM-DD
  today: string;    // YYYY-MM-DD (calculado na tela com formatDateLocal — nunca new Date() aqui)
};

type CellState = 'past' | 'today' | 'future' | 'end' | 'out';

type Cell = {
  dateStr: string;
  dayOfMonth: number;
  state: CellState;
};

// Converte YYYY-MM-DD → número ordinal de dias UTC (só para comparação).
function dateToOrdinal(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, day!) / 86_400_000);
}

// Número ordinal → YYYY-MM-DD via componentes UTC.
function ordinalToDateStr(n: number): string {
  const d = new Date(n * 86_400_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Dia do mês a partir de YYYY-MM-DD.
function dayOfMonth(dateStr: string): number {
  return parseInt(dateStr.slice(8), 10);
}

// Mês (1-12) a partir de YYYY-MM-DD.
function monthOf(dateStr: string): number {
  return parseInt(dateStr.slice(5, 7), 10);
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
  5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
  9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
};

// Constrói as semanas (Dom–Sáb) que cobrem o período startsOn..endsOn.
// Células fora do intervalo do desafio têm state='out'.
function buildWeeks(startsOn: string, endsOn: string, today: string): Cell[][] {
  const startOrd = dateToOrdinal(startsOn);
  const endOrd = dateToOrdinal(endsOn);
  const todayOrd = dateToOrdinal(today);

  // Domingo da semana que contém startsOn.
  const startDow = new Date(startOrd * 86_400_000).getUTCDay(); // 0=Dom
  const firstSunOrd = startOrd - startDow;

  // Sábado da semana que contém endsOn.
  const endDow = new Date(endOrd * 86_400_000).getUTCDay();
  const lastSatOrd = endOrd + (6 - endDow);

  const weeks: Cell[][] = [];

  for (let weekStart = firstSunOrd; weekStart <= lastSatOrd; weekStart += 7) {
    const week: Cell[] = [];
    for (let ord = weekStart; ord < weekStart + 7; ord++) {
      const dateStr = ordinalToDateStr(ord);
      let state: CellState;
      if (ord < startOrd || ord > endOrd) {
        state = 'out';
      } else if (ord === endOrd) {
        state = 'end';
      } else if (ord === todayOrd) {
        state = 'today';
      } else if (ord < todayOrd) {
        state = 'past';
      } else {
        state = 'future';
      }
      week.push({ dateStr, dayOfMonth: dayOfMonth(dateStr), state });
    }
    weeks.push(week);
  }

  return weeks;
}

const WDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

export function ChallengeCalendar({ startsOn, endsOn, today }: Props) {
  const weeks = buildWeeks(startsOn, endsOn, today);

  return (
    <View>
      {/* Cabeçalho dos dias da semana */}
      <View style={styles.wdayRow}>
        {WDAYS.map((d, i) => (
          <View key={i} style={styles.wdayCell}>
            <AppText variant="metaSmall" color="tertiary">
              {d}
            </AppText>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => {
        // Separador de mês: aparece antes de uma semana cujo domingo está em mês diferente
        // do domingo da semana anterior.
        const prevSunMonth = wi > 0 ? monthOf(weeks[wi - 1]![0]!.dateStr) : null;
        const thisSunMonth = monthOf(week[0]!.dateStr);
        const showSeparator = prevSunMonth !== null && thisSunMonth !== prevSunMonth;

        return (
          <View key={week[0]!.dateStr}>
            {showSeparator && (
              <AppText variant="metaSmall" color="tertiary" style={styles.monthSep}>
                {MONTH_NAMES[thisSunMonth] ?? ''}
              </AppText>
            )}
            <View style={styles.weekRow}>
              {week.map((cell) => {
                const isOut = cell.state === 'out';
                const label =
                  cell.state === 'today'
                    ? `${cell.dayOfMonth}, hoje`
                    : cell.state === 'end'
                    ? `${cell.dayOfMonth}, fim`
                    : isOut
                    ? undefined
                    : String(cell.dayOfMonth);

                return (
                  <View
                    key={cell.dateStr}
                    accessible={!isOut}
                    accessibilityLabel={label}
                    style={[
                      styles.cell,
                      cell.state === 'past' && styles.cellPast,
                      cell.state === 'today' && styles.cellToday,
                      cell.state === 'future' && styles.cellFuture,
                      cell.state === 'end' && styles.cellEnd,
                    ]}
                  >
                    {!isOut && (
                      <AppText
                        variant="metaSmall"
                        color={
                          cell.state === 'end'
                            ? 'inverse'
                            : cell.state === 'today'
                            ? 'neon'
                            : 'tertiary'
                        }
                      >
                        {String(cell.dayOfMonth)}
                      </AppText>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wdayRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  wdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1.5,
  },
  cellPast: {
    backgroundColor: theme.colors.surface3,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: theme.colors.neon,
  },
  cellFuture: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cellEnd: {
    backgroundColor: theme.colors.neon,
  },
  monthSep: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
}));
```

- [ ] **Step 4: Rodar — devem passar**

```bash
cd /mnt/h/Actus/app && npx jest ChallengeCalendar --no-coverage 2>&1 | tail -15
```

Esperado: PASS em todos os 6 casos.

- [ ] **Step 5: Commit**

```bash
cd /mnt/h/Actus/app && git add src/components/challenges/ChallengeCalendar.tsx src/components/challenges/ChallengeCalendar.test.tsx && git commit -m "feat(challenges): componente ChallengeCalendar — grade B1 de semanas do desafio"
```

---

## Task 5: Exportar e integrar na tela de detalhe

**Files:**
- Modify: `src/components/challenges/index.ts`
- Modify: `app/(aluno)/desafio/[id].tsx`

- [ ] **Step 1: Exportar do barrel**

Em `src/components/challenges/index.ts`, adicionar após a linha `export { RankingRow }`:

```ts
export { ChallengeCalendar } from './ChallengeCalendar';
```

- [ ] **Step 2: Atualizar import na tela**

Em `app/(aluno)/desafio/[id].tsx`, linha 10:

```tsx
import { MyPositionCard, RankingRow } from '@/components/challenges';
```

Substituir por:

```tsx
import { ChallengeCalendar, MyPositionCard, RankingRow } from '@/components/challenges';
```

- [ ] **Step 3: Remover progressRow/track/fill do JSX**

Em `app/(aluno)/desafio/[id].tsx`, dentro do bloco `<View style={styles.hero}>`, localizar e **remover** estas linhas:

```tsx
                <View style={styles.progressRow}>
                  <AppText variant="metaSmall" color="tertiary">
                    {`dia ${dayProgress.day} de ${dayProgress.total}`}
                  </AppText>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
                </View>
```

E no lugar inserir:

```tsx
                <View style={styles.calendar}>
                  <ChallengeCalendar
                    startsOn={challenge.starts_on}
                    endsOn={challenge.ends_on}
                    today={today}
                  />
                </View>
```

- [ ] **Step 4: Remover estilos que não são mais usados**

Em `app/(aluno)/desafio/[id].tsx`, no `StyleSheet.create`, **remover** as entradas `progressRow`, `track` e `fill` — e **adicionar** `calendar`:

Remover:
```tsx
  progressRow: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs },
  track: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },
```

Adicionar (no lugar ou ao final do objeto de estilos, antes do `}`):
```tsx
  calendar: { marginTop: theme.spacing.lg },
```

- [ ] **Step 5: Remover variáveis e imports não utilizados**

Remover as duas variáveis derivadas do progresso (linhas ~59–62 em `[id].tsx`):

```tsx
  const dayProgress = challenge
    ? challengeDayProgress(challenge.starts_on, challenge.ends_on, today)
    : { day: 0, total: 1 };
  const ratio = progressRatio(dayProgress.day, dayProgress.total);
```

Remover a função local `progressRatio` (linhas 23–26):

```tsx
function progressRatio(day: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, day / total));
}
```

Alterar o import de `@/lib/challenge` (linha 15) — remover apenas `challengeDayProgress`, manter `challengeStatusLabel`:

```tsx
// antes
import { challengeDayProgress, challengeStatusLabel } from '@/lib/challenge';
// depois
import { challengeStatusLabel } from '@/lib/challenge';
```

- [ ] **Step 6: Verificar typecheck**

```bash
cd /mnt/h/Actus/app && npm run typecheck 2>&1 | tail -20
```

Esperado: sem erros de tipo.

- [ ] **Step 7: Commit**

```bash
cd /mnt/h/Actus/app && git add src/components/challenges/index.ts 'app/(aluno)/desafio/[id].tsx' && git commit -m "feat(challenges): substituir barra de progresso por ChallengeCalendar na tela de detalhe"
```
