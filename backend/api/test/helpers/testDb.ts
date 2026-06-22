import { newDb, DataType } from "pg-mem";
import crypto from "node:crypto";

export function createInMemoryPg() {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  // Funções utilitárias usadas em migrações/queries
  db.public.registerFunction({
    name: "now",
    returns: "timestamptz",
    implementation: () => new Date(),
  });

  db.public.registerFunction({
    name: "gen_random_uuid",
    returns: "uuid",
    // impure: cada chamada gera um novo UUID; sem isso o pg-mem trata como pura e reusa o mesmo
    // valor em inserts sucessivos sem id explícito (colisão de PK).
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  db.public.registerFunction({
    name: "timezone",
    args: [DataType.text, DataType.timestamptz],
    returns: DataType.timestamp,
    implementation: (_zone: string, i: Date) => i,
  });

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  return { db, pool };
}

export const minimalSchemaSql = `
create type public.user_role as enum ('personal', 'nutricionista', 'aluno', 'actus_admin', 'actus_suporte', 'gestor');
create type public.link_status as enum ('active', 'revoked');
create type public.professional_role as enum ('personal', 'nutricionista');
create type public.user_gender as enum ('masculino', 'feminino', 'nao_informar', 'outro');

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references public.app_users (id) on delete cascade,
  tipo public.user_role not null default 'aluno',
  display_name text,
  avatar_url text,
  phone text, -- [ACTUS — register-professional] espelho da migration 20260610130000
  timezone text not null default 'America/Sao_Paulo',
  total_workouts_completed integer not null default 0,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  last_activity_date date,
  last_activity_at timestamptz,
  last_credit_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  token_hash text not null unique,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by uuid
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.student_professional_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  professional_role public.professional_role not null,
  status public.link_status not null default 'active',
  linked_at timestamptz not null default now(),
  constraint student_professional_links_unique_pair unique (student_id, professional_id)
);

create unique index student_professional_links_one_active_per_role_idx
  on public.student_professional_links (student_id, professional_role)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Treinos (templates) + exercícios + atribuição
-- ---------------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  owner_personal_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  position integer not null,
  wger_exercise_id integer not null,
  name_snapshot text not null,
  sets integer not null default 3,
  reps integer not null default 10,
  rest_seconds integer not null default 60,
  notes text,
  muscle_group text,
  constraint workout_exercises_unique_position unique (workout_id, position)
);

create table public.student_workouts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  weekdays integer[] not null,
  start_date date,
  end_date date,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.workout_session_status as enum ('in_progress', 'completed', 'completed_partial', 'abandoned');

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_workout_id uuid not null references public.student_workouts (id) on delete cascade,
  scheduled_for_date date not null,
  status public.workout_session_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_unique_day unique (student_workout_id, scheduled_for_date)
);

create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  constraint session_exercises_unique_exercise unique (session_id, workout_exercise_id)
);

create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_index integer not null,
  weight_kg numeric(10, 2),
  reps_done integer,
  rest_seconds_actual integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_sets_set_index_positive check (set_index >= 1),
  constraint session_sets_unique_position unique (session_id, workout_exercise_id, set_index)
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null,
  source text not null default 'app',
  workout_session_id uuid references public.workout_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint check_ins_unique_per_day unique (student_id, check_in_date)
);

-- ---------------------------------------------------------------------------
-- Dietas (templates) + atribuição
-- ---------------------------------------------------------------------------
create table public.diet_templates (
  id uuid primary key default gen_random_uuid(),
  owner_nutritionist_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_diets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  diet_template_id uuid not null references public.diet_templates (id) on delete cascade,
  start_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_basic_info (
  user_id uuid primary key references public.app_users (id) on delete cascade,
  full_name text not null,
  cpf_normalized text,
  cpf_hash text,
  cpf_last4 text,
  birth_date date not null,
  phone text,
  gender public.user_gender not null default 'nao_informar',
  body_weight_kg numeric(6, 2)
);

create unique index user_basic_info_cpf_hash_key
  on public.user_basic_info (cpf_hash)
  where cpf_hash is not null;

create table public.user_lgpd_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  policy_version text not null,
  consented_at timestamptz not null default now(),
  source text not null default 'api'
);

create table public.app_user_roles (
  user_id uuid not null references public.app_users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.app_users (id),
  constraint app_user_roles_role_allowed check (role in ('actus_admin', 'actus_suporte')),
  primary key (user_id, role)
);

create table public.professional_info (
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

create table public.professional_invite_limits (
  professional_id uuid primary key references public.profiles (id) on delete cascade,
  max_active_invites integer not null
);

create table public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.invites (id) on delete cascade,
  redeemed_user_id uuid not null references public.app_users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  constraint invite_redemptions_unique unique (invite_id, redeemed_user_id)
);

create type public.challenge_visibility as enum ('private_ranking', 'public_among_participants');
create type public.challenge_status as enum ('draft', 'active', 'ended');
create type public.challenge_participant_status as enum ('invited', 'active', 'declined');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_professional_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  visibility public.challenge_visibility not null default 'public_among_participants',
  status public.challenge_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.challenge_participant_status not null default 'invited',
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (challenge_id, student_id)
);

create or replace function public.activity_dates_for_student(p_student_id uuid)
returns table (d date)
language sql
stable
as $$
  select distinct c.check_in_date as d
  from public.check_ins c
  where c.student_id = p_student_id
  union
  select distinct ws.scheduled_for_date as d
  from public.workout_sessions ws
  where ws.student_id = p_student_id
    and ws.status::text in ('completed', 'completed_partial')
    and ws.scheduled_for_date is not null;
$$;

-- ---------------------------------------------------------------------------
-- Módulo Academia (espelha 20260621120000_actus_academies_core /
-- 20260621121000_actus_academy_commissions). Sem triggers/RLS — desnecessários no pg-mem.
-- ---------------------------------------------------------------------------
create type public.commission_rule_type as enum ('percent', 'fixed_per_student', 'fixed_monthly');
create type public.revenue_subject_type as enum ('student', 'instructor', 'academy');
create type public.revenue_source as enum ('manual', 'billing');

create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  cnpj text,
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'active',
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academy_members (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  status text not null default 'active',
  invited_by uuid references public.app_users (id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academy_members_unique_pair unique (academy_id, user_id)
);

create unique index academy_members_one_active_instructor_idx
  on public.academy_members (user_id)
  where role = 'instructor' and status = 'active';

create view public.academy_students as
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

create table public.academy_commission_rules (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  instructor_user_id uuid references public.profiles (id) on delete cascade,
  rule_type public.commission_rule_type not null,
  percent numeric(5, 2),
  amount_cents bigint,
  currency text not null default 'BRL',
  effective_from date not null,
  effective_to date,
  active boolean not null default true,
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academy_revenue_entries (
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
  updated_at timestamptz not null default now()
);

create table public.academy_commission_payouts (
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
  constraint commission_payouts_unique unique (academy_id, instructor_user_id, period_month)
);

-- ---------------------------------------------------------------------------
-- Gamificação V1 (espelha 20260622120000_gamification_v1).
-- ---------------------------------------------------------------------------
create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  criteria_type text not null check (criteria_type in ('workout_count','streak','personal_record')),
  criteria_threshold int,
  asset_key text not null,
  sort_order int not null default 0,
  active boolean not null default true
);

create table public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id),
  earned_at timestamptz not null default now(),
  seen_at timestamptz,
  unique (student_id, badge_id)
);
create index idx_student_badges_student on public.student_badges(student_id);

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios','android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index idx_device_tokens_user on public.device_tokens(user_id);

-- Seed do catálogo de 7 badges (espelha 20260622120100_seed_badges).
insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('first_step',      'Primeiro Passo',  'Concluiu o primeiro treino.',          'workout_count',   1,    'badge_first_step',      1, true);
insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('committed_5',     'Comprometido',    'Concluiu 5 treinos.',                  'workout_count',   5,    'badge_committed',       2, true);
insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('consistent_10',   'Consistente',     'Concluiu 10 treinos.',                 'workout_count',   10,   'badge_consistent',      3, true);
insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('dedicated_30',    'Dedicado',        'Concluiu 30 treinos.',                 'workout_count',   30,   'badge_dedicated',       4, true);
insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('personal_record', 'Recorde Pessoal', 'Bateu o primeiro recorde de carga.',   'personal_record', null, 'badge_personal_record', 5, true);
insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('fire_streak_7',   'Sequência de Fogo','Manteve 7 dias seguidos de treino.',  'streak',          7,    'badge_fire_streak',     6, true);
insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('legendary_30',    'Lendário',        'Manteve 30 dias seguidos de treino.', 'streak',          30,   'badge_legendary',       7, true);
`;

