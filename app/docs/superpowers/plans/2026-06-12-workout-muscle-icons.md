# Workout Muscle Icons — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ícones anatômicos de grupos musculares nos treinos — sugeridos automaticamente no builder com base nos exercícios, persistidos no banco, exibidos nos cards.

**Architecture:** 16 SVGs adaptados vivem em `app/assets/muscles/`; um lib (`muscleIcons.ts`) exporta o mapa de componentes e a função de sugestão; dois componentes (`MuscleIcon` + `MuscleIconPicker`) expõem a UI; o campo `icon TEXT NULL` é adicionado à tabela `workouts` via migração; as 4 rotas REST do builder recebem o campo; os tipos Zod do app e o próprio builder são atualizados.

**Tech Stack:** react-native-svg + react-native-svg-transformer (já configurado), Reanimated 4, Unistyles 3, Zod, Express/Postgres (backend), Expo Router

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Criar | `app/assets/muscles/` (16 SVGs adaptados) |
| Criar | `app/src/lib/muscleIcons.ts` |
| Criar | `app/src/components/muscles/MuscleIcon.tsx` |
| Criar | `app/src/components/muscles/MuscleIconPicker.tsx` |
| Criar | `app/src/components/muscles/index.ts` |
| Criar | `backend/supabase/migrations/20260612120000_workouts_icon.sql` |
| Modificar | `backend/api/src/routes/workouts.ts` |
| Modificar | `app/src/types/workouts.ts` |
| Modificar | `app/app/montar-treino.tsx` |
| Modificar | `app/app/(personal)/(tabs)/treinos.tsx` |

---

## Task 1: Migração SQL

**Files:**
- Criar: `backend/supabase/migrations/20260612120000_workouts_icon.sql`

- [ ] **Step 1: Criar arquivo de migração**

```sql
-- Adiciona coluna icon ao treino (template do profissional).
-- Chave de ícone: ex. "chest", "back", "shoulders" (máx 40 chars).
ALTER TABLE public.workouts ADD COLUMN icon TEXT NULL;
```

Salvar em `backend/supabase/migrations/20260612120000_workouts_icon.sql`.

- [ ] **Step 2: Aplicar a migração via Docker**

```bash
cd /mnt/h/Actus/backend
docker compose exec db psql -U actus -d actus -f /docker-entrypoint-initdb.d/20260612120000_workouts_icon.sql
```

Se o Docker não tiver o arquivo montado, rode direto:

```bash
docker compose exec db psql -U actus -d actus -c "ALTER TABLE public.workouts ADD COLUMN icon TEXT NULL;"
```

Verificar: `docker compose exec db psql -U actus -d actus -c "\d public.workouts"` — deve mostrar a coluna `icon`.

- [ ] **Step 3: Commit**

```bash
git -C /mnt/h/Actus add backend/supabase/migrations/20260612120000_workouts_icon.sql
git -C /mnt/h/Actus commit -m "feat(db): adiciona coluna icon à tabela workouts"
```

---

## Task 2: Copiar e adaptar os SVGs

**Files:**
- Criar: `app/assets/muscles/` (16 SVGs)

Os SVGs originais ficam em `C:\Users\davim\Downloads\set-of-muscles-2026-02-24-00-48-31-utc\SVG\`.

Correspondência de Windows → WSL: `/mnt/c/Users/davim/Downloads/set-of-muscles-2026-02-24-00-48-31-utc/SVG/`

Adaptação de cores:
- Fills de corpo (`#ffb74d`, `#ffba57`, `#ffa726`, `#f9a825`) → `rgba(203,254,0,0.28)`
- Fill de destaque (`#ff754c`) → `#CBFE00`

- [ ] **Step 1: Criar o diretório de destino**

```bash
mkdir -p /mnt/h/Actus/app/assets/muscles
```

- [ ] **Step 2: Copiar os 16 SVGs**

```bash
SRC="/mnt/c/Users/davim/Downloads/set-of-muscles-2026-02-24-00-48-31-utc/SVG"
DEST="/mnt/h/Actus/app/assets/muscles"

cp "$SRC/back-muscles.svg" "$DEST/back-muscles.svg"
cp "$SRC/biceps.svg"       "$DEST/biceps.svg"
cp "$SRC/calves.svg"       "$DEST/calves.svg"
cp "$SRC/chest.svg"        "$DEST/chest.svg"
cp "$SRC/fit.svg"          "$DEST/fit.svg"
cp "$SRC/flex-biceps.svg"  "$DEST/flex-biceps.svg"
cp "$SRC/glutes.svg"       "$DEST/glutes.svg"
cp "$SRC/hamstrings.svg"   "$DEST/hamstrings.svg"
cp "$SRC/leg.svg"          "$DEST/leg.svg"
cp "$SRC/muscle.svg"       "$DEST/muscle.svg"
cp "$SRC/neck.svg"         "$DEST/neck.svg"
cp "$SRC/prelum.svg"       "$DEST/prelum.svg"
cp "$SRC/quadriceps.svg"   "$DEST/quadriceps.svg"
cp "$SRC/shoulders.svg"    "$DEST/shoulders.svg"
cp "$SRC/torso.svg"        "$DEST/torso.svg"
cp "$SRC/triceps.svg"      "$DEST/triceps.svg"
```

