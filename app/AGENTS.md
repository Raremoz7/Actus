# Actus — App Mobile

App de gestão e engajamento para personal trainers, nutricionistas e alunos. React Native + **Expo SDK 55** (docs: https://docs.expo.dev/versions/v55.0.0/), TypeScript estrito.

O backend (Node/Express + Postgres) vive neste monorepo em `../backend/` — cópia editável da versão em produção. O original `/mnt/h/actutus_fit_backend-main/actutus_fit_backend-main` é só referência do que está em produção (**nunca modificar**).

## Documentos de design (LEIA antes de qualquer tela)

- `../backend/design.md` — design system Actus (tokens, tipografia, componentes)
- `../backend/SOMO_DESIGN_CONSTRAINTS.md` — restrições anti-AI-slop obrigatórias

## Stack (inegociável)

Expo SDK 55 (dev build — **Expo Go não funciona**) · Expo Router · Unistyles 3 · Zustand · TanStack Query v5 + Axios · Zod (toda resposta da API validada) · SecureStore (tokens) · Phosphor duotone · Reanimated · Sentry sem PII

## Regras críticas da API (violar = bug em produção)

1. **Branch SEMPRE no campo `error`** (string) do body — nunca no HTTP status
2. Refresh **rotaciona** o refresh_token → persistir o novo
3. `change-password` não retorna refresh novo → `tokenStorage.setAccessOnly()`
4. `must_change_password` chega como **403** → NÃO deslogar; ir para troca de senha
5. Gatilho de refresh: só `error === 'invalid_token'`. `missing_authorization` → logout. `invalid_credentials` → UI
6. Datas de calendário: formatar com componentes **locais** do Date (`formatDateLocal` em `src/lib/format.ts`) — nunca `toISOString()` (bug de fuso UTC-3)
7. Sem endpoint na API = MOCK isolado em `src/mocks/` com marcador `// [MOCK — sem endpoint na API v1]`

## Regras de design (violar = retrabalho)

- Tudo via tokens do theme (`src/theme/tokens.ts`) — **nunca hex hardcoded** em componente
- Radius: cards **12px** · inputs 12 · tags 4 · modais 24 · botões pill 100
- Botão primário: pill neon, texto `#141414` (token textInverse), Barlow Condensed 800 uppercase
- Sombra só em modal/sheet/dropdown · **1 momento de motion por tela**
- Fontes: Barlow Condensed (display) / Share Tech Mono (dados) / Barlow (corpo) — nunca Inter/Roboto/Poppins
- Ícones: Phosphor duotone — nunca Lucide/Heroicons
- Copy quiet luxury: específica, sem buzzword, sem "Comece agora"/"Saiba mais", sem emoji em bullet

## Processo de trabalho

- Construção **por blocos** (0–6), com validação do designer (Davi) ao fim de cada bloco
- Antes de implementar telas de um bloco: mockups de alta fidelidade para o designer escolher
- Plano vigente do Bloco 0+1: ver `docs/plano-bloco-0-1.md`
- Branches Somo: trabalhar em `branch/davi`, integrar na `dev` via `/fechar`, nunca commitar direto na dev/main

## Comandos

```bash
npm run start        # expo start --dev-client (precisa de development build)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npx expo-doctor      # sanidade das deps
```

## Pendências conhecidas

- `Gegola.otf` (fonte de marca) — aguardando o designer; usar actus.svg como marca
- Endpoint `GET /invites/:code/preview` — solicitado ao backend (card do convidador é [MOCK] até existir)
- Reset de senha — não existe na API → `[fluxo futuro]`, não criar link "Esqueci a senha"
- Par-Q — endpoints implementados no `backend/` do monorepo (ver `backend/docs/CHANGES-actus.md` B5); o front consome a API real via `src/hooks/useParq.ts` (mock removido). Aplicar no backend de produção.
- Banco de Treinos (templates curados) — INTEGRADO ao endpoint real `GET /workout-templates` (admin cria no web, todos os autenticados leem). App: `src/hooks/useWorkoutTemplates.ts` + tela `treinos.tsx` (escopo "Banco") + preview `banco-treino/[id].tsx`. "Clonar e editar" usa `POST /workout-templates/:id/copy` (cria workout no servidor → `workout_id` → abre o builder). Contrato em `backend/api/src/routes/workoutTemplates.ts`. ⚠️ Rotas existem no backend do monorepo, mas precisam ser aplicadas em PRODUÇÃO antes de funcionar no app publicado. O seed editorial antigo (`src/data/workoutLibrary.ts`) e os componentes `ObjetivoChips`/`LibraryWorkoutCard` foram REMOVIDOS — templates não têm objetivo/nível, então o Banco virou lista plana (sem filtro por objetivo).
- Dashboard profissional (aba Início) — KPIs vêm de listas reais (alunos/treinos/dietas/desafios). Engajamento agregado (adesão, check-ins recentes, inadimplência) pediria `GET /professional/overview`; hoje é o bloco "Engajamento · em breve".
- Onboarding (história aluno + PDF professor) — sinais consolidados ao backend:
  1. `POST /auth/register`: tornar `invite_code` e `birth_date` opcionais (cadastro sem vínculo, baixa fricção). Front pronto; sem convite só funciona via devMocks até lá.
  2. `POST /auth/register-professional` (novo): { email, password ≥8, full_name, phone, lgpd_consent, policy_version } → cria `profiles.tipo='personal'` ATIVO + tokens (igual register). Perfil profissional vem depois (item 6).
  3. `GET /invites/:code/preview` (reforço): incluir NOME do profissional + `professional_role` — requisito da história ("Você foi convidado por João Personal").
  4. ✅ Upload de foto de perfil (aluno e professor) — `POST /me/avatar` (real) ligado no `FotoStep` via `expo-image-picker` + `useUploadAvatar`. ⚠️ Exige **rebuild do dev client** (módulo nativo do picker) e plugin já adicionado no `app.config.ts`. Storage do avatar no backend ainda é disco local (trocar por S3/Supabase em produção).
  5. Preferências do aluno (interesse, experiência, dias/semana, local, altura) — persistir e expor ao profissional vinculado. Front roda sobre `src/mocks/studentOnboarding.ts`.
  6. ✅ Perfil profissional (nome profissional, área de atuação, CREF opcional, experiência, cidade/UF, forma de uso) — `GET/PATCH /me/professional-profile` (real) + migration `20260622130000_actus_professional_self_profile.sql` (colunas em `professional_info`). Front em `src/api/professionalProfile.ts` (mock removido). ⚠️ Migration precisa ser aplicada em produção.
  7. Flag de onboarding concluído no /me (hoje gate local em `src/store/onboardingStore.ts`).
