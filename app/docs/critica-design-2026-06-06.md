# Crítica de design de produto — Actus (2026-06-06)

Revisão crítica tela a tela (5 agentes, read-only), focada em **design fraco**, **oportunidade de melhoria** e **informação faltando** — complementar ao sweep de polish mecânico (estados/tokens/a11y/copy), que foi tratado à parte.

**82 achados** · 25 design fraco · 22 melhorias · 35 info faltando · 20 high / 38 med / 24 low.

## Tema dominante: a API devolve dado rico que a UI descarta

A maior parte das oportunidades de alto impacto **não precisa de backend novo** — só de exibir o que já chega (e estender os schemas Zod que truncam o payload):

- `POST /sessions/:id/finish` devolve um **`summary` completo** (duração, calorias, volume, PR/evolução por exercício, assinatura do personal, e um **DTO `share` pronto** estilo strava). O app parseia só `WorkoutSessionSchema`, descarta o summary, e faz `router.replace` pra home. **O clímax do produto vira um fade.**
- `GET /me/workouts/:id` devolve `recent_sessions[]` (histórico) e `WorkoutExercise.notes` (instrução do personal) — **nada disso é renderizado.**
- Logging de série não mostra **a última vez / PR** (existe no histórico) → aluno digita no escuro, perde a sobrecarga progressiva.
- `last_completed_date`, `streak_best`, ranking `position`/`streak_in_challenge`, `/report` do desafio (aderência, `streak_broken_hint`), `source`/`workout_session_id` do check-in → todos chegam e somem.

---

## Aluno · HOJE e navegação

| Sev | Cat | Tela | Problema → Sugestão |
|---|---|---|---|
| HIGH | design fraco | HOJE (composição) | Pilha de cards de mesma densidade, sem herói nem ritmo (IA-slop). → Treino do dia como herói (número grande mono, mais respiro); espaçamento maior entre seções, menor dentro. |
| HIGH | info | TodayWorkoutCard | `last_completed_date` ignorado: se já treinou hoje, card ainda diz "Iniciar treino". → 3º estado "Treino concluído" (fecha o loop do dia). |
| HIGH | design fraco | streak | Gancho nº1 de engajamento aparece como chip minúsculo **e duplicado** (header + WeekStrip). → Consolidar num KPI (número grande mono + Flame) no topo da WeekStrip. |
| MED | info | streak_best | Recorde histórico existe na API e é ignorado. → "Atual 6 · Recorde 11"; celebrar ao bater. |
| MED | melhoria | WeekStrip | 7 bolinhas que não distinguem treino-planejado / descanso / falta / futuro. → Cruzar com weekdays dos treinos: vira mapa real da semana. |
| MED | info | TodayWorkoutCard | `est_minutes: 0` hardcoded (sempre sem duração) + `muscle_groups` com fallback frágil (pode repetir nome). → Estimar duração; evitar redundância. |
| MED | info | DietCard | `nextMealTime` é só `meals[0].name` (mente: não é horário); macros descartados. → Mostrar nº de refeições + meta kcal real. |
| MED | melhoria | ChallengeCard | "X/Y dias" em texto seco, sem barra nem posição no ranking. → Barra de progresso + "3º de 12". |
| MED | melhoria | ActusTabBar | Dieta não tem destino navegável próprio (só card efêmero na home). → Avaliar elevar DIETA a aba/seção "PLANO". |
| LOW | design fraco | par Dieta/Desafio | Dois cards simétricos 50/50 (naturezas diferentes; órfão quando só um existe). → Quebrar simetria; largura total quando sozinho. |
| LOW | melhoria | HomeHeader | "Boa tarde, Fulano" gasta o maior texto da tela sem informação. → Saudação menor; H2 carrega o estado do dia ("Treino de pernas hoje"). |
| LOW | design fraco | TabBar | Sem reforço de HOJE como casa. → Badge de pendência/streak no ícone. |