- [ ] **Step 3: Adaptar as cores**

```bash
DEST="/mnt/h/Actus/app/assets/muscles"

for f in "$DEST"/*.svg; do
  # Corpo: tons de laranja → neon translúcido
  sed -i 's/fill="#ffb74d"/fill="rgba(203,254,0,0.28)"/g' "$f"
  sed -i 's/fill="#ffba57"/fill="rgba(203,254,0,0.28)"/g' "$f"
  sed -i 's/fill="#ffa726"/fill="rgba(203,254,0,0.28)"/g' "$f"
  sed -i 's/fill="#f9a825"/fill="rgba(203,254,0,0.28)"/g' "$f"
  # Destaque: vermelho/coral → neon sólido
  sed -i 's/fill="#ff754c"/fill="#CBFE00"/g' "$f"
done
echo "Cores adaptadas."
```

- [ ] **Step 4: Verificar resultado**

```bash
grep -n "fill=" /mnt/h/Actus/app/assets/muscles/back-muscles.svg
```

Esperado: duas linhas, uma com `rgba(203,254,0,0.28)` e outra com `#CBFE00`. Nenhum fill laranja/coral deve restar.

- [ ] **Step 5: Commit**

```bash
git -C /mnt/h/Actus add app/assets/muscles/
git -C /mnt/h/Actus commit -m "feat(assets): SVGs musculares adaptados ao design system (neon 2 tons)"
```

---

## Task 3: Criar `muscleIcons.ts`

**Files:**
- Criar: `app/src/lib/muscleIcons.ts`

- [ ] **Step 1: Criar o arquivo**

`app/src/lib/muscleIcons.ts`:

```ts
import BackMuscles from '@/assets/muscles/back-muscles.svg';
import Biceps from '@/assets/muscles/biceps.svg';
import Calves from '@/assets/muscles/calves.svg';
import Chest from '@/assets/muscles/chest.svg';
import Fit from '@/assets/muscles/fit.svg';
import FlexBiceps from '@/assets/muscles/flex-biceps.svg';
import Glutes from '@/assets/muscles/glutes.svg';
import Hamstrings from '@/assets/muscles/hamstrings.svg';
import Leg from '@/assets/muscles/leg.svg';
import Muscle from '@/assets/muscles/muscle.svg';
import Neck from '@/assets/muscles/neck.svg';
import Prelum from '@/assets/muscles/prelum.svg';
import Quadriceps from '@/assets/muscles/quadriceps.svg';
import Shoulders from '@/assets/muscles/shoulders.svg';
import Torso from '@/assets/muscles/torso.svg';
import Triceps from '@/assets/muscles/triceps.svg';
import type { SvgProps } from 'react-native-svg';
import type { ComponentType } from 'react';

export type MuscleIconKey =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'arms'
  | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'legs'
  | 'core' | 'torso' | 'neck' | 'full_body' | 'cardio';

export const MUSCLE_ICONS: Record<MuscleIconKey, ComponentType<SvgProps>> = {
  chest:      Chest,
  back:       BackMuscles,
  shoulders:  Shoulders,
  biceps:     Biceps,
  triceps:    Triceps,
  arms:       FlexBiceps,
  quadriceps: Quadriceps,
  hamstrings: Hamstrings,
  glutes:     Glutes,
  calves:     Calves,
  legs:       Leg,
  core:       Prelum,
  torso:      Torso,
  neck:       Neck,
  full_body:  Muscle,
  cardio:     Fit,
};

// Ordem de exibição no picker: de cima para baixo, frente para trás.
export const MUSCLE_ICON_KEYS: MuscleIconKey[] = [
  'chest', 'back', 'shoulders', 'biceps',
  'triceps', 'arms', 'quadriceps', 'hamstrings',
  'glutes', 'calves', 'legs', 'core',
  'torso', 'neck', 'full_body', 'cardio',
];

export const MUSCLE_ICON_LABELS: Record<MuscleIconKey, string> = {
  chest:      'Peito',
  back:       'Costas',
  shoulders:  'Ombros',
  biceps:     'Bíceps',
  triceps:    'Tríceps',
  arms:       'Braços',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posterior',
  glutes:     'Glúteos',
  calves:     'Panturrilha',
  legs:       'Pernas',
  core:       'Core',
  torso:      'Tronco',
  neck:       'Pescoço',
  full_body:  'Corpo todo',
  cardio:     'Cardio',
};

// Tabela de afinidade: substrings (lowercase) → chave de ícone.
// A ordem importa: mais específico antes do mais genérico.
const KEYWORD_MAP: Array<{ subs: string[]; icon: MuscleIconKey }> = [
  { subs: ['peito', 'peitoral', 'chest'],                                            icon: 'chest' },
  { subs: ['costa', 'dorsal', 'latíssimo', 'latissimo', 'trapézio', 'trapezio',
            'rombóide', 'romboide', 'back'],                                          icon: 'back' },
  { subs: ['ombro', 'deltóide', 'deltoide', 'shoulder'],                             icon: 'shoulders' },
  { subs: ['bíceps femoral', 'biceps femoral', 'posterior', 'isquio', 'hamstring'], icon: 'hamstrings' },
  { subs: ['bíceps', 'biceps', 'bicep'],                                              icon: 'biceps' },
  { subs: ['tríceps', 'triceps', 'tricep'],                                           icon: 'triceps' },
  { subs: ['quadríceps', 'quadriceps', 'quádriceps'],                                icon: 'quadriceps' },
  { subs: ['glúteo', 'gluteo', 'glute'],                                              icon: 'glutes' },
  { subs: ['panturrilha', 'gastrocnêmio', 'gastrocnemio', 'sóleo', 'soleo', 'calf'], icon: 'calves' },
  { subs: ['abdômen', 'abdomen', 'abdomin', 'oblíquo', 'obliquo', 'core', 'prancha'], icon: 'core' },
  { subs: ['pescoço', 'pescoco', 'neck'],                                             icon: 'neck' },
  { subs: ['perna', 'leg'],                                                           icon: 'legs' },
  { subs: ['cardio', 'aeróbic', 'aerobic', 'funcional', 'functional'],               icon: 'cardio' },
  { subs: ['braço', 'braco', 'arm'],                                                  icon: 'arms' },
  { subs: ['tronco', 'torso', 'trunk'],                                               icon: 'torso' },
];

function groupToKey(group: string): MuscleIconKey | null {
  const lower = group.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.subs.some((s) => lower.includes(s))) return entry.icon;
  }
  return null;
}

/**
 * Sugere o ícone mais adequado para um treino dado os grupos musculares dos
 * exercícios. Retorna a chave do grupo mais frequente, ou null se nenhum
 * exercício tiver grupo reconhecido.
 */
export function suggestIcon(muscleGroups: (string | null | undefined)[]): MuscleIconKey | null {
  const freq = new Map<MuscleIconKey, number>();
  for (const g of muscleGroups) {
    if (!g) continue;
    const key = groupToKey(g);
    if (key) freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  if (freq.size === 0) return null;
  let best: MuscleIconKey | null = null;
  let max = 0;
  for (const [k, n] of freq) {
    if (n > max) { max = n; best = k; }
  }
  return best;
}
```

