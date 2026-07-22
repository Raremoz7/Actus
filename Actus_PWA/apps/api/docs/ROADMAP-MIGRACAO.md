# Roadmap de Evolução e Migração (Stack/Arquitetura)

Este documento define **gatilhos objetivos** para evoluir a arquitetura e as “portas de saída” planejadas para evitar reescrita.

## Fase 0 — Validação (MVP)
Recomendação:
- Mobile cross-platform (RN ou Flutter)
- Supabase (Auth + Postgres + Storage + Edge Functions)
- Stripe (assinatura + webhooks)
- Wger (catálogo) + cache/fallback

Foco:
- fluxo crítico (auth + treino + execução + billing)
- offline-first confiável

## Fase 1 — Pós-MVP (primeiros sinais de tração)
Adicionar conforme evidência:
- Histórico mais detalhado de execução
- Progresso e relatórios simples para personal
- Notificações push (se melhorar retenção)
- Melhorias de observabilidade (logs, métricas, tracing)

## Gatilhos para evoluir a arquitetura
Use gatilhos para evitar “otimização prematura”:

- **Crescimento de carga**: aumento sustentado de usuários ativos / volume de writes por minuto.
- **Jobs/rotinas**: necessidade de filas, reprocessamento, tarefas agendadas (ex.: recomputar streaks, relatórios).
- **Regras complexas**: billing + autorização + gamificação exigindo lógica difícil de manter em edge functions.
- **Custos**: custo por request/egress/storage subindo de forma desproporcional ao MRR.
- **Limitações do provedor**: necessidade de recursos não suportados (ou suporte/SLAs).

## Portas de saída (planos de migração)

### Supabase → Backend próprio (mantendo Postgres)
Estratégia:
- manter o banco (Postgres) e schema
- construir API (NestJS/Fastify) sobre o mesmo banco
- mover gradualmente rotas sensíveis e jobs para o backend
- manter o client consumindo contratos estáveis (repositories/services)

### Stripe → Gateway BR (Asaas/Pagar.me/etc.)
Estratégia:
- manter o módulo Billing com contrato único
- trocar apenas o adaptador do provedor
- preservar estados internos (`subscription_status`, `current_period_end`) e os fluxos do produto

### Offline/sync → “sync endpoint” e batching
Quando o volume de operações crescer:
- agrupar várias outbox ops em uma chamada
- reduzir roundtrips e melhorar latência
- evoluir resolução de conflitos por entidade se necessário

## Decisões de produto que impactam arquitetura
- Trial, política de cancelamento e retenção (impacta billing e enforcement)
- Como medir “progresso básico” no MVP (impacta modelagem de execução)
- Quais telas entram no web do personal no MVP (impacta priorização, não tanto a arquitetura)

