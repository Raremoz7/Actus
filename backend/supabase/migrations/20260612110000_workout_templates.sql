-- Banco de treinos templates globais, gerenciados pelo admin Actus.
-- Personais podem ver e copiar para sua biblioteca pessoal.

CREATE TABLE public.workout_templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  notes       TEXT,
  created_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_template_exercises (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id         UUID    NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  position            INT     NOT NULL,
  exercise_id         TEXT,
  wger_exercise_id    INT,
  name_snapshot       TEXT    NOT NULL,
  sets                INT     NOT NULL DEFAULT 3,
  reps                INT     NOT NULL DEFAULT 10,
  rest_seconds        INT     NOT NULL DEFAULT 60,
  notes               TEXT,
  muscle_group        TEXT,
  CONSTRAINT chk_exercise_ref CHECK (exercise_id IS NOT NULL OR wger_exercise_id IS NOT NULL)
);

CREATE INDEX workout_template_exercises_template_idx ON public.workout_template_exercises (template_id);