- [ ] **Step 2: Verificar tipagem**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit 2>&1 | grep muscleIcons
```

Esperado: nenhuma linha de erro referenciando `muscleIcons`.

- [ ] **Step 3: Commit**

```bash
git -C /mnt/h/Actus add app/src/lib/muscleIcons.ts
git -C /mnt/h/Actus commit -m "feat(lib): muscleIcons — mapa de SVGs musculares + suggestIcon"
```

---

## Task 4: Criar `MuscleIcon` e `MuscleIconPicker`

**Files:**
- Criar: `app/src/components/muscles/MuscleIcon.tsx`
- Criar: `app/src/components/muscles/MuscleIconPicker.tsx`
- Criar: `app/src/components/muscles/index.ts`

- [ ] **Step 1: Criar `MuscleIcon.tsx`**

`app/src/components/muscles/MuscleIcon.tsx`:

```tsx
import { MUSCLE_ICONS, type MuscleIconKey } from '@/lib/muscleIcons';

type Props = {
  iconKey: string | null | undefined;
  size?: number;
};

export function MuscleIcon({ iconKey, size = 24 }: Props) {
  if (!iconKey) return null;
  const Icon = MUSCLE_ICONS[iconKey as MuscleIconKey];
  if (!Icon) return null;
  return <Icon width={size} height={size} />;
}
```

- [ ] **Step 2: Criar `MuscleIconPicker.tsx`**

`app/src/components/muscles/MuscleIconPicker.tsx`:

```tsx
import { useEffect } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { X } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { MUSCLE_ICON_KEYS, MUSCLE_ICON_LABELS, MUSCLE_ICONS, type MuscleIconKey } from '@/lib/muscleIcons';
import { darkTheme } from '@/theme';

const { colors, motion, spacing, radius } = darkTheme;

type Props = {
  visible: boolean;
  selected: MuscleIconKey | null;
  onSelect: (key: MuscleIconKey) => void;
  onClose: () => void;
};