## Aluno · Treino e sessão

| Sev | Cat | Tela | Problema → Sugestão |
|---|---|---|---|
| HIGH | info | **sessão /finish** | `summary` riquíssimo (PR, volume, calorias, share DTO) **descartado**; sem tela de conclusão. → **Tela/sheet de conclusão** com volume/PR em destaque + compartilhar. É o momento de orgulho que gera retenção. |
| HIGH | info | detalhe treino | `recent_sessions[]` tipado mas nunca renderizado. → Seção "Histórico" (X vezes · última em…). |
| HIGH | info | detalhe + player + exercício | `WorkoutExercise.notes` (orientação técnica do personal) **nunca aparece** em lugar nenhum. → Exibir nota por exercício (no detalhe, no logging e na tela do exercício). |
| HIGH | info | logging (sessão) | Sem referência da última vez / PR / meta de reps visível. → "Anterior: 40kg × 10" + ghost prefill; meta prescrita ao lado. |
| HIGH | info | tela exercício | Recebe só name/muscle/equipment; **não mostra prescrição nem notes** que o chamador já tem. → Passar sets×reps/descanso/notes — vira briefing real. |
| HIGH | info | lista de treinos | Não comunica o plano da **semana** (weekdays[] disponível). → Faixa Seg..Dom marcando dias de treino, hoje em neon. |
| MED | design fraco | player logging | `justifyContent:center` faz o layout pular entre séries (ruim com mão suada); sem "exercício N/M". → Layout ancorado + indicador de posição. |
| MED | melhoria | player logging | Campos sempre vazios + só teclado numérico. → Pré-preencher série anterior + steppers (+/-). |
| MED | design fraco | player descanso | Pausa não diz o que vem a seguir. → "A seguir: Série 3 · meta 40kg × 10". |
| MED | melhoria | player overview | Só o exercício "atual" é tocável (não dá pra pular máquina ocupada / corrigir). → Permitir abrir qualquer pendente / reabrir concluído. |
| MED | info | sessão entrada | `schedule_hint.matches_planned_weekdays` ignorado. → Aviso gentil "fora do dia planejado". |
| MED | info | montar treino | `muscle_group` nunca é capturado no sheet (nasce nulo) → esvazia "foco" e agrupamento. → Chips de grupo muscular no sheet. |
| MED | design fraco | detalhe treino | Eyebrow ecoa o título; pilha uniforme sem agrupamento em treinos longos. → Header coeso (grupos+duração); numerar/agrupar exercícios. |
| LOW | melhoria | sessão /finish | "Finalizar" encerra parcial sem confirmação. → Confirmar quando há pendentes; diferenciar concluir vs parcial. |
| LOW | info | detalhe treino | `assignment.start/end_date` (vigência do ciclo) não aparece. → "Plano até 30/06" / "Semana 3 de 6". |
| LOW | info | player overview | Concluídos não mostram o que foi feito (só prescrito). → "40kg · 3 séries" via sets_logged. |
| LOW | melhoria | tela exercício | Beco sem saída (sem prev/next nem iniciar). → Navegação entre exercícios + atalho pra sessão. |
| LOW | melhoria | lista treinos | Duração sempre 0. → Estimar "~X min". |

## Aluno · Desafios e Dieta

