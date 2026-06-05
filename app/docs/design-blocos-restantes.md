# Design dos blocos restantes — decisões (maratona 05/06/2026)

Validado pelo designer (Davi) via mockups (visual companion). Agrupado por **arquétipo de tela** (decisão: reusar padrão entre perfis). Todos seguem o design system Actus: dark + neon, Barlow Condensed/Share Tech Mono, **cards 12px**, Phosphor duotone, **zero emoji** ([[nunca-emoji-sempre-icones]]), 1 motion por tela, datas locais (nunca toISOString), tudo via `parseApi`+Zod.

## 1. Perfil / Conta — **B (identidade + stats)**
Serve aluno · personal · nutri. Card de identidade (avatar + nome + @user/tipo) → faixa de **stats** (aluno: peso · sequência · treinos; pro: nº alunos · CREF/CRN) → lista de ações (editar perfil, notificações, termos, **sair** em error). Dados: `GET/PATCH /me` (display_name, full_name, avatar_url, gender, body_weight_kg, phone, timezone). Logout via authStore.

## 2. Lista de alunos — **B (linhas densas + busca)**
Personal · nutri. Header "Alunos" + **botão neon de convite**. Campo de busca no topo. Linhas compactas: avatar, nome, status (último treino / aderência), ponto de cor (ativo=secondary / atenção=warning / inativo=tertiary). Dados: `GET /professional/students`. Toque → detalhe do aluno.

## 3. Player de treino — **unificado A+B+C (v3)**
Execução ao vivo, um fluxo em 3 momentos:
- **Momento 1 — Visão geral (B):** lista de exercícios + progresso no topo + "Finalizar" sempre à mão. Toca exercício → momento 2.
- **Momento 2 — Registrar série (A):** foco no exercício; séries feitas listadas; série atual com **inputs grandes** de peso/reps **centralizados verticalmente**; "Concluir série" → momento 3.
- **Momento 3 — Descanso (C):** **timer grande (≈88px) centralizado** + bolinhas de progresso das séries; "Pular descanso / +15s" → volta ao momento 2 na próxima série.
Ciclo até finalizar (+ check-in). Endpoints: POST `/me/workouts/:swid/sessions` (criar), `/start`, PATCH `…/exercises/:id`, PUT `…/exercises/:id/sets`, POST `/finish` (early_finish, with_check_in), `/me/workouts/sessions/:id` (estado). Regra: evitar `margin-top:auto` com vão — centralizar o miolo.

## 4. Builder (montar treino / criar dieta) — **unificado**
- **Criar do zero = C (wizard):** passo 1 nome/foco → passo 2 exercícios (reordenável) → passo 3 revisar/atribuir.
- **Adicionar item = B (bottom sheet):** sheet com busca no catálogo (Wger) reusado em criar E editar → escolhe → define séries/reps (ou refeição/macros na dieta).
- **Pronto / Editar = A (lista editável):** nome + foco + itens com chips, editar/reordenar/excluir inline, "+ Adicionar" (reabre sheet B), "Salvar". 
Serve treino (exercícios) e **dieta** (refeições/macros). Endpoints treino: `/workouts` (CRUD), `/students/:id/workouts` (atribuir). Dieta: `/students/:id/diets` + diet builder (confirmar shape no backend).

## 5. Card de exercício PADRONIZADO — **Híbrido + imagem [MOCK]**
**Um componente só**, reusado em detalhe do treino · player · builder.
- **Listas:** thumbnail à esquerda + nome + tag muscular + **equipamento** (barra/máquina/polia) + séries×reps.
- **Tocar → tela de demo do exercício:** imagem grande + instrução (nova tela leve).
- **Imagem:** slot pronto, mas **placeholder = ícone do grupo muscular**, marcado `[MOCK — sem endpoint na API v1]` até o backend expor a URL do Wger pelo `wger_exercise_id`. Equipamento idem (Wger).
- **Retrofit:** substituir o `ExerciseCard` atual do bloco Treinos por este padronizado.

## 6. Desafios (aluno) — **lista A, detalhe B**
- **Lista (principal) = A:** cards com barra de progresso + badge de posição; **convites** no topo (aceitar/recusar). Dados: `GET /me/challenges`, POST `/accept`,`/decline`.
- **Detalhe = B:** desafio herói + **ranking/leaderboard completo** (você destacado em neon). Dados: `GET /me/challenges/:id/ranking`. Visibilidade: private_ranking / public_among_participants.
- Pro: criar/gerenciar desafios (reusa Builder + participantes).

## 7. Convite (profissional)
- **Tela principal = gestão A (cards):** lista de convites gerados — código, status (ativo/esgotado/expirado), usos (used/max), validade, ações (compartilhar · copiar · revogar). "Novo convite" no header e rodapé.
- **Criar = C (configurar):** validade / limite de usos / vínculo (role) → "Gerar".
- **Após gerar = A (sheet compartilhar):** código em destaque + "Compartilhar" (WhatsApp) + copiar link (`actus://register?code=`). QR opcional.
Dados: `/invites` (criar/listar/revogar) — invites: code, professional_role, expires_at, max_uses, used_count.

## Ordem de implementação (dependências)
1. **Card de exercício padronizado + tela de demo** (cross-cutting; retrofita Treinos) — base do player/builder.
2. **Player de treino** (aluno) — desbloqueia o "Iniciar treino" stub.
3. **Perfil/Conta** (compartilhado; baixo risco).
4. **Desafios** (aluno: lista + detalhe/ranking).
5. **Área profissional:** Lista de alunos + detalhe → Convite (gestão/criar/share) → Builder de treinos + atribuir → Desafios pro.
6. **Nutri:** Lista de alunos + Builder de dietas + atribuir.

## Pendências de dados (a confirmar/MOCK no backend)
- Imagem + equipamento do exercício (Wger) → [MOCK] até backend expor.
- Shape de criação de dieta (diet builder) — confirmar no backend.
- Reconciliar `useTodayWorkout` do HOJE (usa schema fictício) com a lista real `/me/workouts` via `pickNextWorkout`.
- Sem `origin` remoto no repo → trabalho fica local nas branches; integração manual.
