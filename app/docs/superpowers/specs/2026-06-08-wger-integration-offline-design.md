# Integração Wger — offline-first, app-only

> Spec de design. Data: 2026-06-08. Branch: `branch/davi`.
> Substitui a pendência aberta em `docs/backend-pendencias.md` seção C (decisão: **app-only offline**, não backend-proxy).

## Objetivo

Substituir os mocks de exercício do app por dados reais do Wger (https://github.com/wger-project/wger):

- **Busca real** ao montar treino — hoje o profissional digita o nome à mão e o `wger_exercise_id` é placeholder (=1).
- **Mídia real** (imagem + descrição + vídeo) nas telas de visualização — hoje é foto ilustrativa do Unsplash por grupo muscular.

Tudo **offline-first**: o app de academia precisa funcionar com sinal ruim na hora do treino.

## Decisões (validadas)

| Decisão | Escolha | Porquê |
|---|---|---|
| Origem dos dados | **App-only, snapshot empacotado** | Funciona offline; backend não muda (já tem os campos). |
| Mídia offline | **Empacotar texto + todas as imagens** (~10 MB) | Só existem 357 imagens no Wger → empacotar tudo custa pouco e dá offline total. |
| UX da busca (builder) | **Buscar → prescrever** (sheet em 2 passos) | Separa "qual exercício" de "como prescrever"; garante o ID real. |
| UX da mídia (exercício) | **Herói cinematográfico + botão de vídeo** | Mantém o impacto visual atual; vídeo quando o Wger tiver. |
| Idioma | **PT com fallback EN** | Cobre o máximo de exercícios sem buracos. |
| Exercícios legados | **Conviver com fallback** (sem migração) | Treinos antigos seguem funcionando com placeholder. |
| Texto livre no builder | **Não — só busca Wger** | Garante `wger_exercise_id` e mídia sempre. |

## Backend

**Inalterado.** `POST/PATCH /workouts` já aceitam `wger_exercise_id` (int) e `name_snapshot` (string). Hoje o app manda placeholder; passa a mandar os valores reais que a busca local devolve. Nenhum endpoint novo.

## Números (Wger, consultado em 2026-06-08)

- 851 exercícios no catálogo.
- 357 imagens no total (~58% dos exercícios não têm imagem → placeholder inevitável para esses).
- Tamanho adicionado ao app: ~1–2 MB texto + ~8–10 MB imagens ≈ **+~10 MB**.

## Arquitetura / unidades

### 1. Pipeline de snapshot (build-time) — `scripts/build-wger-snapshot.mjs`

Script Node que roda no dev (online), não no runtime do app.

- Pagina o catálogo do Wger (`/api/v2/exercisebaseinfo/` + categorias/equipamentos/músculos/traduções/imagens/vídeos).
- Normaliza cada exercício para o shape enxuto (ver §Catálogo).
- Baixa as 357 imagens, redimensiona (~400px) e comprime (webp) para `assets/wger/images/<wgerId>.webp`.
- Gera `assets/wger/catalog.json` (851 entradas) + um `assets/wger/images.ts` (require-map `wgerId → require('./images/<id>.webp')`).
- **Idempotente**: re-rodar regenera o snapshot. Grava `generated_at` e versão do dataset no JSON.
- Valida o shape com Zod ao gerar (falha cedo se o Wger mudar o contrato).
- Atribuição: registra a licença CC-BY-SA (dado e imagens) num `assets/wger/ATTRIBUTION.md`.

> **Atualização do catálogo = re-rodar o script + release do app.** Sem sync online (YAGNI).

### 2. Catálogo local (runtime) — `src/lib/wger/catalog.ts`

Lê o `catalog.json` empacotado. Tudo offline.

- `WgerExercise` (shape): `{ id, name_pt, name_en, category, equipment[], muscles[], description_pt, description_en, hasImage, hasVideo }`. O `id` é o **id da "exercise base"** do Wger (não o id da tradução) — é a chave que casa com as imagens e que vira o `wger_exercise_id` enviado ao backend.
- `searchExercises(term: string, limit?): WgerExercise[]` — busca local normalizada (sem acento, case-insensitive) sobre nome PT (fallback EN), ordenada por relevância (prefixo > substring).
- `getExercise(wgerId: number): WgerExercise | null`.
- `exerciseName(ex)` / `exerciseDescription(ex)` — resolvem idioma PT→EN por campo.

### 3. Mídia local — `src/lib/wger/media.ts`

- `wgerImageSource(wgerId): ImageSourcePropType | null` — lê do require-map; `null` quando não há imagem (→ placeholder por grupo).
- `wgerVideoUrl(wgerId): string | null` — só quando `hasVideo` (link/stream do Wger; **online**).

### 4. Builder — picker de busca (UX A) — `src/components/builder/ExerciseFormSheet.tsx`

Vira 2 passos dentro do sheet:

- **Passo "buscar"**: campo de busca + lista de resultados de `searchExercises` (thumb local + nome + grupo·equipamento). Tocar escolhe.
- **Passo "prescrever"**: nome travado (do Wger) + séries/reps/descanso/observação (form atual). Voltar reabre a busca.
- `onConfirm` devolve `{ name, wger_exercise_id, muscleGroup, sets, reps, restSeconds, notes }`. O `muscleGroup` (texto PT) sai da **categoria do Wger** via um mapa categoria→PT alinhado aos `MUSCLE_GROUPS` atuais (Chest→Peito, Back→Costas, Legs→Pernas, Arms→Braço, Shoulders→Ombro, Abs→Core, Calves→Pernas, Cardio→Cardio); fallback para a categoria crua se não mapear.
- `montar-treino.tsx` / `useWorkoutMutations.ts` passam a enviar o `wger_exercise_id` real (remove o placeholder=1).
- Sem campo de texto livre.

### 5. Telas de visualização — mídia real

- `src/components/workouts/ExerciseThumb.tsx` e `WorkoutCardPhoto.tsx`: trocam `exerciseImageUrl(muscle)` por `wgerImageSource(wger_exercise_id)`, com fallback no placeholder por grupo (mantém `lib/exerciseImage.ts` como fallback).
- `app/(aluno)/exercicio/[id].tsx`: herói com a imagem real do Wger; descrição real (PT/EN); botão **"Ver demonstração em vídeo"** quando `hasVideo`, senão o aviso honesto atual. Crédito "Wger · CC-BY-SA" discreto.

## Fluxo de dados

```
build-time:  build-wger-snapshot.mjs → assets/wger/{catalog.json, images/, images.ts}
runtime busca:  builder → catalog.searchExercises (local) → { name, wger_exercise_id } → POST /workouts (backend)
runtime mídia:  tela lê wger_exercise_id (do backend) → catalog.getExercise + media.wgerImageSource (local)
```

## Erros / fallback

- Exercício legado (sem `wger_exercise_id` real / nome livre antigo) → sem mídia Wger → placeholder por grupo (comportamento atual).
- Exercício com id mas sem imagem (357/851) → placeholder por grupo.
- Sem vídeo → aviso honesto atual.
- `catalog.json` ausente/ilegível → catálogo vazio; telas caem no placeholder; app não quebra.
- Idioma: PT por campo, fallback EN.

## Testes

- `catalog.searchExercises`: normalização de acentos, fallback de idioma, ordenação (prefixo antes de substring), limite.
- `catalog.getExercise` / resolvers de idioma: PT presente, só EN, ausente.
- `media.wgerImageSource`: id com imagem → source; sem imagem → null.
- `ExerciseFormSheet`: fluxo buscar→prescrever devolve o shape com `wger_exercise_id`; voltar reabre a busca.
- Telas de visualização: render com imagem real e com fallback.
- Script de snapshot: não tem unit test (build-time), mas valida shape via Zod ao gerar.

## Fora de escopo (YAGNI)

- Sync online do catálogo (atualiza por release do app).
- Casar exercícios legados com o catálogo (migração por nome) — rodada futura.
- Texto livre no builder — futuro, se houver demanda por exercícios fora do Wger.

## Arquivos

**Novos:** `scripts/build-wger-snapshot.mjs`, `src/lib/wger/catalog.ts`, `src/lib/wger/media.ts`, `assets/wger/{catalog.json, images/, images.ts, ATTRIBUTION.md}`, testes correspondentes.

**Alterados:** `src/components/builder/ExerciseFormSheet.tsx`, `app/montar-treino.tsx`, `src/hooks/useWorkoutMutations.ts`, `src/components/workouts/ExerciseThumb.tsx`, `src/components/workouts/WorkoutCardPhoto.tsx`, `app/(aluno)/exercicio/[id].tsx`. `src/lib/exerciseImage.ts` permanece como fallback.

**Backend:** nenhum.
