-- Actus Fase 1: perfis (3 papéis), vínculos, convites, treinos, execução, check-in, sync idempotente, dietas (stub), RLS e RPCs.
-- Ver docs/DATA-MODEL.md

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('personal', 'nutricionista', 'aluno');

create type public.link_status as enum ('active', 'revoked');

create type public.professional_role as enum ('personal', 'nutricionista');

create type public.workout_session_status as enum ('in_progress', 'completed', 'abandoned');

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tipo public.user_role not null default 'aluno',
  display_name text,
  avatar_url text,
  timezone text not null default 'America/Sao_Paulo',
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  last_activity_date date,
  total_workouts_completed integer not null default 0,
  total_check_ins integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_streak_non_negative check (streak_current >= 0 and streak_best >= 0),
  constraint profiles_counts_non_negative check (
    total_workouts_completed >= 0
    and total_check_ins >= 0
  )
);

comment on table public.profiles is 'Perfil de app; tipo elevado a personal/nutricionista via service role ou fluxo controlado.';

-- ---------------------------------------------------------------------------
-- Convites (emitidos por personal ou nutricionista)
-- ---------------------------------------------------------------------------
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles (id) on delete cascade,
  code text not null,
  expires_at timestamptz not null,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint invites_max_uses_positive check (max_uses > 0),
  constraint invites_used_count_valid check (used_count >= 0 and used_count <= max_uses)
);

create unique index invites_code_key on public.invites (code);

create index invites_professional_id_idx on public.invites (professional_id);

-- ---------------------------------------------------------------------------
-- Vínculo aluno ↔ profissional (máx. 1 ativo por professional_role)
-- ---------------------------------------------------------------------------
create table public.student_professional_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  professional_role public.professional_role not null,
  status public.link_status not null default 'active',
  linked_at timestamptz not null default now(),
  constraint student_professional_links_distinct check (student_id <> professional_id),
  constraint student_professional_links_unique_pair unique (student_id, professional_id)
);

create unique index student_professional_links_one_active_per_role_idx
  on public.student_professional_links (student_id, professional_role)
  where status = 'active';

create index student_professional_links_professional_id_idx
  on public.student_professional_links (professional_id);

create index student_professional_links_student_id_idx
  on public.student_professional_links (student_id);

-- Consistência: professional_role bate com profiles.tipo do profissional
create or replace function public.enforce_link_professional_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.user_role;
begin
  select p.tipo into t from public.profiles p where p.id = new.professional_id;
  if t is null then
    raise exception 'Profissional inexistente';
  end if;
  if t = 'aluno' then
    raise exception 'professional_id deve ser personal ou nutricionista';
  end if;
  if new.professional_role = 'personal' and t <> 'personal' then
    raise exception 'professional_role não corresponde ao tipo do perfil';
  end if;
  if new.professional_role = 'nutricionista' and t <> 'nutricionista' then
    raise exception 'professional_role não corresponde ao tipo do perfil';
  end if;
  return new;
end;
$$;

create trigger trg_student_professional_links_enforce_role
  before insert or update of professional_id, professional_role
  on public.student_professional_links
  for each row
  execute function public.enforce_link_professional_role();

-- ---------------------------------------------------------------------------
-- Treinos (templates) — somente personal
-- ---------------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  owner_personal_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_owner_personal_id_idx on public.workouts (owner_personal_id);

create or replace function public.enforce_workout_owner_is_personal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.user_role;
begin
  select p.tipo into t from public.profiles p where p.id = new.owner_personal_id;
  if t is distinct from 'personal' then
    raise exception 'Treino deve pertencer a um personal';
  end if;
  return new;
end;
$$;

create trigger trg_workouts_owner_is_personal
  before insert or update of owner_personal_id
  on public.workouts
  for each row
  execute function public.enforce_workout_owner_is_personal();

-- ---------------------------------------------------------------------------
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
  constraint workout_exercises_position_positive check (position > 0),
  constraint workout_exercises_sets_reps_positive check (sets > 0 and reps > 0 and rest_seconds >= 0),
  constraint workout_exercises_unique_position unique (workout_id, position)
);

create index workout_exercises_workout_id_idx on public.workout_exercises (workout_id);

