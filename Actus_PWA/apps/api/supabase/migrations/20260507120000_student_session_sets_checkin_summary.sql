-- Sessão parcial, séries com carga, check-in ligado à sessão, peso corporal, grupamento (evolução).

begin;

-- ---------------------------------------------------------------------------
-- Status de sessão: finalização antecipada (épico aluno)
-- ---------------------------------------------------------------------------
do $en$
begin
  alter type public.workout_session_status add value 'completed_partial';
exception
  when duplicate_object then null;
end $en$;

-- ---------------------------------------------------------------------------
-- Peso corporal (MET / fallback calorias)
-- ---------------------------------------------------------------------------
alter table public.user_basic_info
  add column if not exists body_weight_kg numeric(6, 2);

comment on column public.user_basic_info.body_weight_kg is
  'Peso corporal (kg) para estimativa de gasto calórico; opcional.';

-- ---------------------------------------------------------------------------
-- Grupamento muscular no template (evolução vs histórico)
-- ---------------------------------------------------------------------------
alter table public.workout_exercises
  add column if not exists muscle_group text;

comment on column public.workout_exercises.muscle_group is
  'Rótulo livre do personal para agrupar exercícios (ex.: peito, pernas).';

-- ---------------------------------------------------------------------------
-- Check-in opcionalmente vinculado à sessão de treino
-- ---------------------------------------------------------------------------
alter table public.check_ins
  add column if not exists workout_session_id uuid references public.workout_sessions (id) on delete set null;

create index if not exists check_ins_workout_session_id_idx
  on public.check_ins (workout_session_id)
  where workout_session_id is not null;

-- ---------------------------------------------------------------------------
-- Séries executadas na sessão
-- ---------------------------------------------------------------------------
create table if not exists public.session_sets (
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

create index if not exists session_sets_session_id_idx on public.session_sets (session_id);

create trigger trg_session_sets_updated_at
  before update on public.session_sets
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Atividade do dia: contar sessão parcial como dia ativo (streak)
-- ---------------------------------------------------------------------------
create or replace function public.activity_dates_for_student(p_student_id uuid)
returns table (d date)
language sql
stable
set search_path = public
as $$
  select distinct c.check_in_date as d
  from public.check_ins c
  where c.student_id = p_student_id
  union
  select distinct ws.scheduled_for_date as d
  from public.workout_sessions ws
  where ws.student_id = p_student_id
    -- Comparar por text evita 55P04 na mesma transação que fez ADD VALUE no enum.
    and ws.status::text in ('completed', 'completed_partial')
    and ws.scheduled_for_date is not null;
$$;

-- ---------------------------------------------------------------------------
-- Stats: treino completo incrementa contador; parcial só recompõe streak
-- ---------------------------------------------------------------------------
create or replace function public.trg_workout_session_completed_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed'
     and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    update public.profiles
    set total_workouts_completed = total_workouts_completed + 1, updated_at = now()
    where id = new.student_id;
    perform public.recompute_student_streak(new.student_id);
  elsif new.status::text = 'completed_partial'
     and (tg_op = 'INSERT' or old.status::text is distinct from 'completed_partial') then
    perform public.recompute_student_streak(new.student_id);
  end if;
  return new;
end;
$$;

alter table public.session_sets enable row level security;

create policy session_sets_student_via_session on public.session_sets
  for all
  using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_sets.session_id and ws.student_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_sets.session_id and ws.student_id = auth.uid()
    )
  );

grant select, insert, update, delete on table public.session_sets to authenticated;

commit;
