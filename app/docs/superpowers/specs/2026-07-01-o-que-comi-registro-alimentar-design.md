# O que comi — Registro Alimentar do aluno (front mobile) — Design

**Issues:** [TEC-62](https://linear.app/actusfit/issue/TEC-62) (criar o front) · pai [TEC-14](https://linear.app/actusfit/issue/TEC-14) (Registro Alimentar "O que comi") · relacionada [TEC-58](https://linear.app/actusfit/issue/TEC-58) (feed + comentários no web).
**Data:** 2026-07-01
**Autor:** Davi (via Claude Code)

## Contexto

O aluno registra refeições ("o que comi") no app mobile: foto e/ou descrição, horário, tags. O profissional vê o feed no web (TEC-58) e comenta — o comentário dispara push ao aluno. Este spec cobre **só o front mobile do aluno** (TEC-62).

**Estado do backend:** o backend de refeições **não existe** ainda — nem no monorepo local nem no repositório de produção `Actus-gyn/Actus_backend`. Só há a especificação em `web/docs/backend/tec-58-alimentacao.md`. Decisão do Davi: **construir o front ligado à API specada** (sem mock), com estados de vazio/erro, para "só funcionar" quando o backend subir. As pendências de backend estão listadas no fim e serão entregues ao Julio.

## Escopo (V1, aprovado)

Incluído: registro (foto/descrição/horário) · feed em timeline agrupado por dia · exibir comentários do personal (read-only no mobile) · tags · sync offline · excluir/editar refeição.

Fora: contagem de calorias; escrever comentários pelo mobile (é do web).

## Navegação (decisão aprovada: Opção B)

Mantém as 4 abas atuais do aluno. A Alimentação entra como:
- **Card `AlimentacaoCard` na tela HOJE** (`app/(aluno)/(tabs)/index.tsx`), no mesmo padrão do `DietCard`, com ícone `ForkKnife`/`Bowl` (Phosphor duotone) → abre a tela dedicada.
- **Tela dedicada** `app/(aluno)/alimentacao.tsx`: feed + FAB "+".

## Contrato de dados (espelha o web + extensões)

`src/types/meals.ts` (Zod, toda resposta validada — regra do app):

```ts
MealComment = { id, author_id, author_name?: string|null, body, created_at }
MealLog = {
  id, student_id,
  photo_url: string | null,
  eaten_at: string,        // ISO datetime
  description: string | null,
  tags: string[],          // EXTENSÃO — ver pendências backend
  created_at: string,
  comments: MealComment[], // default []
}
MealLogsResponse = { meals: MealLog[] }
```

Endpoints consumidos:
- `GET /me/meals` — feed do próprio aluno (com comentários). **Na spec.**
- `POST /me/meals` — multipart (photo, description, eaten_at, tags[]). **Na spec** (falta `tags`).
- `PATCH /me/meals/:id` — editar description/eaten_at/tags/photo. **NOVO.**
- `DELETE /me/meals/:id` — excluir. **NOVO.**

## Componentes e arquivos

Seguindo convenções do app (Unistyles + tokens, Phosphor duotone, 1 momento de motion por tela, sombra só em modal/sheet).

- `src/types/meals.ts` — schemas Zod + tipos.
- `src/hooks/useMeals.ts`:
  - `useMeals()` → `GET /me/meals`, `retry: false`, `staleTime` curto.
  - `useCreateMeal()` → `POST` multipart (mesma estratégia de `useUploadAvatar`: `fetch` + `FormData`, não axios).
  - `useUpdateMeal()` → `PATCH`.
  - `useDeleteMeal()` → `DELETE`.
  - Todas invalidam a query da lista no sucesso.
- `src/store/mealQueueStore.ts` — fila offline (Zustand + persistência no padrão do `onboardingStore`: SecureStore nativo / localStorage web). Item = `{ localId, photoUri?, description?, tags, eatenAt, status: 'pending'|'error' }`. Payload pequeno (uri local + texto).
- `src/lib/meals.ts` — agrupamento por dia (datas **locais** via `formatDateLocal`), rótulos de horário/dia, validação do "Salvar" (`eatenAt` + (`description` OU `photo`)).
- `app/(aluno)/alimentacao.tsx` — tela do feed.
- `src/components/meals/`:
  - `MealCard` — foto (ou placeholder), horário, descrição, chips de tags, comentários do personal (bloco "Comentário do Personal" colapsável), badge de status de sync, ação editar/excluir (overflow ou swipe → `ConfirmDialog` para excluir).
  - `MealFormSheet` — bottom sheet adicionar/editar: foto (câmera/galeria via `expo-image-picker`), descrição, horário (`@react-native-community/datetimepicker`, default agora), chips de tags. Respeita safe-area inferior (padrão do TEC-75). "Salvar" habilita com horário + (descrição OU foto).
  - `AlimentacaoCard` (em `src/components/home/`) — entrada na HOJE.
  - `DayHeader` — cabeçalho de agrupamento por dia.

Tags (chips): Café da manhã, Almoço, Lanche, Jantar, Pré-treino, Pós-treino (fixas no V1; customização fica para depois).

## Fluxo de dados

- **Feed** = merge de `useMeals` (servidor) + itens `pending`/`error` do `mealQueueStore`, agrupados por dia, ordem reversa. Itens não sincronizados mostram badge "Aguardando sincronização" e não aceitam comentário.
- **Adicionar**: `MealFormSheet` → online: `useCreateMeal` (POST multipart) → invalida a lista. Offline/erro: enfileira no `mealQueueStore` (status `pending`).
- **Sync offline (sem novo módulo nativo)**: detecção implícita — o item entra na fila quando criado offline ou quando o POST falha; o **flush** roda no foreground do app (`AppState`), em retry manual (toque no badge) e após um POST bem-sucedido. Sem `netinfo`/`expo-network` no V1 (evita rebuild do dev client); detecção proativa de rede fica como melhoria futura.
- **Editar/Excluir**: item já sincronizado → `PATCH`/`DELETE` (online; se offline, toast "sem conexão"). Item ainda na fila → edita/remove direto no `mealQueueStore`. Excluir confirma via `ConfirmDialog`.
- **Comentários**: read-only no mobile; exibe autor + timestamp. Push ao aluno é responsabilidade do backend.

## Erros e estados

- Vazio: "Nenhuma refeição registrada" + CTA adicionar.
- Erro de carga: retry discreto.
- Falha de upload: item fica `error` na fila com "falha ao enviar — tentar de novo".
- Sucesso de ação: toast (`ToastHost` existente).

## Limitação conhecida (V1)

A fila offline referencia a **URI local** da foto; se o SO limpar o cache antes do sync, a foto pode se perder. Robustez (copiar o arquivo para o storage do app) fica como follow-up.

## Testes

- `src/lib/meals` — agrupamento por dia + validação do "Salvar".
- `src/types/meals` — parsing dos schemas (incl. defaults).
- `mealQueueStore` — enfileirar / marcar erro / remover / flush.
- Componentes: estados do `MealCard` (com/sem foto, com comentários, pending/error) e validação do `MealFormSheet`.

## Pendências de backend (entregar ao Julio — TEC-62/TEC-58)

1. `GET /me/meals` (feed próprio com comentários embutidos) — specado.
2. `POST /me/meals` multipart (photo, description, eaten_at, **tags[]**) — specado; adicionar `tags`.
3. **`PATCH /me/meals/:id`** (editar description/eaten_at/tags/photo) — novo.
4. **`DELETE /me/meals/:id`** — novo.
5. Migration: tabelas `meal_logs` + `meal_log_comments` (ver `tec-58-alimentacao.md`) **+ coluna `tags text[]`**.
6. Storage de imagem: disco local em dev → S3/Supabase em produção.
7. Push ao aluno no comentário do profissional (serviço existente `pushService.ts`).
