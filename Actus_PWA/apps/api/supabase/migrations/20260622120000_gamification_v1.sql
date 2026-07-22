-- Gamificação V1: badges, conquistas, device tokens e colunas de streak rolling.
begin;

create table if not exists public.badges (
  id text primary key,
  name text not null,
  description text not null,
  criteria_type text not null check (criteria_type in ('workout_count','streak','personal_record')),
  criteria_threshold int,
  asset_key text not null,
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id),
  earned_at timestamptz not null default now(),
  seen_at timestamptz,
  unique (student_id, badge_id)
);
create index if not exists idx_student_badges_student on public.student_badges(student_id);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios','android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists idx_device_tokens_user on public.device_tokens(user_id);

alter table public.profiles add column if not exists last_activity_at timestamptz;
alter table public.profiles add column if not exists last_credit_date date;

commit;
