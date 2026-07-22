-- Migra workout_exercises para suportar exercícios do novo banco (exercise_id text)
-- mantendo compatibilidade com exercícios Wger legados (wger_exercise_id integer).

-- wger_exercise_id pode ser NULL para treinos criados com exercícios do novo banco.
alter table public.workout_exercises
  alter column wger_exercise_id drop not null;

-- exercise_id referencia o novo banco de exercícios (nullable = exercício Wger legado).
alter table public.workout_exercises
  add column if not exists exercise_id text references public.exercises(id);

-- Índice para busca por exercise_id (útil para JOIN em telas do aluno).
create index if not exists workout_exercises_exercise_id_idx
  on public.workout_exercises (exercise_id)
  where exercise_id is not null;