| Sev | Cat | Tela | Problema → Sugestão |
|---|---|---|---|
| HIGH | design fraco | lista desafios | Pilha plana; convites (ação) indistintos de ativos (acompanhamento). → Seções "Aguardando resposta" vs "Em andamento"; destaque real no convite. |
| HIGH | info | lista desafios | Status (`challengeStatusLabel` já existe) nunca exibido: "Em breve"/"Encerrado" some. → Tag de status + contagem regressiva pra "Em breve". |
| HIGH | info | detalhe desafio | Sem resumo ancorado da **minha posição** (rolar a lista pra se achar). → Bloco "Sua posição: 7º de 23" entre hero e lista. |
| MED | melhoria | lista desafios | Card ativo sem posição/streak (só "dia X de Y"). → Teaser de ranking. |
| MED | info | detalhe desafio | `streak_best_in_challenge` e `last_activity_date` truncados no schema. → Exibir recorde + recência ("ativo hoje"). |
| MED | info | detalhe desafio | Não explica **como se pontua**. → Linha de regra ("pontua por dia com treino; ordena por sequência"). |
| MED | design fraco | detalhe desafio | Ranking privado/403 cai em "indisponível" e esvazia a tela. → Diferenciar privado de erro; mostrar progresso pessoal. |
| HIGH | info | dieta aluno | Sem **horário por refeição** (`isNext` é só índice 0). → Campo de horário no MealSchema (body é livre) → "próxima" real. |
| MED | info | dieta aluno | `is_active` e `updated_at` ignorados (aluno não sabe se é a dieta vigente). → Selo "Ativa" + "atualizada em". |
| MED | design fraco | dieta aluno | **Observações do nutri** jogadas no rodapé em cinza (hierarquia invertida). → Bloco "Do seu nutricionista" logo após os totais. |
| MED | melhoria | dieta aluno | Totais somam cego (parcial engana) e sem meta de referência. → Sinalizar "parcial"; meta vs total ("1820/2000 kcal"). |
| LOW | melhoria | dieta aluno | Sem hidratação. → Campo opcional de meta de água. |
| LOW | design fraco | detalhe desafio | "Desafio" repetido (eyebrow header + eyebrow do hero). → Trocar interno por status. |

## Profissional

| Sev | Cat | Tela | Problema → Sugestão |
|---|---|---|---|
| HIGH | design fraco | lista de alunos | Linhas idênticas (mesmo ícone) — lista de contatos, não painel de gestão. → "Pulso" do aluno: iniciais reais + sinal de atividade; ordenar por `linked_at`; marcar "Novo". |
| HIGH | design fraco | detalhe do aluno | Quase vazia; check-ins como datas cruas; KPI sem contexto. → Bloco de aderência ("último check-in há N dias" + mini-heatmap de 28 dias). |
| HIGH | info | detalhe do aluno | Check-in tem `source`/`workout_session_id`, descartados. → Diferenciar treino x manual (ícone + rótulo): vira timeline. |
| HIGH | design fraco | detalhe do aluno | CTA sempre "Atribuir" sem mostrar **programa atual** (reatribui sem ver). → Seção "Programa atual" (sinalizar pendência de GET); múltiplas ações por papel. |
| HIGH | info | desafio-pro | `GET /professional/challenges/:id/report` (aderência média, dias médios, `streak_broken_hint`) **não usado**. → Bloco de KPIs + destacar quem quebrou a sequência (gancho de retenção). |
| MED | info | desafio-pro | `invited_at`/`responded_at` ignorados. → "convidado há N dias" pra pendentes. |
| MED | design fraco | desafio-pro | 3 seções de mesmo peso; sem "dia X de Y" do desafio. → KPI temporal herói + barra de período. |
| MED | info | lista desafios pro | Sem noção de tamanho/engajamento. → "Dia 4 de 30" / "Começa em 3 dias" (derivável das datas). |
| MED | melhoria | montar treino | Reorder por setas; passo "Revisar" espelha o 2 sem agregar. → Drag-to-reorder; resumo (total, tempo, grupos). |
| MED | design fraco | atribuir treino/dieta | Não mostra **pra quem** (risco de aluno errado); sem data de início. → Nome/avatar do aluno no topo; DateField de início. |
| MED | info | atribuir dieta | Card de template só com nome (escolhe no escuro). → Resumo de refeições/kcal. |
| LOW | info | lista treinos pro | "Foco" depende de nota livre. → Tags de grupo muscular (quando capturado). |
| LOW | info | convites lista | `created_at` ignorado. → "criado em DD/MM" + ordenar por recente. |
| LOW | melhoria | novo convite | Chips sem explicar efeito (1 uso vs turma). → Microcopy "1 uso = pessoal · vários = turma". |
| LOW | design fraco | perfil pro | Reusa AccountScreen genérico (sem leitura de negócio). → Mini-painel: alunos ativos, convites, desafios. |