export function MuscleIconPicker({ visible, selected, onSelect, onClose }: Props) {
  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: motion.screenMs });
      translateY.value = withTiming(0, { duration: motion.screenMs });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(400, { duration: 200 });
    }
  }, [visible, opacity, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPress} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <AppText variant="h3">Ícone do treino</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={12}
              onPress={onClose}
            >
              <X size={20} weight="bold" color={colors.textSecondary} />
            </Pressable>
          </View>
          {/* Grid 4 colunas */}
          <FlatList
            data={MUSCLE_ICON_KEYS}
            keyExtractor={(k) => k}
            numColumns={4}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: key }) => {
              const Icon = MUSCLE_ICONS[key];
              const isSelected = key === selected;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={MUSCLE_ICON_LABELS[key]}
                  onPress={() => { onSelect(key); onClose(); }}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                >
                  <Icon width={40} height={40} />
                  <AppText
                    variant="metaSmall"
                    color={isSelected ? 'neon' : 'tertiary'}
                    style={styles.cellLabel}
                    numberOfLines={1}
                  >
                    {MUSCLE_ICON_LABELS[key]}
                  </AppText>
                </Pressable>
              );
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.surface1,
    borderTopLeftRadius: theme.radius.modal,
    borderTopRightRadius: theme.radius.modal,
    paddingBottom: theme.spacing.xl,
    // Sombra permitida em sheet/modal (exceção do design).
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  grid: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  cell: {
    width: '23%',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellSelected: {
    borderColor: theme.colors.neon,
    backgroundColor: 'rgba(203,254,0,0.08)',
  },
  cellLabel: {
    textAlign: 'center',
  },
}));
```

- [ ] **Step 3: Criar `index.ts`**

`app/src/components/muscles/index.ts`:

```ts
export { MuscleIcon } from './MuscleIcon';
export { MuscleIconPicker } from './MuscleIconPicker';
```

- [ ] **Step 4: Verificar tipagem**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit 2>&1 | grep -E "muscles|MuscleIcon"
```

Esperado: nenhuma linha de erro.

- [ ] **Step 5: Commit**

```bash
git -C /mnt/h/Actus add app/src/components/muscles/
git -C /mnt/h/Actus commit -m "feat(components): MuscleIcon + MuscleIconPicker"
```

---

## Task 5: Atualizar API backend

**Files:**
- Modificar: `backend/api/src/routes/workouts.ts`

São 4 pontos de mudança:
1. `createWorkoutSchema` — adicionar `icon`
2. `patchWorkoutSchema` — adicionar `icon`
3. `GET /` — adicionar `w.icon` no SELECT e no mapping
4. `GET /:workout_id` — adicionar `w.icon` no SELECT e no retorno
5. `POST /` — adicionar `icon` no destructure e no INSERT
6. `PATCH /:workout_id` — adicionar `icon` no destructure, no SET builder e no retorno detail

- [ ] **Step 1: Atualizar `createWorkoutSchema`**

No arquivo `backend/api/src/routes/workouts.ts`, localizar:

```ts
const createWorkoutSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  exercises: z.array(exerciseSchema).min(1).max(200),
});
```

Substituir por:

```ts
const createWorkoutSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  icon: z.string().max(40).optional().nullable(),
  exercises: z.array(exerciseSchema).min(1).max(200),
});
```

- [ ] **Step 2: Atualizar `patchWorkoutSchema`**

Localizar:

```ts
const patchWorkoutSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(5000).optional().nullable(),
    exercises: z.array(exerciseSchema).min(1).max(200).optional(),
  })
  .refine((o) => o.name !== undefined || o.notes !== undefined || o.exercises !== undefined, {
    message: "empty_patch",
  });
```

Substituir por:

```ts
const patchWorkoutSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(5000).optional().nullable(),
    icon: z.string().max(40).optional().nullable(),
    exercises: z.array(exerciseSchema).min(1).max(200).optional(),
  })
  .refine(
    (o) => o.name !== undefined || o.notes !== undefined || o.icon !== undefined || o.exercises !== undefined,
    { message: "empty_patch" },
  );
```

- [ ] **Step 3: Atualizar GET / (lista)**

Localizar a query do GET list:

```ts
        `
        select w.id, w.name, w.notes, w.created_at, count(we.id)::text as exercise_count
        from public.workouts w
```

Substituir por:

```ts
        `
        select w.id, w.name, w.notes, w.icon, w.created_at, count(we.id)::text as exercise_count
        from public.workouts w
```

Localizar o mapping de resultado no GET list:

```ts
      const workouts = q.rows.map((r) => ({
        id: r.id,
        name: r.name,
        notes: r.notes,
        created_at: (r.created_at instanceof Date ? r.created_at : new Date(r.created_at)).toISOString(),
        exercise_count: Number(r.exercise_count),
      }));
```

Substituir por:

```ts
      const workouts = q.rows.map((r) => ({
        id: r.id,
        name: r.name,
        notes: r.notes,
        icon: r.icon,
        created_at: (r.created_at instanceof Date ? r.created_at : new Date(r.created_at)).toISOString(),
        exercise_count: Number(r.exercise_count),
      }));
```

O tipo da query também precisa de `icon: string | null`. Localizar:

```ts
      const q = await client.query<{ id: string; name: string; notes: string | null; created_at: any; exercise_count: string }>(
```

Substituir por:

