-- Actus: Módulo Academia (núcleo) — academias, membros (gestor/instrutor) e agregação de alunos.
-- Modelo híbrido: personais autônomos seguem como hoje; a academia é uma camada nova por cima,
-- sem alterar o fluxo personal -> aluno. Autorização é feita na camada Node (RLS desabilitado;
-- ver docs/SECURITY-RLS.md, Opção A). A isolação por academia é predicado de query + middleware.

begin;

-- Gestor de academia = perfil de gestão pura (não atende alunos), distinto de personal.
-- Instrutor NÃO é tipo novo: é um personal (tipo='personal') com vínculo em academy_members.
do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    begin
      alter type public.user_role add value 'gestor';
    exception
      when duplicate_object then null;
    end;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Academia (tenant lógico). Onboarding via admin Actus na Fase 1.
-- ---------------------------------------------------------------------------
create table if not exists public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  cnpj text,
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'active',
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academies_name_non_empty check (length(trim(name)) > 0),
  constraint academies_status_allowed check (status in ('active', 'inactive'))
);

create unique index if not exists academies_slug_key on public.academies (slug) where slug is not null;
create index if not exists academies_status_idx on public.academies (status);

-- ---------------------------------------------------------------------------
-- Membros da academia: gestor (manager) ou instrutor (personal vinculado).
-- ---------------------------------------------------------------------------
create table if not exists public.academy_members (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  status text not null default 'active',
  invited_by uuid references public.app_users (id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academy_members_role_allowed check (role in ('manager', 'instructor')),
  constraint academy_members_status_allowed check (status in ('invited', 'active', 'revoked')),
  constraint academy_members_unique_pair unique (academy_id, user_id)
);

create index if not exists academy_members_academy_role_status_idx
  on public.academy_members (academy_id, role, status);
create index if not exists academy_members_user_id_idx on public.academy_members (user_id);

-- Um personal pode ser instrutor ativo em no máximo 1 academia (evita dupla contagem de alunos).
create unique index if not exists academy_members_one_active_instructor_idx
  on public.academy_members (user_id)
  where role = 'instructor' and status = 'active';

-- ---------------------------------------------------------------------------
-- Agregação: a academia enxerga alunos via seus instrutores ativos
-- (sem academy_id no aluno; o vínculo personal -> aluno permanece intocado).
-- ---------------------------------------------------------------------------
create or replace view public.academy_students as
select
  am.academy_id,
  spl.student_id,
  am.user_id as instructor_user_id
from public.academy_members am
join public.student_professional_links spl
  on spl.professional_id = am.user_id
 and spl.professional_role = 'personal'
 and spl.status = 'active'
where am.role = 'instructor'
  and am.status = 'active';

-- updated_at automático (set_updated_at já definido na migration de fase 1).
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_academies_updated_at') then
    create trigger trg_academies_updated_at before update on public.academies
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_academy_members_updated_at') then
    create trigger trg_academy_members_updated_at before update on public.academy_members
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- Segurança: autorização no Node (Opção A). RLS off + sem grants para anon/authenticated.
alter table public.academies disable row level security;
alter table public.academy_members disable row level security;
revoke all on table public.academies from anon, authenticated;
revoke all on table public.academy_members from anon, authenticated;

commit;