-- ---------------------------------------------------------------------------
-- Atribuição de treino ao aluno
-- ---------------------------------------------------------------------------
create table public.student_workouts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  weekdays integer[] not null,
  start_date date not null default (timezone('UTC', now()))::date,
  end_date date,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_workouts_weekdays_iso check (
    weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::integer[]
    and cardinality(weekdays) > 0
  )
);

create index student_workouts_student_id_idx on public.student_workouts (student_id);

create index student_workouts_workout_id_idx on public.student_workouts (workout_id);

-- ---------------------------------------------------------------------------
-- Sessão de execução (aluno)
-- ---------------------------------------------------------------------------
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

create index workout_sessions_student_id_scheduled_idx
  on public.workout_sessions (student_id, scheduled_for_date);

-- ---------------------------------------------------------------------------
create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  constraint session_exercises_unique_exercise unique (session_id, workout_exercise_id)
);

create index session_exercises_session_id_idx on public.session_exercises (session_id);

-- ---------------------------------------------------------------------------
-- Check-in diário
-- ---------------------------------------------------------------------------
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  check_in_date date not null,
  source text not null default 'app',
  created_at timestamptz not null default now(),
  constraint check_ins_unique_per_day unique (student_id, check_in_date)
);

create index check_ins_student_id_idx on public.check_ins (student_id);

-- ---------------------------------------------------------------------------
-- Idempotência de operações de sync (outbox)
-- ---------------------------------------------------------------------------
create table public.sync_applied_ops (
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id text not null,
  op_id uuid not null,
  op_type text not null,
  applied_at timestamptz not null default now(),
  primary key (user_id, device_id, op_id)
);

create index sync_applied_ops_user_id_idx on public.sync_applied_ops (user_id);