```ts
      const q = await client.query<{ id: string; name: string; notes: string | null; icon: string | null; created_at: any; exercise_count: string }>(
```

- [ ] **Step 4: Atualizar GET /:workout_id (detalhe)**

Localizar a query do detalhe no GET /:workout_id:

```ts
      const wQ = await client.query<{ id: string; name: string; notes: string | null; created_at: any }>(
        `select id, name, notes, created_at from public.workouts where id = $1 and owner_personal_id = $2`,
```

Substituir por:

```ts
      const wQ = await client.query<{ id: string; name: string; notes: string | null; icon: string | null; created_at: any }>(
        `select id, name, notes, icon, created_at from public.workouts where id = $1 and owner_personal_id = $2`,
```

Localizar o retorno do workout no GET /:workout_id:

```ts
      return {
        ok: true as const,
        workout: {
          id: w.id,
          name: w.name,
          notes: w.notes,
          created_at: (w.created_at instanceof Date ? w.created_at : new Date(w.created_at)).toISOString(),
          exercises: exQ.rows.map((e) => ({
```

Substituir por:

```ts
      return {
        ok: true as const,
        workout: {
          id: w.id,
          name: w.name,
          notes: w.notes,
          icon: w.icon,
          created_at: (w.created_at instanceof Date ? w.created_at : new Date(w.created_at)).toISOString(),
          exercises: exQ.rows.map((e) => ({
```

- [ ] **Step 5: Atualizar POST / (criar)**

Localizar o destructure do POST:

```ts
  const { name, notes, exercises } = parsed.data;
```

Substituir pela primeira ocorrência após `router.post("/", ...`:

```ts
  const { name, notes, icon, exercises } = parsed.data;
```

Localizar o INSERT do workout no POST:

```ts
        insert into public.workouts (id, owner_personal_id, name, notes)
        values ($1, $2, $3, $4)
        returning id
        `,
        [workoutId, personalId, name, notes ?? null],
```

Substituir por:

```ts
        insert into public.workouts (id, owner_personal_id, name, notes, icon)
        values ($1, $2, $3, $4, $5)
        returning id
        `,
        [workoutId, personalId, name, notes ?? null, icon ?? null],
```

- [ ] **Step 6: Atualizar PATCH /:workout_id**

Localizar o destructure do PATCH (dentro de `router.patch`):

```ts
  const { name, notes, exercises } = parsed.data;
```

Substituir pela ocorrência dentro de `router.patch(`:

```ts
  const { name, notes, icon, exercises } = parsed.data;
```

Localizar a condição do SET builder no PATCH:

```ts
      if (name !== undefined || notes !== undefined) {
        const sets: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        if (name !== undefined) {
          sets.push(`name = $${i++}`);
          vals.push(name);
        }
        if (notes !== undefined) {
          sets.push(`notes = $${i++}`);
          vals.push(notes);
        }
        vals.push(workoutId);
        await client.query(`update public.workouts set ${sets.join(", ")}, updated_at = now() where id = $${i}`, vals);
      }
```

Substituir por:

```ts
      if (name !== undefined || notes !== undefined || icon !== undefined) {
        const sets: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        if (name !== undefined) {
          sets.push(`name = $${i++}`);
          vals.push(name);
        }
        if (notes !== undefined) {
          sets.push(`notes = $${i++}`);
          vals.push(notes);
        }
        if (icon !== undefined) {
          sets.push(`icon = $${i++}`);
          vals.push(icon);
        }
        vals.push(workoutId);
        await client.query(`update public.workouts set ${sets.join(", ")}, updated_at = now() where id = $${i}`, vals);
      }
```

Localizar a query de retorno do detail no PATCH (está num segundo `withTx` após o update):

```ts
      const wQ = await client.query<{ id: string; name: string; notes: string | null; created_at: any }>(
        `select id, name, notes, created_at from public.workouts where id = $1`,
        [workoutId],
      );
      const w = wQ.rows[0]!;
      const exQ = await client.query(
        `select id, position, wger_exercise_id, exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group from public.workout_exercises where workout_id = $1 order by position`,
        [workoutId],
      );
      return {
        id: w.id,
        name: w.name,
        notes: w.notes,
        created_at: (w.created_at instanceof Date ? w.created_at : new Date(w.created_at)).toISOString(),
        exercises: exQ.rows,
      };
```

Substituir por:

```ts
      const wQ = await client.query<{ id: string; name: string; notes: string | null; icon: string | null; created_at: any }>(
        `select id, name, notes, icon, created_at from public.workouts where id = $1`,
        [workoutId],
      );
      const w = wQ.rows[0]!;
      const exQ = await client.query(
        `select id, position, wger_exercise_id, exercise_id, name_snapshot, sets, reps, rest_seconds, notes, muscle_group from public.workout_exercises where workout_id = $1 order by position`,
        [workoutId],
      );
      return {
        id: w.id,
        name: w.name,
        notes: w.notes,
        icon: w.icon,
        created_at: (w.created_at instanceof Date ? w.created_at : new Date(w.created_at)).toISOString(),
        exercises: exQ.rows,
      };
```

