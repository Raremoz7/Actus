# Dashboard de Rede (Filiais/Franquias) — TEC-53 (complemento)

## Contexto

O módulo de academia (fase 1, TEC-53) entrega um dashboard agregado por academia individual — KPIs, equipe, comissões — reportado no commit `ae2dbde`. Após revisão, Matheus Nogalha pediu uma visualização adicional: "Incluir uma visualização por Filiais e Franquias".

O schema atual não tem qualquer conceito de hierarquia entre academias — cada `academies` row é um tenant totalmente isolado (ver `backend/supabase/migrations/20260621120000_actus_academies_core.sql`). Este spec cobre o trabalho necessário para agrupar academias em uma rede e expor um dashboard consolidado por rede, sem alterar o comportamento existente do dashboard individual.

## Problema

Redes com múltiplas unidades (filiais de uma mesma rede, ou franquias com gestão própria por unidade) não têm hoje como visualizar dados consolidados entre unidades. Cada gestor só enxerga a própria academia.

## Critérios de aceite

- Uma academia pode ser vinculada a uma rede (matriz) via `parent_academy_id`.
- O gestor da matriz (`network_role = network_hq`) acessa um dashboard novo com KPIs consolidados de todas as unidades e uma comparação por unidade.
- Gestores de unidade (filial/franquia) continuam vendo apenas o próprio dashboard, sem nenhuma mudança de escopo ou comportamento.
- Onboarding (admin) permite vincular uma academia nova a uma rede existente, opcionalmente.

## Modelo de dados

- `academies.parent_academy_id` — `uuid`, nullable, FK autorreferente para `academies.id`. Presente quando a academia é filial/franquia de uma rede.
- `academies.network_role` — enum `standalone | network_hq | unit`, default `standalone`.
  - `standalone`: academia sem vínculo de rede (comportamento atual, sem mudanças).
  - `network_hq`: matriz da rede — enxerga o dashboard consolidado.
  - `unit`: filial/franquia vinculada a uma `network_hq` via `parent_academy_id`.
- Nenhuma mudança em `academy_members`, `academy_students` ou nas tabelas de comissão — cada unidade mantém gestor, equipe e alunos próprios exatamente como hoje.

## API (backend)

- `GET /academy/network` — lista as unidades da rede (id, nome, KPIs resumidos). Só responde quando a academia autenticada tem `network_role = network_hq`.
- `GET /academy/network/dashboard` — KPIs agregados (soma de todas as unidades) + breakdown por unidade. Reaproveita a mesma lógica de agregação de `GET /academy/dashboard`, executada por unidade e somada — sem duplicar a query de agregação de alunos/check-ins/comissões.
- Middleware de escopo: gestor de `network_hq` recebe acesso de leitura às unidades da própria rede (somente leitura agregada, não gestão direta de equipe/alunos da unidade). Gestor de `unit` mantém escopo idêntico ao atual.
- Onboarding (`/admin/academies/*`): campo opcional `parent_academy_id` ao criar uma academia, para vinculá-la a uma rede existente.

## Frontend (web)

- Novo componente `web/src/pages/academia/NetworkDashboardPage.tsx`, roteado em `/app/academia/rede`, visível apenas para gestores com `network_role = network_hq`.
- Topo: cards de KPI consolidados (mesmo componente visual do dashboard individual, dados agregados).
- Abaixo: tabela comparativa por unidade — nome, alunos ativos, aderência, comissões a pagar — cada linha linkando para o dashboard individual daquela unidade (já existente, sem alterações).
- Dashboard individual de cada unidade permanece inalterado.

## Erros e edge cases

- Rede sem nenhuma unidade vinculada ainda: estado vazio ("nenhuma filial vinculada ainda").
- Gestor de `unit` tentando acessar `/app/academia/rede` diretamente: 403 no backend, redirect para o próprio dashboard no frontend.
- Academia `standalone` não vê a rota de rede no menu.

## Testes

- Backend (integração): agregação correta com 2+ unidades vinculadas; escopo — gestor de `unit` não consegue acessar `/academy/network*`; academia `standalone` recebe 404/403 ao chamar as rotas de rede.
- Frontend: `NetworkDashboardPage` renderiza estado vazio (rede sem unidades) e estado com 2+ unidades (KPIs consolidados + tabela).

## Fora de escopo (fase 2+)

- Gestão direta de equipe/alunos de uma unidade a partir do dashboard da matriz (somente leitura agregada nesta fase).
- Comissão consolidada por rede (cada unidade mantém sua própria configuração de comissão).
- Transferência de instrutores/alunos entre unidades.
