# Design: Calendário no Desafio + Chama Condicional

**Data:** 2026-06-12  
**Escopo:** `app/(aluno)/desafio/[id].tsx` · `src/components/challenges/`

---

## 1. Chama condicional (Flame)

O ícone `<Flame>` só é renderizado quando `streak >= 1`. Com `streak === 0` o número permanece visível, sem o ícone ao lado.

**Componentes afetados:**
- `src/components/challenges/RankingRow.tsx` — coluna de streak no ranking
- `src/components/challenges/MyPositionCard.tsx` — métrica streakCurrent
- `src/components/challenges/ChallengeListCard.tsx` — teaser de ranking no card da lista

Sem mudança de layout. Apenas renderização condicional do SVG.

---

## 2. Calendário B1 no hero do detalhe

### O que muda

Substitui o bloco `progressRow` (texto "dia X de Y") + `track`/`fill` (barra de progresso) no hero card de `app/(aluno)/desafio/[id].tsx` por um componente de calendário compacto.

### Novo componente: `ChallengeCalendar`

**Localização:** `src/components/challenges/ChallengeCalendar.tsx`

**Props:**
```ts
type Props = {
  startsOn: string; // YYYY-MM-DD
  endsOn:   string; // YYYY-MM-DD
  today:    string; // YYYY-MM-DD (já calculado na tela — sem new Date() aqui)
};
```

**Lógica de construção da grade:**

1. Converte `startsOn` e `endsOn` em objetos Date (componentes locais, sem `toISOString()`).
2. Determina a primeira semana: semana do calendário (Dom–Sáb) que contém `startsOn`.
3. Determina a última semana: semana que contém `endsOn`.
4. Gera todas as células de domingo a sábado para esse intervalo de semanas.
5. Células cujo `date < startsOn` ou `date > endsOn` são renderizadas como invisíveis (`opacity: 0` ou texto vazio) mas ocupam posição no grid para preservar o alinhamento semanal.
6. Quando uma semana cruza a virada de mês, insere um separador de texto (nome do novo mês) antes da linha — ocupa `grid-column: 1 / -1`.

**Estados de célula:**

| Estado   | Condição                         | Visual                                      |
|----------|----------------------------------|---------------------------------------------|
| `past`   | `cellDate < today`               | `surface3` background, texto `tertiary`     |
| `today`  | `cellDate === today`             | borda neon (2px), texto neon, glow sutil    |
| `future` | `cellDate > today && !== endsOn` | `surface1` background, borda `outlineVariant`, texto dim |
| `end`    | `cellDate === endsOn`            | `neon` background, texto `textInverse`      |
| `out`    | fora do intervalo do desafio     | invisível, sem borda, ocupa posição no grid |

**Cabeçalho de dias da semana:** uma linha de 7 labels (D S T Q Q S S) em `metaSmall`/`tertiary` acima da grade.

**Sem scroll:** o componente é estático (não scrollável). Cabe dentro do card pois só exibe as semanas relevantes.

### Exportação

Adicionar `ChallengeCalendar` ao barrel `src/components/challenges/index.ts`.

### Uso na tela

Em `app/(aluno)/desafio/[id].tsx`, dentro do `hero`:
- Remover `progressRow`, `track` e `fill` (estilos e JSX).
- Adicionar `<ChallengeCalendar startsOn={challenge.starts_on} endsOn={challenge.ends_on} today={today} />` com `marginTop: spacing.lg`.
- Manter o texto do período (`shortDateBr`) acima do calendário.

---

## Fora de escopo

- Marcar dias em que o aluno efetivamente treinou (não há dado por dia na API v1).
- Alterar o `ChallengeListCard` da lista — mantém barra de progresso.
- Qualquer mudança no `desafio-pro/[id].tsx`.