- [ ] **Step 7: Reiniciar o backend e verificar**

```bash
cd /mnt/h/Actus/backend && docker compose restart api
```

Aguardar ~5s e checar os logs:

```bash
docker compose logs api --tail=20
```

Esperado: nenhum erro de compilação TypeScript.

- [ ] **Step 8: Commit**

```bash
git -C /mnt/h/Actus add backend/api/src/routes/workouts.ts
git -C /mnt/h/Actus commit -m "feat(api): campo icon nas rotas de workouts (GET list, GET detalhe, POST, PATCH)"
```

---

## Task 6: Atualizar tipos Zod no app

**Files:**
- Modificar: `app/src/types/workouts.ts`

- [ ] **Step 1: Adicionar `icon` ao `ProWorkoutListItemSchema`**

Localizar:

```ts
export const ProWorkoutListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  exercise_count: z.number().int().nonnegative(),
  created_at: z.string(),
});
```

Substituir por:

```ts
export const ProWorkoutListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  icon: z.string().nullable().optional(),
  exercise_count: z.number().int().nonnegative(),
  created_at: z.string(),
});
```

- [ ] **Step 2: Adicionar `icon` ao `ProWorkoutDetailSchema`**

Localizar:

```ts
export const ProWorkoutDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  exercises: z.array(ProWorkoutExerciseSchema),
});
```

Substituir por:

```ts
export const ProWorkoutDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  icon: z.string().nullable().optional(),
  created_at: z.string(),
  exercises: z.array(ProWorkoutExerciseSchema),
});
```

- [ ] **Step 3: Adicionar `icon` ao `CreateWorkoutBodySchema`**

Localizar:

```ts
export const CreateWorkoutBodySchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  exercises: z.array(CreateWorkoutExerciseSchema).min(1).max(200),
});
```

Substituir por:

```ts
export const CreateWorkoutBodySchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  icon: z.string().max(40).optional().nullable(),
  exercises: z.array(CreateWorkoutExerciseSchema).min(1).max(200),
});
```

- [ ] **Step 4: Adicionar `icon` ao `PatchWorkoutBodySchema`**

Localizar:

```ts
export const PatchWorkoutBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(5000).nullable().optional(),
    exercises: z.array(CreateWorkoutExerciseSchema).min(1).max(200).optional(),
  })
  .refine((o) => o.name !== undefined || o.notes !== undefined || o.exercises !== undefined, {
    message: 'empty_patch',
  });
```

Substituir por:

```ts
export const PatchWorkoutBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(5000).nullable().optional(),
    icon: z.string().max(40).optional().nullable(),
    exercises: z.array(CreateWorkoutExerciseSchema).min(1).max(200).optional(),
  })
  .refine(
    (o) => o.name !== undefined || o.notes !== undefined || o.icon !== undefined || o.exercises !== undefined,
    { message: 'empty_patch' },
  );
```

- [ ] **Step 5: Verificar tipagem**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit 2>&1 | grep workouts
```

Esperado: nenhum erro.

- [ ] **Step 6: Commit**

```bash
git -C /mnt/h/Actus add app/src/types/workouts.ts
git -C /mnt/h/Actus commit -m "feat(types): campo icon nos schemas Zod de workouts"
```

---

## Task 7: Atualizar o builder `montar-treino.tsx`

**Files:**
- Modificar: `app/app/montar-treino.tsx`

Mudanças:
1. Importar `MuscleIcon`, `MuscleIconPicker`, `suggestIcon`, `MUSCLE_ICON_LABELS`, `MuscleIconKey`
2. Adicionar estados `iconKey` e `iconOverridden`
3. `useEffect` que recalcula a sugestão ao mudar exercícios (quando não há override)
4. Hidratar `iconKey` e `iconOverridden` no modo edição
5. Adicionar estado `pickerOpen`
6. Incluir barra de ícone sugerido no passo 2 (acima da lista)
7. Mostrar ícone escolhido no passo 3 (revisão)
8. Incluir `icon: iconKey` nos payloads de create e update
9. Renderizar `<MuscleIconPicker />`

- [ ] **Step 1: Adicionar imports**

Localizar os imports existentes no início do arquivo. Após a linha `import { darkTheme } from '@/theme';`, adicionar:

```ts
import { MuscleIcon, MuscleIconPicker } from '@/components/muscles';
import { suggestIcon, MUSCLE_ICON_LABELS, type MuscleIconKey } from '@/lib/muscleIcons';
```

- [ ] **Step 2: Adicionar estados de ícone**

Localizar os estados do componente após `const [nameError, setNameError] = useState<string | undefined>(undefined);`:

```ts
  const [nameError, setNameError] = useState<string | undefined>(undefined);
