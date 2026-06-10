# Actus — App Mobile · Bloco 0 (Fundação) + Bloco 1 (Entrada e Cadastro)

## Contexto

O Actus é um app mobile (React Native + Expo) de gestão e engajamento para personal trainers, nutricionistas e seus alunos. O backend (Node/Express + Postgres/Supabase) **já existe e está em produção** — mapeado por completo em `/mnt/h/actutus_fit_backend-main/actutus_fit_backend-main`. O app mobile não existe ainda e será criado do zero.

O usuário (Davi) é UX designer e valida cada bloco de telas antes do seguinte. Este plano cobre a **arquitetura macro + Bloco 0 + Bloco 1**. Blocos 2–6 serão planejados quando chegarmos neles.

O plano foi produzido por 2 agentes de arquitetura e revisado por 6 verificadores adversariais (contrato da API real, design system/anti-slop, engenharia RN). Os problemas críticos encontrados já estão corrigidos neste documento.

## Decisões validadas pelo designer

| Decisão | Escolha |
|---|---|
| Localização | Pasta irmã: `/mnt/h/actus_app` (repo próprio, padrão Somo: branch/davi · dev · main) |
| Perfis no v1 | Aluno + Personal + **Nutricionista** |
| Navegação aluno | 4 abas (HOJE, TREINOS, DESAFIOS, PERFIL) + **botão central neon** que inicia o treino do dia; dieta = card na Home |
| Navegação profissional | 4 abas (ALUNOS, TREINOS\|DIETAS, DESAFIOS, PERFIL); convite = botão no header de Alunos |
| Entrada | Splash → **escolha de perfil** (Sou aluno / Sou professor, fiel ao Miro) → login ou cadastro |
| Cadastro | **3 passos guiados** (convite → quem é você → acesso) com barra de progresso |
| Cards | **4px sharp** (prompt-base prevalece sobre design.md) — tabela de radius abaixo |
| Card "convidado por X" | **Manter com [MOCK]** (nome falso marcado) + solicitar `GET /invites/:code/preview` ao backend no futuro |
| Tema | Dark mode único (quiet luxury) |
| Mockups | ASCII para estrutura + **navegador (alta fidelidade) para telas-chave de cada bloco antes de implementar** |

## Regras vindas do contrato real da API (inegociáveis)

1. **Branch SEMPRE no campo `error`** (string) do body — nunca no HTTP status (status inconsistentes confirmados no código)
2. Refresh **rotaciona** o refresh_token → sempre persistir o novo
3. `change-password` **não retorna refresh_token** → action `setAccessTokenOnly` (nunca sobrescrever refresh com undefined)
4. `must_change_password` → **403** em rotas protegidas → **não deslogar**, redirecionar para troca de senha. `/auth/change-password` e `/auth/logout` são isentos do gate
5. Gatilho de refresh: **somente** `error === 'invalid_token'`. `missing_authorization` → logout direto. `invalid_credentials` → propagar à UI (nunca refresh)
6. Não existem: validação prévia de convite, nome do convidador, reset de senha, endpoint Wger, upload de foto, push, billing → tudo MOCK isolado em `src/mocks/` ou `[fluxo futuro]`
7. `GET /me` retorna `tipo` ∈ {aluno, personal, nutricionista} apenas (staff nunca aparece — `profiles.tipo` só tem 3 valores no banco). Manter staff no enum Zod como defesa, sem fluxo de UI
8. `birth_date`: formatar com componentes **locais** do Date (`getFullYear/getMonth+1/getDate`), nunca `toISOString()` — bug de off-by-one em UTC-3

---

## BLOCO 0 — Fundação

### Stack e versões (verificadas)

- **Expo SDK 55** (RN 0.83, React 19.2) — não usar SDK 56 (recém-lançado, ecossistema nativo não validado)
- **New Architecture obrigatória** (não há opt-out no SDK 55) · **Expo Go NÃO funciona** → development build com `expo-dev-client` desde o dia 1
- `react-native-unistyles@^3.2.x` + `react-native-nitro-modules` (versão **exata** da tabela de compat do Unistyles, fixada **por último**, depois de `expo install --fix`)
  - ⚠️ Risco documentado: suporte do Unistyles 3 termina no SDK 55. Mitigação: todo consumo de Unistyles isolado atrás de wrappers (`Text`, `Screen`, átomos) para baratear migração futura
