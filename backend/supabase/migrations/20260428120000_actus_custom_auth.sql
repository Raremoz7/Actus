-- Actus: Auth custom (Node + JWT) usando Supabase apenas como Postgres.
-- Remove dependências de auth.users/auth.uid() no schema de domínio.

begin;

-- Extensões utilitárias
create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Identidade do app (substitui auth.users como fonte de verdade)
-- ---------------------------------------------------------------------------
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  password_hash text not null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_email_non_empty check (length(trim(email::text)) > 3)
);

create unique index if not exists app_users_email_key on public.app_users (email);

create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  token_hash text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by uuid,
  device_id text,
  ip inet,
  user_agent text,
  constraint refresh_tokens_token_hash_non_empty check (length(trim(token_hash)) > 20),
  constraint refresh_tokens_expires_after_issue check (expires_at > issued_at)
);

create unique index if not exists refresh_tokens_token_hash_key on public.refresh_tokens (token_hash);
create index if not exists refresh_tokens_user_id_idx on public.refresh_tokens (user_id);
create index if not exists refresh_tokens_expires_at_idx on public.refresh_tokens (expires_at);

-- updated_at automático para app_users
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_app_users_updated_at'
  ) then
    create trigger trg_app_users_updated_at
      before update on public.app_users
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Ajustes em profiles: trocar FK auth.users -> public.app_users
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references public.app_users (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Remover gatilhos/RPCs dependentes de Supabase Auth
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop function if exists public.consume_invite(text);
drop function if exists public.apply_sync_operation(text, uuid, text, jsonb);

-- ---------------------------------------------------------------------------
-- Segurança (Supabase Data API): como a autorização será no Node,
-- desabilitamos RLS e removemos grants para anon/authenticated.
-- ---------------------------------------------------------------------------
alter table public.profiles disable row level security;
alter table public.invites disable row level security;
alter table public.student_professional_links disable row level security;
alter table public.workouts disable row level security;
alter table public.workout_exercises disable row level security;
alter table public.student_workouts disable row level security;
alter table public.workout_sessions disable row level security;
alter table public.session_exercises disable row level security;
alter table public.check_ins disable row level security;
alter table public.sync_applied_ops disable row level security;
alter table public.diet_templates disable row level security;
alter table public.student_diets disable row level security;
alter table public.app_users disable row level security;
alter table public.refresh_tokens disable row level security;

-- Revogar acesso de roles padrão expostas
revoke all on schema public from anon, authenticated;

revoke all on table public.app_users from anon, authenticated;
revoke all on table public.refresh_tokens from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.invites from anon, authenticated;
revoke all on table public.student_professional_links from anon, authenticated;
revoke all on table public.workouts from anon, authenticated;
revoke all on table public.workout_exercises from anon, authenticated;
revoke all on table public.student_workouts from anon, authenticated;
revoke all on table public.workout_sessions from anon, authenticated;
revoke all on table public.session_exercises from anon, authenticated;
revoke all on table public.check_ins from anon, authenticated;
revoke all on table public.sync_applied_ops from anon, authenticated;
revoke all on table public.diet_templates from anon, authenticated;
revoke all on table public.student_diets from anon, authenticated;

-- Limpeza de policies (caso existam)
drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_select_linked_students on public.profiles;
drop policy if exists profiles_select_my_professionals on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

drop policy if exists invites_select_own on public.invites;
drop policy if exists invites_insert_own on public.invites;
drop policy if exists invites_update_own on public.invites;
drop policy if exists invites_delete_own on public.invites;

drop policy if exists spl_select_as_participant on public.student_professional_links;

drop policy if exists workouts_select_owner on public.workouts;
drop policy if exists workouts_select_assigned_student on public.workouts;
drop policy if exists workouts_all_owner on public.workouts;

drop policy if exists we_select_via_workout on public.workout_exercises;
drop policy if exists we_mutate_owner on public.workout_exercises;

drop policy if exists sw_select_student on public.student_workouts;
drop policy if exists sw_select_personal on public.student_workouts;
drop policy if exists sw_insert_personal on public.student_workouts;
drop policy if exists sw_update_personal on public.student_workouts;
drop policy if exists sw_delete_personal on public.student_workouts;

drop policy if exists ws_student_all on public.workout_sessions;
drop policy if exists ws_select_personal on public.workout_sessions;

drop policy if exists se_student_via_session on public.session_exercises;
drop policy if exists se_select_personal on public.session_exercises;

drop policy if exists check_ins_student_select on public.check_ins;
drop policy if exists check_ins_student_insert on public.check_ins;
drop policy if exists check_ins_select_personal on public.check_ins;
drop policy if exists check_ins_select_nutri on public.check_ins;

drop policy if exists sync_ops_select_own on public.sync_applied_ops;

drop policy if exists diet_templates_owner_all on public.diet_templates;
drop policy if exists diet_templates_select_student on public.diet_templates;

drop policy if exists student_diets_select_student on public.student_diets;
drop policy if exists student_diets_all_nutri on public.student_diets;

commit;

