-- Adiciona campo machine_type para exercícios com equipment = 'machine'
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS machine_type TEXT NULL;

UPDATE public.exercises SET machine_type = 'Smith Machine' WHERE id IN (
  'Decline_Smith_Press',
  'Smith_Machine_Behind_the_Back_Shrug',
  'Smith_Machine_Bench_Press',
  'Smith_Machine_Bent_Over_Row',
  'Smith_Machine_Calf_Raise',
  'Smith_Machine_Close-Grip_Bench_Press',
  'Smith_Machine_Decline_Press',
  'Smith_Machine_Hang_Power_Clean',
  'Smith_Machine_Hip_Raise',
  'Smith_Machine_Incline_Bench_Press',
  'Smith_Machine_Leg_Press',
  'Smith_Machine_One-Arm_Upright_Row',
  'Smith_Machine_Overhead_Shoulder_Press',
  'Smith_Machine_Pistol_Squat',
  'Smith_Machine_Reverse_Calf_Raises',
  'Smith_Machine_Squat',
  'Smith_Machine_Stiff-Legged_Deadlift',
  'Smith_Machine_Upright_Row',
  'Smith_Single-Leg_Split_Squat'
);

UPDATE public.exercises SET machine_type = 'Esteira' WHERE id IN (
  'Jogging_Treadmill', 'Running_Treadmill', 'Walking_Treadmill'
);

UPDATE public.exercises SET machine_type = 'Leg Press' WHERE id IN (
  'Leg_Press', 'Narrow_Stance_Leg_Press', 'Calf_Press_On_The_Leg_Press_Machine'
);

UPDATE public.exercises SET machine_type = 'Hack Squat' WHERE id IN (
  'Hack_Squat', 'Narrow_Stance_Hack_Squats', 'Lying_Machine_Squat'
);

UPDATE public.exercises SET machine_type = 'Mesa Flexora' WHERE id IN (
  'Lying_Leg_Curls', 'Seated_Leg_Curl', 'Standing_Leg_Curl'
);

UPDATE public.exercises SET machine_type = 'Extensora' WHERE id IN (
  'Leg_Extensions', 'Single-Leg_Leg_Extension'
);

UPDATE public.exercises SET machine_type = 'Leverage' WHERE id IN (
  'Leverage_Chest_Press',
  'Leverage_Deadlift',
  'Leverage_Shoulder_Press',
  'Leverage_Incline_Chest_Press',
  'Leverage_Decline_Chest_Press',
  'Leverage_High_Row',
  'Leverage_Iso_Row',
  'Leverage_Shrug'
);

UPDATE public.exercises SET machine_type = 'Bicicleta Ergométrica' WHERE id IN (
  'Bicycling_Stationary', 'Recumbent_Bike'
);

UPDATE public.exercises SET machine_type = 'Peck Deck' WHERE id IN (
  'Butterfly', 'Reverse_Machine_Flyes'
);

UPDATE public.exercises SET machine_type = 'Panturrilha (Máquina)' WHERE id IN (
  'Calf_Press', 'Calf-Machine_Shoulder_Shrug', 'Seated_Calf_Raise', 'Standing_Calf_Raises'
);

UPDATE public.exercises SET machine_type = 'Remo Ergométrico'   WHERE id = 'Rowing_Stationary';
UPDATE public.exercises SET machine_type = 'Elíptico'           WHERE id = 'Elliptical_Trainer';
UPDATE public.exercises SET machine_type = 'Stairmaster'        WHERE id = 'Stairmaster';
UPDATE public.exercises SET machine_type = 'Escada Rolante'     WHERE id = 'Step_Mill';
UPDATE public.exercises SET machine_type = 'Máquina de Abdominal' WHERE id = 'Ab_Crunch_Machine';
UPDATE public.exercises SET machine_type = 'Supino (Máquina)'  WHERE id = 'Machine_Bench_Press';
UPDATE public.exercises SET machine_type = 'Rosca (Máquina)'   WHERE id IN ('Machine_Bicep_Curl', 'Machine_Preacher_Curls');
UPDATE public.exercises SET machine_type = 'Tríceps (Máquina)' WHERE id = 'Machine_Triceps_Extension';
UPDATE public.exercises SET machine_type = 'Press Ombro (Máquina)' WHERE id = 'Machine_Shoulder_Military_Press';
UPDATE public.exercises SET machine_type = 'Dip (Máquina)'     WHERE id = 'Dip_Machine';
UPDATE public.exercises SET machine_type = 'Remada T-Bar'      WHERE id = 'Lying_T-Bar_Row';
UPDATE public.exercises SET machine_type = 'Glúteo e Isquiotibial (GHR)' WHERE id = 'Glute_Ham_Raise';
UPDATE public.exercises SET machine_type = 'Extensão Lombar (Máquina)' WHERE id = 'Reverse_Hyperextension';
UPDATE public.exercises SET machine_type = 'Agachamento (Máquina)' WHERE id = 'Chair_Squat';

CREATE INDEX IF NOT EXISTS exercises_machine_type_idx ON public.exercises (machine_type)
  WHERE machine_type IS NOT NULL;