## Entrada, Cadastro e Conta

| Sev | Cat | Tela | Problema → Sugestão |
|---|---|---|---|
| HIGH | info | passo-1 convite | Maior risco de abandono: digita código sem confirmar **quem convidou**; avança 3 passos às cegas. → Pressionar `GET /invites/:code/preview`; validar on-blur com confirmação antes dos passos 2-3. |
| HIGH | info | conta (aluno) | Não mostra o **vínculo com o profissional** — o relacionamento central do produto. → Card "Seu treinador: [nome]" (pedir GET; persistir o role do consume-invite enquanto isso). |
| MED | info | conta | Campos cadastrados (nome/telefone/gênero/peso) são write-only — conta nunca confirma o que foi salvo. → Pedir GET de user_basic_info; bloco "Seus dados". |
| MED | design fraco | conta | Plana e genérica; metade das linhas é "em breve" → cara de produto incompleto. → Omitir placeholders; densificar com vínculo/dados/painel pro. |
| MED | design fraco | escolha-perfil | Aluno e professor como cards-irmãos de mesmo peso, mas jornadas diferentes (professor não tem auto-cadastro). → Aluno primário proeminente; professor secundário/textual. |
| MED | info | professor-info | Sem expectativa de tempo de resposta do credenciamento. → "Validação do CREF/CRN em ~24h". |
| MED | design fraco | passo-3 acesso | Denso/plano; link "Já tenho conta" no fim descarta o draft. → Agrupar contato vs senha; remover o link de fuga. |
| LOW | design fraco | splash | Símbolo central + wordmark no rodapé = marca duplicada. → Um lockup só, ou rodapé vira tagline. |
| LOW | melhoria | escolha-perfil | Dois spacers flex iguais = ar morto simétrico. → Ancorar "Entrar"; ritmo intencional. |
| LOW | melhoria | professor-info | CTA "Entrar" acima de "Falar com a equipe" — invertido pro público novo. → Contato como primário. |
| LOW | design fraco | professor-info | 3 passos idênticos (grid simétrico). → Destacar o passo final (payoff). |
| LOW | melhoria | login | Sem saída após erros repetidos (reset não existe). → Revelar "fale com a equipe/seu treinador" após N falhas. |
| LOW | design fraco | passo-1 | Densidade baixa + copy de vínculo duplicada. → Consolidar; protagonismo ao input do código. |
| LOW | info | passo-2 | CPF opcional sem justificar (dado sensível). → Microcopy "usado p/ recibos do treinador" ou mover pra depois. |
| LOW | melhoria | passo-3 | Sem revisão antes de criar conta (+ aceite LGPD). → Mini-resumo de confirmação. |
| LOW | melhoria | WizardProgress | 3 traços mudos sem rótulo. → Micro-rótulos das etapas. |
| LOW | melhoria | conta | Avatar sempre inicial; `avatar_url` write-only sem afordância de troca. → Toque no avatar → upload. |

---

## Pendências de backend levantadas (bloqueiam wins de alto valor)

1. `GET /invites/:code/preview` — nome/foto do convidador (risco de funil no cadastro).
2. GET do vínculo aluno→profissional (conta do aluno não mostra o treinador).
3. GET de leitura de `user_basic_info` (hoje write-only — conta não confirma dados).
4. GET das atribuições do lado pro (detalhe do aluno não vê o programa atual → reatribuição cega).
5. `summary` do /finish já existe — só precisa ser consumido (sem ação de backend).
