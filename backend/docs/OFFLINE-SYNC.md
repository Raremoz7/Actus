# Offline-first e Sincronização (MVP)

Este documento detalha a estratégia de **offline-first** para o Actus Fit, focada em confiabilidade na academia (rede instável) e simplicidade para o MVP.

## Objetivos
- Permitir uso fluido sem internet (ou com internet ruim).
- Evitar perda de dados (ações do usuário nunca “somem”).
- Reduzir complexidade de conflitos no MVP (beta pequeno), sem bloquear evolução futura.

## Conceitos
- **Fonte de verdade**: backend (Postgres).
- **Estado local**: cache/materialização para UX + fila de operações.
- **Outbox pattern**: toda ação mutável vira uma operação persistida localmente e enviada depois.

## Dados locais (mínimo recomendado)
- **Usuário/sessão**: tokens e perfil (role).
- **Treinos atribuídos ao aluno**: treino do dia e próximos.
- **Checklist de execução**: o que foi marcado “feito”.
- **Check-in diário**: registro do dia.
- **Catálogo Wger**: cache de buscas recentes + favoritos.

## Outbox (fila de operações)
Cada operação deve ser gravada em uma tabela/coleção local `outbox_ops`.

### Campos mínimos
- `op_id` (UUID)
- `type` (enum/string)
- `entity_id` (UUID/string)
- `payload` (JSON)
- `created_at` (datetime)
- `device_id` (string)
- `status` (`pending` | `sending` | `applied` | `failed`)
- `retries` (int)
- `last_error` (string opcional)

### Tipos de operação (MVP)
- **Treinos (personal)**
  - `workout_template_create`
  - `workout_template_update`
  - `workout_template_delete`
  - `workout_assign_to_student`
- **Execução (aluno)**
  - `exercise_mark_done`
  - `workout_finish`
- **Engajamento**
  - `daily_checkin`

## Regras de sincronização (MVP)

### Quando sincronizar
- Ao abrir o app
- Após cada ação (com debounce)
- Periodicamente (ex.: a cada 30–60s enquanto ativo, se houver pending ops)

### Ordem
1. **Enviar Outbox** (mutations)
2. **Pull de dados** (reads/materialização)

### Backoff e retries
- Exponencial (ex.: 1s, 2s, 4s, 8s… com teto)
- Interromper temporariamente se detectar falta de rede

## Conflitos (MVP)
Objetivo: simples, previsível, suficiente para beta.

### Estratégia base
- **Last-write-wins** por entidade para updates concorrentes.

### Restrições de UX para reduzir conflitos
- No MVP, desencorajar (ou bloquear) editar o mesmo treino em múltiplos dispositivos ao mesmo tempo.
- Exibir “última sincronização” e avisos quando há mudanças remotas.

### Auditoria mínima
Para ações importantes (atribuição, finalização, check-in), manter log/evento no backend para depuração.

## Idempotência (importante)
Mesmo no MVP, operações devem ser **idempotentes** quando possível:
- Enviar `op_id` junto na requisição
- Backend registra `op_id` aplicado por usuário/dispositivo por um período
- Repetições não geram duplicidade (especialmente para check-in e eventos de pontos)

## Observações para evolução
Quando crescer:
- considerar “event sourcing light” (eventos append-only como fonte da gamificação)
- considerar “sync endpoint” agregando múltiplas ops para reduzir roundtrips
- resolver conflitos mais sofisticados apenas onde houver evidência de necessidade

