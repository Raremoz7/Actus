-- Streak passa a ter o serviço TypeScript (streakService.recomputeStreak) como fonte única.
-- A função SQL recompute_student_streak vira no-op: os triggers ainda a chamam (sem efeito),
-- e os contadores (total_check_ins / total_workouts_completed) seguem sendo atualizados
-- pelas funções de trigger. Mantém a assinatura para não quebrar os triggers existentes.
begin;

create or replace function public.recompute_student_streak(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- no-op: streak é calculado pelo backend (streakService) na transação do evento.
  return;
end;
$$;

commit;
