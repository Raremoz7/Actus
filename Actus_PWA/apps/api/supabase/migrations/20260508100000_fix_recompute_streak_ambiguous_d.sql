-- PL/pgSQL: variável "d" no mesmo âmbito que coluna "d" de activity_dates_for_student → 42702 ambiguous
begin;

create or replace function public.recompute_student_streak(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tz text;
  ref_date date;
  walk_date date;
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
    walk_date := start_date;
    loop
      exit when not exists (
        select 1
        from public.activity_dates_for_student(p_student_id) a
        where a.d = walk_date
      );
      streak := streak + 1;
      walk_date := walk_date - 1;
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

commit;
