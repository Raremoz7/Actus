-- Actus: Invite-first register + campos de usuário/funcionário + limites de convites.
-- Requer migrations anteriores (fase1 schema + custom auth).

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Dados básicos do usuário (PII)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_gender') then
    create type public.user_gender as enum ('masculino', 'feminino', 'nao_informar', 'outro');
  end if;
end$$;

create table if not exists public.user_basic_info (
  user_id uuid primary key references public.app_users (id) on delete cascade,
  full_name text not null,
  cpf_normalized text,
  cpf_hash text,
  cpf_last4 text,
  birth_date date not null,
  phone text,
  gender public.user_gender not null default 'nao_informar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_basic_info_full_name_non_empty check (length(trim(full_name)) > 2),
  constraint user_basic_info_cpf_last4_len check (cpf_last4 is null or length(cpf_last4) = 4),
  constraint user_basic_info_cpf_hash_non_empty check (cpf_hash is null or length(trim(cpf_hash)) > 10)
);

-- Unicidade por hash (CPF pode ser opcional; quando presente, deve ser único)
create unique index if not exists user_basic_info_cpf_hash_key
  on public.user_basic_info (cpf_hash)
  where cpf_hash is not null;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_user_basic_info_updated_at') then
    create trigger trg_user_basic_info_updated_at
      before update on public.user_basic_info
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Consentimento LGPD
-- ---------------------------------------------------------------------------
create table if not exists public.user_lgpd_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  policy_version text not null,
  consented_at timestamptz not null default now(),
  source text not null default 'api',
  ip inet,
  user_agent text
);

create index if not exists user_lgpd_consents_user_id_idx on public.user_lgpd_consents (user_id);

-- ---------------------------------------------------------------------------
-- Dados profissionais (para personal/nutri) e documentos
-- ---------------------------------------------------------------------------
create table if not exists public.professional_info (
  user_id uuid primary key references public.app_users (id) on delete cascade,
  photo_url text,
  qualifications jsonb not null default '[]'::jsonb,
  cref_number text,
  cref_expires_at date,
  crn_number text,
  crn_expires_at date,
  documents jsonb not null default '{}'::jsonb,
  cnpj text,
  address jsonb not null default '{}'::jsonb,
  office_hours jsonb not null default '{}'::jsonb,
  specialties jsonb not null default '[]'::jsonb,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_professional_info_updated_at') then
    create trigger trg_professional_info_updated_at
      before update on public.professional_info
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Limite de convites por profissional (configurado por admin)
-- ---------------------------------------------------------------------------
create table if not exists public.professional_invite_limits (
  professional_id uuid primary key references public.profiles (id) on delete cascade,
  max_active_invites integer not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  constraint professional_invite_limits_positive check (max_active_invites >= 0)
);

-- ---------------------------------------------------------------------------
-- Auditoria de consumo de convite
-- ---------------------------------------------------------------------------
create table if not exists public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.invites (id) on delete cascade,
  redeemed_user_id uuid not null references public.app_users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  ip inet,
  user_agent text,
  constraint invite_redemptions_unique unique (invite_id, redeemed_user_id)
);

create index if not exists invite_redemptions_invite_id_idx on public.invite_redemptions (invite_id);

commit;