- `babel.config.js`: **apenas** `['react-native-unistyles/plugin', {root:'src'}]` — no SDK 55 o `babel-preset-expo` já configura o Reanimated (não declarar `worklets/plugin` nem `reanimated/plugin` manualmente; declarar duplicado é o erro de build mais comum). Validar na instalação com `expo-doctor` + smoke test de worklet
- Demais: zustand@^5, @tanstack/react-query@^5, axios@^1.7, zod@^3.24 (decisão consciente: linha 3, estável), react-hook-form + @hookform/resolvers, @sentry/react-native@^8.13, phosphor-react-native (pin exato, peer react-native-svg do SDK), react-native-svg-transformer (dev), @react-native-community/datetimepicker, @expo-google-fonts/{barlow-condensed,barlow,share-tech-mono}, expo-{secure-store,font,splash-screen,haptics,keep-awake,linking,dev-client}

### Setup

```bash
cd /mnt/h
npx create-expo-app@latest actus_app --template blank-typescript
cd actus_app && npx expo install expo@~55.0.0 && npx expo install --fix
# git init + sistema Somo (branch/davi, dev, main) via /iniciar
```

- `tsconfig.json` estrito: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, paths `@/* → ./src/*`; ESLint `no-explicit-any: error`
- `app.config.ts`: name Actus, slug actus, **scheme `actus`** (deep link), `userInterfaceStyle: 'dark'`, splash bg `#10252D`, plugins (expo-router, expo-secure-store, expo-font, @sentry/react-native/expo). Hex hardcoded permitido **apenas** na camada de config nativa e assets — em UI, tudo via theme
- `metro.config.js`: `getSentryExpoConfig` + svg-transformer
- `.env.example`: `EXPO_PUBLIC_API_BASE_URL=`, `EXPO_PUBLIC_SENTRY_DSN=` (vars EXPO_PUBLIC_ são públicas — nunca segredos)

### Tema Unistyles (`src/theme/`)

Todos os tokens do design.md em `tokens.ts`:

