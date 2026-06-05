# Bloco 2 — HOJE do aluno (design)

> Validado pelo designer (Davi) em 03/06/2026 via mockups de alta fidelidade no visual companion (`.superpowers/brainstorm/`). Direção escolhida: **A — Ação primeiro**, refinada.

## Contexto

Primeira tela interna do app, destino do fluxo de entrada (login → HOJE). É a tela mais usada pelo aluno: mostra o treino do dia, o ritmo da semana (streak), a dieta e um teaser de desafio. A casca de navegação (tab bar + botão central) já existe desde o Bloco 0; este bloco preenche a aba `index` do grupo `(aluno)/(tabs)`.

A numeração "Bloco 2" foi atribuída agora (o plano só formalizava 0+1; os stubs rotulavam HOJE como "Bloco 3" sem doc). Mantém-se o nome HOJE; o número é cosmético.

## Decisões validadas

| Tema | Decisão |
|---|---|
| Layout | Direção A: header → card herói do treino → faixa da semana/streak → linha dieta+desafio |
| Saudação | Por horário local: **Bom dia** (<12h) · **Boa tarde** (12–18h) · **Boa noite** (≥18h), em **linha única** |
| Estado sem treino | **Card de descanso** (ícone lua, "Dia de descanso", próximo treino + atalho "Ver treinos da semana"); sem CTA de iniciar |
| Iniciar treino | **Só** no CTA do card herói. Sem ação duplicada |
| Botão central neon | Permanece **stub** — papel definido no Bloco 5 (execução de sessão) |
| Ícones | **Phosphor duotone** sempre. **Zero emoji** em qualquer lugar da UI (ver memória `nunca-emoji-sempre-icones`) |
| Motion | 1 momento único por tela: reveal de entrada (opacity+translateY 300ms). Sem glow |
| **Token global** | `radius.card` muda de **4 → 12px** (vale pro app inteiro) |

## Mudança de sistema: radius.card 4 → 12

Em `src/theme/tokens.ts`, `radius.card` passa de `4` para `12`. Isso afeta **todos** os cards já existentes (ex.: card do convidador no cadastro, banners de erro que usam `radius.card`). Conferir visualmente que nada quebra. Atualizar:
- `AGENTS.md` (regra "cards 4px sharp" → "cards 12px")
- `docs/plano-bloco-0-1.md` (tabela de radius e linha da decisão de cards)
- `docs/decisoes-visuais-bloco-1.md` se citar 4px

`tag` permanece 4, `input` 12, `modal` 24, `pill` 100 — inalterados.

## Dados (API real) e schemas

Todos os endpoints já existem (`src/api/endpoints.ts`). Faltam schemas Zod completos — definir o **mínimo** para o resumo do HOJE; o detalhe profundo fica para os blocos donos.

| Bloco visual | Endpoint | Schema | Observação |
|---|---|---|---|
| Saudação/nome/avatar | `GET /me` | `MeSchema` (pronto) | `display_name` nullable → fallback genérico ("Olá") |
| Faixa da semana + streak | `GET /me/weekly-overview` | `WeeklyOverviewSchema` (pronto) | Dia atual via `today_weekday`; dias `completed`; `streak_current`/`streak_best` |
| Card treino do dia | `GET /me/workouts` | **novo `TodayWorkoutSummarySchema`** (mínimo) | nome, grupo muscular, nº exercícios, duração estimada, flag descanso. Detalhe = Bloco 4 |
| Card dieta | `GET /me/diets` | estende `StudentDietSchema` | título + próxima refeição. Se a API não devolver horário de refeição → `// [MOCK — sem endpoint na API v1]` para o campo "próxima refeição" |
| Card desafio (teaser) | `GET /me/challenges` | **novo `ChallengeTeaserSchema`** (mínimo) | título + progresso (atual/total). Detalhe = Bloco 7 |

Regras de data: usar `formatDateLocal` (`src/lib/format.ts`) e os componentes locais do Date — nunca `toISOString()`. A saudação por horário usa a hora **local** do aparelho.

Validar toda resposta com `parseApi` + Zod (mismatch → `invalid_response_shape`), conforme a fundação do Bloco 0.

## Arquitetura de componentes

Tela: `app/(aluno)/(tabs)/index.tsx` (substitui o placeholder). Quebrar em unidades pequenas e testáveis:

- **`src/features/home/`** (novo domínio)
  - `hooks.ts` — `useMe`, `useWeeklyOverview`, `useTodayWorkout`, `useStudentDiet`, `useChallengeTeaser` (TanStack Query v5; cada um faz `parseApi`)
  - `greeting.ts` — `greetingForHour(date): 'Bom dia'|'Boa tarde'|'Boa noite'` (puro, testável isolado)
- **`src/components/home/`** (componentes de apresentação, sem fetch)
  - `HomeHeader` — data + saudação + streak chip + avatar
  - `TodayWorkoutCard` — recebe `summary | null`; renderiza estado com-treino ou descanso (decisão por prop, não por boolean interno)
  - `WeekStrip` — recebe `WeeklyOverview`; 7 dias + linha de streak. É o foco visual da tela
  - `DietCard` / `ChallengeCard` — cards-resumo da linha inferior
- Cada componente consome **tipo** (não chama API direto) → testável com dados mock e fácil de migrar quando os schemas reais crescerem.

Estados de carregamento/erro/vazio:
- **Loading**: skeleton sóbrio por bloco (sem spinner; coerente com a regra de motion). 
- **Erro de rede**: estado discreto por bloco com retry; nunca tela cheia de erro.
- **Vazio**: sem treino → estado de descanso; sem dieta/desafio → card omitido ou estado "nada por aqui ainda".

## Copy (voz quiet luxury)

- Saudação: "Bom dia, {nome}" / "Boa tarde, {nome}" / "Boa noite, {nome}"; sem nome → "Bom dia" etc.
- Eyebrows mono uppercase: "TREINO DE HOJE", "SUA SEMANA", "DIETA", "DESAFIO", "HOJE" (descanso)
- CTA: "Iniciar treino" (verbo de resultado). Descanso: "Ver treinos da semana"
- Descanso: "Dia de descanso" + "Recuperação faz parte do plano." — sem buzzword, sem "Bora!", sem emoji
- Streak: "{n} dias seguidos" — sem exclamação

## Pendências honestas (não bloqueiam o bloco)

- "Iniciar treino" e o botão central neon navegam para um **destino stub** — a execução real da sessão é o Bloco 5
- Detalhe do treino (exercícios, séries) = Bloco 4 — o card só resume
- "Próxima refeição" da dieta pode ser `[MOCK]` se a API não expuser horário
- Confirmar no backend o shape real de `/me/workouts`, `/me/diets`, `/me/challenges` antes de fixar os schemas-resumo (hoje são esqueleto em `src/types/`)

## Verificação

- `typecheck` + `lint` zero erro/any · `expo-doctor` limpo
- `greetingForHour` com testes de fronteira (11:59 / 12:00 / 17:59 / 18:00)
- Faixa da semana destaca o dia local correto (teste do bug de fuso: usuário em UTC-3 vê o dia certo)
- Estado de descanso renderiza quando `/me/workouts` não traz treino para hoje
- Migração de `radius.card`: revisar telas do Bloco 1 que usam cards — nada quebrado visualmente
- Dado real contra a API: HOJE carrega nome, streak e cards sem mock além dos marcados