-- ---------------------------------------------------------------------------
-- Dietas — stub para fase do nutricionista
-- ---------------------------------------------------------------------------
create table public.diet_templates (
  id uuid primary key default gen_random_uuid(),
  owner_nutritionist_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index diet_templates_owner_idx on public.diet_templates (owner_nutritionist_id);

create or replace function public.enforce_diet_owner_is_nutritionist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.user_role;
begin
  select p.tipo into t from public.profiles p where p.id = new.owner_nutritionist_id;
  if t is distinct from 'nutricionista' then
    raise exception 'Plano de dieta deve pertencer a um nutricionista';
  end if;
  return new;
end;
$$;

create trigger trg_diet_templates_owner_is_nutritionist
  before insert or update of owner_nutritionist_id
  on public.diet_templates
  for each row
  execute function public.enforce_diet_owner_is_nutritionist();

create table public.student_diets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  diet_template_id uuid not null references public.diet_templates (id) on delete cascade,
  start_date date not null default (timezone('UTC', now()))::date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_diets_student_id_idx on public.student_diets (student_id);

-- ---------------------------------------------------------------------------
-- Streak e agregados
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
    and ws.status = 'completed'
    and ws.scheduled_for_date is not null;
$$;

create or replace function public.recompute_student_streak(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tz text;
  ref_date date;
  d date;
  streak int := 0;
  has_today boolean;
  has_yesterday boolean;
  start_date date;
begin
  select coalesce(p.timezone, 'UTC') into tz from public.profiles p where p.id = p_student_id;
  if not found then
    return;
  end if;

  ref_date := (timezone(tz, now()))::date;

  select exists (
    select 1 from public.activity_dates_for_student(p_student_id) a where a.d = ref_date
  ) into has_today;

  if has_today then
    start_date := ref_date;
  else
    select exists (
      select 1 from public.activity_dates_for_student(p_student_id) a where a.d = ref_date - 1
    ) into has_yesterday;
    if has_yesterday then
      start_date := ref_date - 1;
    else
      start_date := null;
    end if;
  end if;

  if start_date is null then
    streak := 0;
  else
    d := start_date;
    loop
      exit when not exists (
        select 1 from public.activity_dates_for_student(p_student_id) a where a.d = d
      );
      streak := streak + 1;
      d := d - 1;
    end loop;
  end if;

  update public.profiles p
  set
    streak_current = streak,
    streak_best = greatest(p.streak_best, streak),
    last_activity_date = (
      select max(x.d) from public.activity_dates_for_student(p_student_id) x
    ),
    updated_at = now()
  where p.id = p_student_id;
end;
$$;

create or replace function public.trg_after_check_in_recompute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_student_streak(new.student_id);
  update public.profiles
  set total_check_ins = total_check_ins + 1, updated_at = now()
  where id = new.student_id;
  return new;
end;
$$;

-- Evita double increment: use separate trigger only on insert
create trigger trg_check_ins_after_insert
  after insert on public.check_ins
  for each row
  execute function public.trg_after_check_in_recompute();

-- Fix: the above increments total_check_ins every insert but recompute runs too - actually on INSERT we want increment once.
-- Recompute doesn't set total_check_ins - trigger does +1. Good.

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
  end if;
  return new;
end;
$$;

create trigger trg_workout_sessions_completed
  after insert or update of status on public.workout_sessions
  for each row
  execute function public.trg_workout_session_completed_stats();

-- ---------------------------------------------------------------------------
-- Auth: criar perfil ao registrar usuário
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, tipo)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    'aluno'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: consumir convite
-- ---------------------------------------------------------------------------
create or replace function public.consume_invite(invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  me public.user_role;
  inv public.invites%rowtype;
  prof public.user_role;
  role public.professional_role;
begin
  if uid is null then
    raise exception 'Não autenticado';
  end if;

  select p.tipo into me from public.profiles p where p.id = uid;
  if not found then
    raise exception 'Perfil inexistente';
  end if;
  if me is distinct from 'aluno' then
    raise exception 'Somente perfil aluno pode consumir convite';
  end if;

  select * into inv from public.invites i where i.code = invite_code for update;
  if not found then
    raise exception 'Convite inválido';
  end if;

  if inv.expires_at < now() then
    raise exception 'Convite expirado';
  end if;
  if inv.used_count >= inv.max_uses then
    raise exception 'Convite esgotado';
  end if;

  select p.tipo into prof from public.profiles p where p.id = inv.professional_id;
  if not found then
    raise exception 'Emissor do convite inexistente';
  end if;
  if prof = 'personal' then
    role := 'personal';
  elsif prof = 'nutricionista' then
    role := 'nutricionista';
  else
    raise exception 'Emissor do convite inválido';
  end if;

  if exists (
    select 1 from public.student_professional_links l
    where l.student_id = uid
      and l.professional_id = inv.professional_id
      and l.status = 'active'
  ) then
    return jsonb_build_object(
      'ok', true,
      'note', 'already_linked',
      'professional_id', inv.professional_id,
      'professional_role', role
    );
  end if;

  if exists (
    select 1 from public.student_professional_links l
    where l.student_id = uid
      and l.professional_role = role
      and l.status = 'active'
      and l.professional_id <> inv.professional_id
  ) then
    raise exception 'Aluno já possui profissional ativo neste papel';
  end if;

  insert into public.student_professional_links (student_id, professional_id, professional_role, status)
  values (uid, inv.professional_id, role, 'active')
  on conflict (student_id, professional_id) do update
  set
    status = 'active',
    professional_role = excluded.professional_role,
    linked_at = now();

  update public.invites
  set used_count = used_count + 1
  where id = inv.id;

  return jsonb_build_object(
    'ok', true,
    'professional_id', inv.professional_id,
    'professional_role', role
  );
end;
$$;

revoke all on function public.consume_invite(text) from public;
grant execute on function public.consume_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: aplicar operação de sync (idempotente)
-- ---------------------------------------------------------------------------
create or replace function public.apply_sync_operation(
  device_id text,
  op_id uuid,
  op_type text,
  payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  me public.user_role;
  ins int;
  check_date date;
  tz text;
begin
  if uid is null then
    raise exception 'Não autenticado';
  end if;
  if device_id is null or length(trim(device_id)) = 0 then
    raise exception 'device_id obrigatório';
  end if;

  select p.tipo into me from public.profiles p where p.id = uid;
  if not found then
    raise exception 'Perfil inexistente';
  end if;

  if op_type = 'daily_checkin' and me is distinct from 'aluno' then
    raise exception 'Check-in apenas para aluno';
  end if;

  insert into public.sync_applied_ops (user_id, device_id, op_id, op_type)
  values (uid, device_id, op_id, op_type)
  on conflict do nothing;
  get diagnostics ins = row_count;
  if ins = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate_op');
  end if;

  if op_type = 'daily_checkin' then
    select coalesce(p.timezone, 'UTC') into tz from public.profiles p where p.id = uid;
    check_date := coalesce(
      (payload ->> 'check_in_date')::date,
      (timezone(tz, now()))::date
    );
    insert into public.check_ins (student_id, check_in_date, source)
    values (uid, check_date, 'sync')
    on conflict (student_id, check_in_date) do nothing;
    return jsonb_build_object('applied', true, 'op_type', op_type, 'check_in_date', check_date);
  end if;

  -- Demais tipos: apenas registra idempotência (expandir depois)
  return jsonb_build_object('applied', true, 'op_type', op_type, 'note', 'recorded_only');
end;
$$;

revoke all on function public.apply_sync_operation(text, uuid, text, jsonb) from public;
grant execute on function public.apply_sync_operation(text, uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at automático (perfis e tabelas principais)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_workouts_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();

create trigger trg_student_workouts_updated_at before update on public.student_workouts
  for each row execute function public.set_updated_at();

create trigger trg_workout_sessions_updated_at before update on public.workout_sessions
  for each row execute function public.set_updated_at();

create trigger trg_diet_templates_updated_at before update on public.diet_templates
  for each row execute function public.set_updated_at();

create trigger trg_student_diets_updated_at before update on public.student_diets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.student_professional_links enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.student_workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.check_ins enable row level security;
alter table public.sync_applied_ops enable row level security;
alter table public.diet_templates enable row level security;
alter table public.student_diets enable row level security;

-- profiles
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());

create policy profiles_select_linked_students on public.profiles
  for select using (
    exists (
      select 1
      from public.student_professional_links spl
      where spl.student_id = profiles.id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
    )
  );

create policy profiles_select_my_professionals on public.profiles
  for select using (
    exists (
      select 1
      from public.student_professional_links spl
      where spl.professional_id = profiles.id
        and spl.student_id = auth.uid()
        and spl.status = 'active'
    )
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- invites
create policy invites_select_own on public.invites
  for select using (professional_id = auth.uid());

create policy invites_insert_own on public.invites
  for insert with check (
    professional_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.tipo in ('personal', 'nutricionista')
    )
  );

create policy invites_update_own on public.invites
  for update using (professional_id = auth.uid()) with check (professional_id = auth.uid());

create policy invites_delete_own on public.invites
  for delete using (professional_id = auth.uid());

-- student_professional_links: leitura para participantes; escrita via RPC (sem política de insert/update para authenticated)
create policy spl_select_as_participant on public.student_professional_links
  for select using (
    student_id = auth.uid()
    or professional_id = auth.uid()
  );

-- workouts
create policy workouts_select_owner on public.workouts
  for select using (owner_personal_id = auth.uid());

create policy workouts_select_assigned_student on public.workouts
  for select using (
    exists (
      select 1
      from public.student_workouts sw
      join public.student_professional_links spl
        on spl.student_id = sw.student_id
        and spl.professional_id = workouts.owner_personal_id
        and spl.status = 'active'
        and spl.professional_role = 'personal'
      where sw.workout_id = workouts.id
        and sw.student_id = auth.uid()
    )
  );

create policy workouts_all_owner on public.workouts
  for all using (owner_personal_id = auth.uid()) with check (owner_personal_id = auth.uid());

-- workout_exercises: acesso indireto ao dono do treino ou aluno com atribuição
create policy we_select_via_workout on public.workout_exercises
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id
        and (
          w.owner_personal_id = auth.uid()
          or exists (
            select 1 from public.student_workouts sw
            where sw.workout_id = w.id and sw.student_id = auth.uid()
          )
        )
    )
  );

create policy we_mutate_owner on public.workout_exercises
  for all using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.owner_personal_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id and w.owner_personal_id = auth.uid()
    )
  );

