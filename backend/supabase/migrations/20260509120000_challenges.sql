-- Desafios (personal) + participantes (alunos). Autorização via backend; RLS off.

begin;

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
  updated_at timestamptz not null default now(),
  constraint challenges_dates_ok check (ends_on >= starts_on),
  constraint challenges_name_nonempty check (length(trim(name)) >= 1)
);

create index challenges_owner_idx on public.challenges (owner_professional_id);
create index challenges_status_idx on public.challenges (status);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.challenge_participant_status not null default 'invited',
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (challenge_id, student_id)
);

create index challenge_participants_student_idx on public.challenge_participants (student_id);

create trigger trg_challenges_updated_at
  before update on public.challenges
  for each row
  execute function public.set_updated_at();

alter table public.challenges disable row level security;
alter table public.challenge_participants disable row level security;

revoke all on table public.challenges from anon, authenticated;
revoke all on table public.challenge_participants from anon, authenticated;

commit;