- **Cores**: bgLowest `#10252D`, bgBase `#1A343F`, surface1–4 (`#203F4B` → `#406575`), neon `#CBFE00`, secondary `#4DE082`, surfaceTint `#ABD600`, textPrimary `#FFFFFF`, textSecondary `rgba(255,255,255,0.70)`, textTertiary `rgba(255,255,255,0.50)` (**rgba com alfa, não hex opaco**), textInverse `#141414`, onSurface `#E2E4CF`, outline `#8E9379`, outlineVariant `#444933`, success/warning/error/info, gradientes brand e streak
- **Radius (decisão do designer)**: `card: 4` · `tag: 4` · `input: 12` · `modal: 24` · `pill: 100`
- **Fontes**: BarlowCondensed_800/900, Barlow_400/500/600/**700** (700 exigido pelo design.md para ênfase), ShareTechMono_400
- **Tipo**: d1 72 / h1 48 / h2 32 / h3 22 / label 14 (ls 18%) / dataBig 36 / dataMed 18 / metaSmall 11 / eyebrow 10 / bodyLg 18 / bodyMd 15 / bodySm 13
- **Spacing**: 4/8/12/16/24/32 · **Motion**: screen 300ms cubic-bezier(0.4,0,0.2,1), micro 150ms · **Sombra**: só modal/sheet/dropdown

### API client (`src/api/`)

- `storage.ts`: SecureStore com chaves **separadas** para access e refresh; `setTokens` (rotação) vs `setAccessOnly` (change-password); nunca persistir senha/CPF/perfil
- `errors.ts`: `class ApiError(code, extras, httpStatus)`; enum de códigos completo incluindo `invalid_token`, `missing_authorization`, `must_change_password`, `profile_not_found`, `user_basic_info_not_found`, `only_student_can_consume`, `already_has_active_professional_for_role` (todos confirmados no código do backend)
- `client.ts`: Axios + interceptors:
  - Request: Bearer do SecureStore (exceto register/login/refresh)
  - Response: extrai `data.error` → ApiError. Decisão **pelo código**:
    - `invalid_token` → fila de refresh **single-flight** (instância crua p/ `/auth/refresh`, guard `_retry`) → retry; falha → logout
    - `missing_authorization` → logout direto
    - `must_change_password` → `apiEvents.onMustChangePassword()` **idempotente** (checa estado atual antes de navegar) — vale também para o `/me` pós-login
    - demais → propagar ApiError
- `parseApi.ts`: valida toda resposta com Zod → `ApiError('invalid_response_shape')` em mismatch

### Schemas Zod (`src/types/`)

Por domínio: `error, auth, me, invites, health` (profundidade total) + `workouts, sessions, gamification, challenges, diets, professional` (esqueleto p/ blocos futuros). Notas: `ConsumeInviteResponse` com `note` opcional + passthrough; `PatchMe` com phone/body_weight_kg nullable; datas como string + regex.

### Auth store (Zustand — `src/store/authStore.ts`)

- Estado: `{ status: 'hydrating'|'unauthenticated'|'authenticated'|'must_change_password', user: Me|null }` — **tokens nunca no estado, só SecureStore**
- **Transação atômica**: login/register → setTokens → `GET /me` → **só então** setar status final (nunca 'authenticated' antes do /me resolver — evita flash de tela autenticada antes do redirect de troca de senha)
- `hydrate()` no boot: sem refresh → unauthenticated; com refresh → /me → roteia; 403 must_change_password → gate
- `routeByTipo`: aluno → `(aluno)`, personal → `(personal)`, nutricionista → `(nutri)`

### Rotas Expo Router (`app/`)

```
app/_layout.tsx                  → providers (Gesture → Query → Stack), Sentry.wrap, apiEvents
app/index.tsx                    → Splash + boot dispatch
app/register.tsx                 → entrada do deep link actus://register?code=
app/(auth)/                      → escolha-perfil, professor-info, login, trocar-senha, cadastro/ (3 passos)
app/(aluno)/(tabs)/              → index (Hoje), treinos, desafios, perfil + botão central (stub no Bloco 0)
app/(personal)/(tabs)/           → alunos, treinos, desafios, perfil
app/(nutri)/(tabs)/              → alunos, dietas, perfil
app/_dev/health.tsx              → só __DEV__: GET /health validado por Zod (prova a fundação ponta a ponta)
```

Guards por grupo: lê authStore; status/tipo errado → `<Redirect href="/" />`.

### Átomos (`src/components/ui/`)

- **Button**: primary (pill 100, bg neon, texto inverse, Barlow Condensed 800 uppercase, press scale 0.98 + haptic; **loading = opacity no próprio fill neon**, sem Gradient Brand, sem spinner); secondary (outline `#8E9379`, radius 12 — shape diferente do primário); ghost
- **Input**: bg surface1, radius 12, foco = borda neon + glow surfaceTint sutil (único glow permitido no app); toggle senha Phosphor Eye/EyeSlash duotone
- **KpiNumber**: Share Tech Mono 36/18, accent neon
- **Tag**: radius 4 sharp
- **Screen / Text / Logo**: wrappers (isolam Unistyles); Logo renderiza grupos do actus.svg
- Botão central da tab bar: fill neon **sólido**, sem glow/halo/sombra

### Sentry

`sendDefaultPii: false` + `beforeSend` scrub (Authorization, email, cpf, phone, full_name); `setUser` só com id opaco; ApiError captura só code+status, nunca body.

### Asset

`actus.svg` tem **5 grupos** (logo-horizonta, logo-vertical-2, logo-vertical, wordmark, logo-isolado) com fill em `style="fill:rgb(203,254,0)"` (inline, não atributo). Fatiar em arquivos por variante e normalizar fills para `currentColor`. Gerar rasters (splash.png, icon.png, adaptive-icon.png). Gegola.otf = `[ASSET PENDENTE]`.

### Ordem de implementação do Bloco 0

1. create-expo-app + SDK 55 + dev-client + tsconfig/eslint → 2. deps + babel/metro (validar build dev abre) → 3. app.config + assets → 4. tema → 5. fontes + splash gate → 6. Sentry → 7. schemas Zod → 8. API client (storage → errors → parseApi → client) → 9. auth store + queryClient → 10. rotas + guards → 11. átomos → 12. `_dev/health.tsx` ponta a ponta

---

## BLOCO 1 — Entrada e Cadastro

> Antes de implementar: **mockups HTML de alta fidelidade no navegador** (visual companion) das 6 telas para o designer validar/escolher variações. Só depois codar.

### Telas

| Tela | Rota | Pontos-chave |
|---|---|---|
| **Splash** | `app/index.tsx` | Logo isolado neon, bg lowest. Boot: hydrate → /me → routeByTipo. Erro de rede ≠ profile_not_found (mensagens distintas). Motion única: reveal do logo (opacity+scale 300ms) |
| **Escolha de perfil** | `(auth)/escolha-perfil` | Card "Sou aluno" (primário, denso) + linha "Sou professor" (list-row, hierarquia diferente — não 2 cards idênticos). Link "Já tenho conta". Motion única: entrada staggered |
| **Professor info** | `(auth)/professor-info` | Texto editorial: conta criada pela equipe Actus. CTA "Entrar com meus dados". `[fluxo futuro]` auto-cadastro. Link "Falar com a equipe Actus" `[ajuste: definir canal]` |
| **Login** | `(auth)/login` | Email + senha. `invalid_credentials` → "E-mail ou senha não conferem." (feedback mínimo, sem shake — o motion da tela é o reveal). **Sem "Esqueci a senha"** (não existe na API → `[fluxo futuro]`) |
| **Cadastro 3 passos** | `(auth)/cadastro/passo-{1,2,3}` | RHF + FormProvider no `_layout` do grupo; `cadastroDraftStore` (Zustand, memória) p/ deep link code + roteamento de erro entre passos. WizardProgress com rótulos mono `01 / CONVITE` (sem em-dash serial) |
| **Troca de senha** | `(auth)/trocar-senha` | Gate sem voltar (gesture bloqueado). `setAccessTokenOnly`. `invalid_credentials` → "A senha atual não confere." |

### Cadastro — detalhes críticos

- **Passo 1 (Convite)**: card "Você foi convidado por…" com **dado [MOCK]** (decisão do designer — marcado `// [MOCK — sem endpoint na API v1: GET /invites/:code/preview]`, selo "Demonstração" em dev) + input mono do código (validação local de formato base64url apenas) + selo "Código recebido pelo link" quando deep link
- **Passo 2 (Você)**: nome, nascimento (datetimepicker → formatar com **componentes locais**, nunca toISOString), gênero em chips, CPF opcional com máscara (enviar só dígitos)
- **Passo 3 (Acesso)**: email, telefone, senha (min 8) → `POST /auth/register`
- **Roteamento de erros do register** (chega no passo 3, pode pertencer a outro passo):
  - `invalid_invite` / `invite_expired` / `invite_exhausted` / `invalid_invite_professional` → volta ao **passo 1** com copy específica por código
  - `email_already_in_use` → **passo 3** (campo email + link para login) · `cpf_already_in_use` → **passo 2** (campo CPF)
  - `invalid_body` → ler `details.fieldErrors` e rotear cada campo ao passo de origem
  - `internal_error`/rede → erro form-level no passo 3, preservando dados
- Estado do form **preservado** ao navegar entre passos (FormProvider único no layout do grupo)

### Copy (voz quiet luxury — sem buzzword, sem CTA genérico)

- Erros de convite: "Convite não encontrado." / "Convite expirado." / "Convite já utilizado." / "Convite inválido."
- CTAs: "Entrar" · "Continuar" · "Criar conta" · "Recebi um convite" — nunca "Cadastre-se"/"Comece agora"
- Tabela tela → momento único de motion documentada no código

### Deep link

`actus://register?code=XXX` → `app/register.tsx` → `useLocalSearchParams<{code?: string}>()` (tipar manualmente, tratar string[]) → grava no draft store → replace para passo 1. Cold start: gate de splash preserva o code. Teste: `npx uri-scheme open "actus://register?code=aZ3kP9xQ_T"`

---

## Processo por bloco (válido para todos os blocos)

1. **Mockups de alta fidelidade** no navegador (visual companion) — 2-3 variações das telas-chave
2. Designer escolhe/ajusta → decisões registradas
3. Implementação
4. Validação no dev build (designer testa no aparelho/emulador)
5. `/salvar` na branch/davi → quando aprovado, `/fechar` para a dev

## Verificação (Bloco 0 + 1)

- `npm run typecheck` + `lint` com zero erro/any
- `npx expo-doctor` limpo
- Dev build abre com splash `#10252D` e fontes Barlow (não fonte de sistema)
- `_dev/health.tsx`: GET /health → `{ok: true}` validado por Zod, exibido em KpiNumber (prova env + axios + interceptors + parseApi + tema + fontes + átomos)
- Deep link abre cadastro com código preenchido (app fechado e em background)
- Fluxos manuais contra a API real: cadastro com convite válido/expirado/esgotado, login, troca de senha obrigatória, refresh automático após expiração do access (TTL 900s), logout
- Caso de teste do bug de fuso: selecionar 01/01/2000 no picker → payload deve conter `"2000-01-01"` (não `"1999-12-31"`)

## Pendências externas (não bloqueiam)

- `Gegola.otf` (fonte de marca) — usuário vai fornecer
- URL/canal "Falar com a equipe Actus", URLs de Termos/Privacidade
- `EXPO_PUBLIC_API_BASE_URL` de produção e DSN do Sentry
- Futuro (backend): endpoint `GET /invites/:code/preview` para o card do convidador deixar de ser mock