-- student_workouts
create policy sw_select_student on public.student_workouts
  for select using (student_id = auth.uid());

create policy sw_select_personal on public.student_workouts
  for select using (
    exists (
      select 1
      from public.workouts w
      join public.student_professional_links spl
        on spl.student_id = student_workouts.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
      where w.id = student_workouts.workout_id
        and w.owner_personal_id = auth.uid()
    )
  );

create policy sw_insert_personal on public.student_workouts
  for insert with check (
    exists (
      select 1
      from public.workouts w
      join public.student_professional_links spl
        on spl.student_id = student_workouts.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
      where w.id = student_workouts.workout_id
        and w.owner_personal_id = auth.uid()
    )
  );

create policy sw_update_personal on public.student_workouts
  for update using (
    exists (
      select 1
      from public.workouts w
      join public.student_professional_links spl
        on spl.student_id = student_workouts.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
      where w.id = student_workouts.workout_id
        and w.owner_personal_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.workouts w
      join public.student_professional_links spl
        on spl.student_id = student_workouts.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
      where w.id = student_workouts.workout_id
        and w.owner_personal_id = auth.uid()
    )
  );

create policy sw_delete_personal on public.student_workouts
  for delete using (
    exists (
      select 1
      from public.workouts w
      join public.student_professional_links spl
        on spl.student_id = student_workouts.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
      where w.id = student_workouts.workout_id
        and w.owner_personal_id = auth.uid()
    )
  );