```

Adicionar após essa linha:

```ts
  const [iconKey, setIconKey] = useState<MuscleIconKey | null>(null);
  // true quando o personal escolheu manualmente — impede que a sugestão sobrescreva.
  const [iconOverridden, setIconOverridden] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
```

- [ ] **Step 3: Adicionar `useEffect` de sugestão automática**

Localizar o `useEffect` que gerencia a animação de reveal:

```ts
  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
```

Adicionar um novo `useEffect` logo ANTES desse bloco:

```ts
  // Recalcula sugestão de ícone sempre que os exercícios mudam,
  // mas só aplica se o personal não escolheu manualmente.
  useEffect(() => {
    if (iconOverridden) return;
    const groups = exercises.map((e) => e.muscleGroup);
    const suggestion = suggestIcon(groups);
    setIconKey(suggestion);
  }, [exercises, iconOverridden]);
```

- [ ] **Step 4: Hidratar ícone no modo edição**

Localizar o `useEffect` de hidratação (o que chama `setHydrated(true)`). Está assim:

```ts
    setExercises(
      [...detail.data.exercises]
        .sort((a, b) => a.position - b.position)
        .map((e) => ({
          name: e.name_snapshot,
          exerciseId: e.exercise_id ?? null,
          wgerExerciseId: e.wger_exercise_id ?? null,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.rest_seconds,
          notes: e.notes,
          muscleGroup: e.muscle_group,
        })),
    );
    setHydrated(true);
```

Adicionar as duas linhas de ícone ANTES de `setHydrated(true)`:

```ts
    if (detail.data.icon) {
      setIconKey(detail.data.icon as MuscleIconKey);
      setIconOverridden(true);
    }
    setHydrated(true);
