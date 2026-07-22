-- Actus: Módulo Academia (comissões) — regra de comissão + base de receita desacoplável.
--
-- Desacoplamento do financeiro: a base de receita (academy_revenue_entries) tem `source`
-- ('manual' | 'billing'). Na Fase 1 só há lançamentos 'manual'. Quando o módulo financeiro real
-- chegar, ele insere lançamentos 'billing' na MESMA tabela e o cálculo passa a preferir 'billing'
-- sobre 'manual' — sem alterar schema nem contrato de API. O cálculo em si fica em TypeScript
-- (services/commission.ts) por testabilidade (testes rodam em pg-mem); aqui só vivem os dados.

begin;

create type public.commission_rule_type as enum ('percent', 'fixed_per_student', 'fixed_monthly');
create type public.revenue_subject_type as enum ('student', 'instructor', 'academy');
create type public.revenue_source as enum ('manual', 'billing');

-- ---------------------------------------------------------------------------
-- Regra de comissão (como calcular o quanto o instrutor recebe).
-- instructor_user_id NULL = regra default da academia. Temporal (append-only) via effective_*.
-- ---------------------------------------------------------------------------
create table if not exists public.academy_commission_rules (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  instructor_user_id uuid references public.profiles (id) on delete cascade,
  rule_type public.commission_rule_type not null,
  percent numeric(5, 2),
  amount_cents bigint,
  currency text not null default 'BRL',
  effective_from date not null default (timezone('UTC', now()))::date,
  effective_to date,
  active boolean not null default true,
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_rules_percent_valid check (percent is null or (percent >= 0 and percent <= 100)),
  constraint commission_rules_amount_non_negative check (amount_cents is null or amount_cents >= 0),
  constraint commission_rules_shape check (
    (rule_type = 'percent' and percent is not null)
    or (rule_type in ('fixed_per_student', 'fixed_monthly') and amount_cents is not null)
  )
);

create index if not exists academy_commission_rules_lookup_idx
  on public.academy_commission_rules (academy_id, instructor_user_id, effective_from);

-- ---------------------------------------------------------------------------
-- Base de receita (alimenta o cálculo). Centavos inteiros, nunca float.
-- source='manual' na Fase 1; 'billing' no futuro (preferido sobre manual no cálculo).
-- ---------------------------------------------------------------------------
create table if not exists public.academy_revenue_entries (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  instructor_user_id uuid not null references public.profiles (id) on delete cascade,
  subject_type public.revenue_subject_type not null default 'student',
  subject_id uuid,
  period_month date not null,
  amount_cents bigint not null,
  currency text not null default 'BRL',
  source public.revenue_source not null default 'manual',
  source_ref text,
  note text,
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint revenue_entries_amount_non_negative check (amount_cents >= 0)
);

create index if not exists academy_revenue_entries_period_idx
  on public.academy_revenue_entries (academy_id, period_month, instructor_user_id);
create index if not exists academy_revenue_entries_source_idx
  on public.academy_revenue_entries (academy_id, source);

-- ---------------------------------------------------------------------------
-- Pagamento de comissão (status a pagar/pago por instrutor e competência).
-- ---------------------------------------------------------------------------
create table if not exists public.academy_commission_payouts (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  instructor_user_id uuid not null references public.profiles (id) on delete cascade,
  period_month date not null,
  status text not null default 'pending',
  amount_cents bigint not null default 0,
  paid_at timestamptz,
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_payouts_status_allowed check (status in ('pending', 'paid')),
  constraint commission_payouts_amount_non_negative check (amount_cents >= 0),
  constraint commission_payouts_unique unique (academy_id, instructor_user_id, period_month)
);

create index if not exists academy_commission_payouts_period_idx
  on public.academy_commission_payouts (academy_id, period_month);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_academy_commission_rules_updated_at') then
    create trigger trg_academy_commission_rules_updated_at before update on public.academy_commission_rules
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_academy_revenue_entries_updated_at') then
    create trigger trg_academy_revenue_entries_updated_at before update on public.academy_revenue_entries
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_academy_commission_payouts_updated_at') then
    create trigger trg_academy_commission_payouts_updated_at before update on public.academy_commission_payouts
      for each row execute function public.set_updated_at();
  end if;
end$$;

alter table public.academy_commission_rules disable row level security;
alter table public.academy_revenue_entries disable row level security;
alter table public.academy_commission_payouts disable row level security;
revoke all on table public.academy_commission_rules from anon, authenticated;
revoke all on table public.academy_revenue_entries from anon, authenticated;
revoke all on table public.academy_commission_payouts from anon, authenticated;

commit;