-- workout_sessions
create policy ws_student_all on public.workout_sessions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy ws_select_personal on public.workout_sessions
  for select using (
    exists (
      select 1
      from public.student_professional_links spl
      where spl.student_id = workout_sessions.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
    )
  );

-- session_exercises
create policy se_student_via_session on public.session_exercises
  for all using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.student_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.student_id = auth.uid()
    )
  );

create policy se_select_personal on public.session_exercises
  for select using (
    exists (
      select 1
      from public.workout_sessions ws
      join public.student_professional_links spl
        on spl.student_id = ws.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
      where ws.id = session_exercises.session_id
    )
  );

-- check_ins
create policy check_ins_student_select on public.check_ins
  for select using (student_id = auth.uid());

create policy check_ins_student_insert on public.check_ins
  for insert with check (student_id = auth.uid());

create policy check_ins_select_personal on public.check_ins
  for select using (
    exists (
      select 1
      from public.student_professional_links spl
      where spl.student_id = check_ins.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'personal'
    )
  );

create policy check_ins_select_nutri on public.check_ins
  for select using (
    exists (
      select 1
      from public.student_professional_links spl
      where spl.student_id = check_ins.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'nutricionista'
    )
  );

-- sync_applied_ops
create policy sync_ops_select_own on public.sync_applied_ops
  for select using (user_id = auth.uid());

-- sync is written only by RPC (security definer) — no insert policy for authenticated

-- diet_templates
create policy diet_templates_owner_all on public.diet_templates
  for all using (owner_nutritionist_id = auth.uid()) with check (owner_nutritionist_id = auth.uid());

create policy diet_templates_select_student on public.diet_templates
  for select using (
    exists (
      select 1
      from public.student_diets sd
      where sd.diet_template_id = diet_templates.id
        and sd.student_id = auth.uid()
    )
  );

-- student_diets
create policy student_diets_select_student on public.student_diets
  for select using (student_id = auth.uid());

create policy student_diets_all_nutri on public.student_diets
  for all
  using (
    exists (
      select 1
      from public.diet_templates dt
      where dt.id = student_diets.diet_template_id
        and dt.owner_nutritionist_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.diet_templates dt
      where dt.id = student_diets.diet_template_id
        and dt.owner_nutritionist_id = auth.uid()
    )
    and exists (
      select 1
      from public.student_professional_links spl
      where spl.student_id = student_diets.student_id
        and spl.professional_id = auth.uid()
        and spl.status = 'active'
        and spl.professional_role = 'nutricionista'
    )
  );

-- ---------------------------------------------------------------------------
-- Permissões (API autenticada; RLS restringe linhas)
-- ---------------------------------------------------------------------------
grant usage on type public.user_role to authenticated;
grant usage on type public.link_status to authenticated;
grant usage on type public.professional_role to authenticated;
grant usage on type public.workout_session_status to authenticated;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.invites to authenticated;
grant select on table public.student_professional_links to authenticated;
grant select, insert, update, delete on table public.workouts to authenticated;
grant select, insert, update, delete on table public.workout_exercises to authenticated;
grant select, insert, update, delete on table public.student_workouts to authenticated;
grant select, insert, update, delete on table public.workout_sessions to authenticated;
grant select, insert, update, delete on table public.session_exercises to authenticated;
grant select, insert on table public.check_ins to authenticated;
grant select on table public.sync_applied_ops to authenticated;
grant select, insert, update, delete on table public.diet_templates to authenticated;
grant select, insert, update, delete on table public.student_diets to authenticated;
