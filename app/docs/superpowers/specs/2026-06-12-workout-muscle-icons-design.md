# Workout Muscle Icons — Design Spec

**Data:** 2026-06-12  
**Projeto:** Actus — app mobile (personal trainer)  
**Escopo:** Ícones de grupo muscular nos treinos — picker no builder + exibição nos cards

---

## Contexto

O personal cria treinos no builder (`/montar-treino`). Hoje os cards de treino exibem sempre um ícone genérico de haltere (Phosphor `Barbell`). O objetivo é substituir esse ícone por um set de SVGs anatômicos de grupos musculares, adaptado ao design system do Actus. O ícone é sugerido automaticamente com base nos exercícios do treino e pode ser trocado manualmente.

---

## Decisões de design

| Decisão | Escolha |
|---|---|
| Tratamento de cor | **Dois tons de neon** — corpo = `rgba(203,254,0,0.28)`, músculo-destaque = `#CBFE00` |
| Picker no builder | **Sugestão automática** — ícone muda conforme exercícios adicionados; personal pode trocar |
| Persistência | Campo `workout_icon TEXT NULL` na tabela `workouts` do banco |

---

## Assets

**Localização:** `app/assets/muscles/` (18 SVGs)

| Arquivo | Chave | Uso sugerido |
|---|---|---|
| `chest.svg` | `chest` | Peitoral |
| `back-muscles.svg` | `back` | Costas / Dorsal |
| `shoulders.svg` | `shoulders` | Ombros / Deltóide |
| `biceps.svg` | `biceps` | Bíceps |
| `triceps.svg` | `triceps` | Tríceps |
| `quadriceps.svg` | `quadriceps` | Quadríceps |
| `hamstrings.svg` | `hamstrings` | Posterior de coxa |
| `glutes.svg` | `glutes` | Glúteos |
| `calves.svg` | `calves` | Panturrilha |
| `prelum.svg` | `core` | Core / Abdômen |
| `neck.svg` | `neck` | Pescoço |
| `leg.svg` | `legs` | Pernas (genérico) |
| `torso.svg` | `torso` | Tronco (genérico) |
| `muscle.svg` | `full_body` | Corpo inteiro |
| `fit.svg` | `cardio` | Cardio / Funcional |
| `flex-biceps.svg` | `arms` | Braços (genérico) |
| `neck2.svg` | *(omitir — duplicata)* | — |
| `weak.svg` | *(omitir — sem uso claro)* | — |

**Total utilizável:** 16 ícones.

---

## Adaptação de cor

Cada SVG tem dois grupos de `fill`:
- **Fills claros** (`#ffb74d`, `#ffba57`, `#ffa726`, `#f9a825`) → substituir por `rgba(203,254,0,0.28)`
- **Fills de destaque** (`#ff754c`) → substituir por `#CBFE00`

Os SVGs são importados via `react-native-svg-transformer` (já instalado). Cada arquivo `.svg` vira um componente React Native que recebe `width`/`height` como props.

---

## Arquitetura

### `app/src/lib/muscleIcons.ts`

Exporta:
- `MUSCLE_ICONS`: `Record<string, React.ComponentType<SvgProps>>` — mapa de chave → componente SVG
- `MUSCLE_ICON_KEYS`: array de chaves ordenadas para o picker
- `suggestIcon(muscleGroups: string[]): string | null` — retorna a chave mais adequada ou `null`

**Lógica de `suggestIcon`:**  
Conta a frequência de cada `muscle_group` nos exercícios do treino. Mapeia cada valor para uma chave de ícone via tabela de afinidade semântica (ex: "Peitoral", "Peito", "Chest" → `chest`). Retorna a chave do grupo mais frequente.

### `app/assets/muscles/`

18 arquivos SVG copiados de `C:\Users\davim\Downloads\set-of-muscles-2026-02-24-00-48-31-utc\SVG\`, com cores adaptadas conforme a regra acima (edição direta nos arquivos SVG — troca de fill por fill ou fill com rgba).

### `app/src/components/muscles/MuscleIcon.tsx`

Wrapper fino:
```tsx
<MuscleIcon iconKey="chest" size={32} />
```
Renderiza o componente do mapa ou `null` se a chave for inválida.

### `app/src/components/muscles/MuscleIconPicker.tsx`

Bottom sheet com grid de todos os 16 ícones. Cada célula: ícone 40px + label textual abaixo. Seleção destacada com borda neon. Usado no builder e potencialmente em edição futura.

---

## Backend

### Migração SQL

```sql
ALTER TABLE public.workouts ADD COLUMN icon TEXT NULL;
```

Arquivo: `backend/supabase/migrations/20260612120000_workouts_icon.sql`

### API — `backend/api/src/routes/workouts.ts`

**GET /workouts (lista):**  
- Adicionar `w.icon` no SELECT
- Incluir `icon: string | null` no tipo de resposta

**GET /workouts/:id (detalhe):**  
- Adicionar `w.icon` no SELECT

**POST /workouts (criar):**  
- Adicionar `icon: z.string().max(40).optional().nullable()` ao schema de criação
- Incluir no INSERT

**PATCH /workouts/:id (editar):**  
- Adicionar `icon` ao schema de edição parcial
- Incluir no UPDATE quando presente

### Tipo no app — `app/src/types/workouts.ts`

Adicionar `icon: z.string().nullable().optional()` ao schema `ProWorkoutListItemSchema` e `ProWorkoutDetailSchema`.

---

## Builder (`app/app/montar-treino.tsx`) — Passo 2

**Barra de ícone sugerido (nova, acima da lista de exercícios):**

```
┌──────────────────────────────────────┐
│ [ícone 28px]  Peito          Trocar → │
└──────────────────────────────────────┘
```

- Aparece assim que há ≥1 exercício com `muscle_group` definido
- Recalcula a sugestão automaticamente a cada exercício adicionado/removido
- Se o personal já trocou manualmente, a sugestão para de sobrescrever
- "Trocar →" abre `MuscleIconPicker`
- Estado local: `iconKey: string | null` no `useState` do builder

**No passo 3 (revisão):**  
Mostra o ícone escolhido ao lado do nome do treino.

**No payload de save:**  
Inclui `icon: iconKey` no body do POST/PATCH.

---

## Cards de treino — `ProWorkoutCard`

Substituir o `Barbell` Phosphor pelo `MuscleIcon`:

```tsx
<MuscleIcon iconKey={workout.icon} size={24} />
// fallback se workout.icon === null:
<Barbell size={22} weight="duotone" color={colors.neon} />
```

---

## Escopo fora deste spec

- Ícones nos templates do admin (web) — fora de escopo por ora
- Ícones nos treinos atribuídos ao aluno (StudentWorkout) — fora de escopo por ora
- Edição de ícone fora do builder (ex: tocar no card para trocar) — fora de escopo

---

## Checklist de implementação

- [ ] Copiar e adaptar os 16 SVGs para `app/assets/muscles/`
- [ ] Criar `app/src/lib/muscleIcons.ts`
- [ ] Criar `app/src/components/muscles/MuscleIcon.tsx`
- [ ] Criar `app/src/components/muscles/MuscleIconPicker.tsx`
- [ ] Migração SQL (`workouts.icon`)
- [ ] Atualizar rotas da API (GET lista, GET detalhe, POST, PATCH)
- [ ] Atualizar tipos Zod no app
- [ ] Atualizar `montar-treino.tsx` (barra de sugestão + picker + payload)
- [ ] Atualizar `ProWorkoutCard` para exibir `MuscleIcon`