```

- [ ] **Step 5: Adicionar barra de ícone sugerido no passo 2**

Localizar o início do bloco do passo 2, após `{step === 2 ? (`:

```tsx
            {step === 2 ? (
              // --- Passo 2: lista editável de exercícios ---
              <View style={styles.form}>
                <AppText variant="eyebrow" color="tertiary">
                  Exercícios
                </AppText>
```

Adicionar a barra de ícone entre o eyebrow e a lista. Ficará assim:

```tsx
            {step === 2 ? (
              // --- Passo 2: lista editável de exercícios ---
              <View style={styles.form}>
                <AppText variant="eyebrow" color="tertiary">
                  Exercícios
                </AppText>

                {/* Barra de ícone sugerido: aparece quando há muscleGroup definido */}
                {iconKey ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Trocar ícone do treino"
                    onPress={() => setPickerOpen(true)}
                    style={styles.iconBar}
                  >
                    <MuscleIcon iconKey={iconKey} size={28} />
                    <AppText variant="bodyMd" style={styles.iconBarLabel} numberOfLines={1}>
                      {MUSCLE_ICON_LABELS[iconKey]}
                    </AppText>
                    <AppText variant="metaSmall" color="neon">
                      Trocar
                    </AppText>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Escolher ícone do treino"
                    onPress={() => setPickerOpen(true)}
                    style={styles.iconBar}
                  >
                    <AppText variant="bodySm" color="tertiary" style={styles.iconBarLabel}>
                      Sem ícone — toque para escolher
                    </AppText>
                    <AppText variant="metaSmall" color="neon">
                      Escolher
                    </AppText>
                  </Pressable>
                )}
```

- [ ] **Step 6: Mostrar ícone no passo 3 (revisão)**

Localizar o bloco `reviewHead` no passo 3:

```tsx
                <View style={styles.reviewHead}>
                  <AppText variant="eyebrow" color="tertiary">
                    Treino
                  </AppText>
                  <AppText variant="h3">{name.trim()}</AppText>
```

Substituir por (adicionar linha com ícone):

```tsx
                <View style={styles.reviewHead}>
                  <AppText variant="eyebrow" color="tertiary">
                    Treino
                  </AppText>
                  <View style={styles.reviewTitle}>
                    {iconKey ? <MuscleIcon iconKey={iconKey} size={24} /> : null}
                    <AppText variant="h3">{name.trim()}</AppText>
                  </View>
```

- [ ] **Step 7: Incluir `icon` nos payloads de save**

Localizar o `update.mutate` no `handleSave`:

```ts
      update.mutate(
        {
          id: editingId,
          body: {
            name: trimmedName,
            notes: trimmedNotes === '' ? null : trimmedNotes,
            exercises: apiExercises,
          },
        },
```

Substituir por:

```ts
      update.mutate(
        {
          id: editingId,
          body: {
            name: trimmedName,
            notes: trimmedNotes === '' ? null : trimmedNotes,
            icon: iconKey,
            exercises: apiExercises,
          },
        },
```

Localizar o `create.mutate`:

```ts
    create.mutate(
      {
        name: trimmedName,
        notes: trimmedNotes === '' ? undefined : trimmedNotes,
        exercises: apiExercises,
      },
```

Substituir por:

```ts
    create.mutate(
      {
        name: trimmedName,
        notes: trimmedNotes === '' ? undefined : trimmedNotes,
        icon: iconKey,
        exercises: apiExercises,
      },
```

- [ ] **Step 8: Renderizar `<MuscleIconPicker />`**

Localizar o `<ExerciseFormSheet` no final do JSX:

```tsx
      <ExerciseFormSheet
```

Adicionar o picker ANTES do `ExerciseFormSheet`:

```tsx
      <MuscleIconPicker
        visible={pickerOpen}
        selected={iconKey}
        onSelect={(key) => {
          setIconKey(key);
          setIconOverridden(true);
        }}
        onClose={() => setPickerOpen(false)}
      />
      <ExerciseFormSheet
```

- [ ] **Step 9: Adicionar estilos**

Localizar `addBtn` no `StyleSheet.create`:

```ts
  addBtn: {
    marginTop: theme.spacing.xs,
  },
```

Adicionar após:

```ts
  iconBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  iconBarLabel: {
    flex: 1,
  },
  reviewTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
```

- [ ] **Step 10: Verificar tipagem**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit 2>&1 | grep -E "montar-treino|MuscleIcon|muscleIcons"
```

Esperado: nenhum erro.

- [ ] **Step 11: Commit**

```bash
git -C /mnt/h/Actus add app/app/montar-treino.tsx
git -C /mnt/h/Actus commit -m "feat(builder): sugestão automática de ícone muscular + picker no passo 2"
```

---

## Task 8: Atualizar `ProWorkoutCard`

**Files:**
- Modificar: `app/app/(personal)/(tabs)/treinos.tsx`

- [ ] **Step 1: Adicionar import dos componentes de músculo**

No topo de `treinos.tsx`, localizar:

```ts
import { Barbell, CaretRight, Plus } from 'phosphor-react-native';
```

Substituir por:

```ts
import { Barbell, CaretRight, Plus } from 'phosphor-react-native';
import { MuscleIcon } from '@/components/muscles';
```

- [ ] **Step 2: Atualizar `CardProps` para incluir `icon`**

Localizar:

```ts
type CardProps = {
  // Estrutural: serve tanto p/ "Meus" (ProWorkoutListItem) quanto p/ os
  // templates do Banco (WorkoutTemplateSummary) — ambos têm estes campos.
  workout: { name: string; notes: string | null; exercise_count: number };
  onPress: () => void;
};
```

Substituir por:

```ts
type CardProps = {
  // Estrutural: serve tanto p/ "Meus" (ProWorkoutListItem) quanto p/ os
  // templates do Banco (WorkoutTemplateSummary) — ambos têm estes campos.
  workout: { name: string; notes: string | null; exercise_count: number; icon?: string | null };
  onPress: () => void;
};
```

- [ ] **Step 3: Substituir `Barbell` por `MuscleIcon` com fallback**

Localizar no componente `ProWorkoutCard`:

```tsx
      <View style={styles.cardIcon}>
        <Barbell size={22} weight="duotone" color={colors.neon} />
      </View>
```

Substituir por:

```tsx
      <View style={styles.cardIcon}>
        {workout.icon ? (
          <MuscleIcon iconKey={workout.icon} size={24} />
        ) : (
          <Barbell size={22} weight="duotone" color={colors.neon} />
        )}
      </View>
```

- [ ] **Step 4: Verificar tipagem**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit 2>&1 | grep treinos
```

Esperado: nenhum erro.

- [ ] **Step 5: Commit**

```bash
git -C /mnt/h/Actus add app/app/\(personal\)/\(tabs\)/treinos.tsx
git -C /mnt/h/Actus commit -m "feat(treinos): ícone muscular no ProWorkoutCard com fallback para Barbell"
```

---

## Task 9: Verificação final

- [ ] **Step 1: Typecheck completo**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 2: Abrir o builder no dispositivo**

Abrir `/montar-treino`, adicionar 2–3 exercícios com `muscle_group` definido.
Verificar:
- Barra de ícone sugerido aparece após o primeiro exercício com grupo
- O ícone muda conforme os exercícios adicionados
- Tocar em "Trocar" abre o picker
- Selecionar um ícone fecha o picker e atualiza a barra
- No passo 3 (revisão), o ícone aparece ao lado do nome
- Salvar o treino não retorna erro

- [ ] **Step 3: Verificar lista de treinos**

Após salvar, voltar para a tab "Treinos".
Verificar:
- O card do novo treino exibe o ícone escolhido (não o Barbell)
- Treinos sem ícone (salvos antes da migração) continuam mostrando o Barbell de fallback

- [ ] **Step 4: Verificar edição**

Abrir um treino já salvo com ícone para editar.
Verificar:
- O ícone é pré-carregado na barra do passo 2
- A sugestão não sobrescreve o ícone carregado

- [ ] **Step 5: Commit final (se necessário)**

Commitar qualquer ajuste de polish:

```bash
git -C /mnt/h/Actus add -p
git -C /mnt/h/Actus commit -m "fix(muscle-icons): ajustes de polish pós-verificação"
```
