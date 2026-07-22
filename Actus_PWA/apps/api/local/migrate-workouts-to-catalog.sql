-- Remove os treinos wger dos usuários de seed e recria usando o catálogo PT-BR.
-- Executar apenas no banco local de desenvolvimento.
-- Idempotente: apaga treinos seed pelo nome e recria.

begin;

-- Apagar treinos seed (cascata remove workout_exercises e student_workouts)
delete from public.workouts
where name in (
  'Peito, Ombro e Tríceps',
  'Costas e Bíceps',
  'Pernas completo',
  'Full body iniciante (máquinas)',
  'Full body iniciante'
)
and owner_personal_id = (
  select id from public.app_users where email = 'professor@actus.dev'
);

do $$
declare
  prof_id  uuid;
  al1_id   uuid;
  al2_id   uuid;
  w_push   uuid := gen_random_uuid();
  w_pull   uuid := gen_random_uuid();
  w_legs   uuid := gen_random_uuid();
  w_ini    uuid := gen_random_uuid();
begin
  select id into prof_id from public.app_users where email = 'professor@actus.dev';
  select id into al1_id  from public.app_users where email = 'aluno@actus.dev';
  select id into al2_id  from public.app_users where email = 'aluno2@actus.dev';

  insert into public.workouts (id, owner_personal_id, name, notes) values
    (w_push, prof_id, 'Peito, Ombro e Tríceps',  'Treino de empurrar focado em volume para superiores.'),
    (w_pull, prof_id, 'Costas e Bíceps',          'Treino de puxar com ênfase em dorsais e bíceps.'),
    (w_legs, prof_id, 'Pernas completo',          'Quadríceps, posterior e panturrilha num só treino.'),
    (w_ini,  prof_id, 'Full body iniciante',      'Primeira rotina de força, corpo inteiro.');

  insert into public.workout_exercises (workout_id, position, exercise_id, name_snapshot, sets, reps, rest_seconds, muscle_group) values
    -- Peito, Ombro e Tríceps
    (w_push, 1, 'Barbell_Bench_Press_-_Medium_Grip', 'Supino Reto com Barra',           4, 10, 90, 'Peito'),
    (w_push, 2, 'Incline_Dumbbell_Flyes',            'Crucifixo Inclinado com Halteres', 3, 12, 60, 'Peito'),
    (w_push, 3, 'Butterfly',                         'Butterfly',                        3, 12, 60, 'Peito'),
    (w_push, 4, 'Barbell_Shoulder_Press',            'Desenvolvimento Militar com Barra', 3, 10, 90, 'Ombro'),
    (w_push, 5, 'Side_Lateral_Raise',                'Elevação Lateral',                 3, 15, 45, 'Ombro'),
    (w_push, 6, 'Triceps_Pushdown',                  'Tríceps Pulley',                   3, 12, 60, 'Braço'),
    -- Costas e Bíceps
    (w_pull, 1, 'Close-Grip_Front_Lat_Pulldown',     'Pulldown Frente Pegada Fechada',   4, 10, 90, 'Costas'),
    (w_pull, 2, 'Seated_Cable_Rows',                 'Remada Sentada no Pulley',         3, 10, 90, 'Costas'),
    (w_pull, 3, 'One-Arm_Dumbbell_Row',              'Remada Unilateral com Halter',     3, 10, 75, 'Costas'),
    (w_pull, 4, 'Face_Pull',                         'Face Pull',                        3, 15, 45, 'Costas'),
    (w_pull, 5, 'Dumbbell_Bicep_Curl',               'Rosca Bíceps com Halteres',        3, 12, 60, 'Braço'),
    (w_pull, 6, 'Hammer_Curls',                      'Rosca Martelo',                    3, 12, 60, 'Braço'),
    -- Pernas completo
    (w_legs, 1, 'Barbell_Squat',                     'Agachamento com Barra',            4, 8,  120, 'Pernas'),
    (w_legs, 2, 'Leg_Press',                         'Leg Press',                        4, 12, 90,  'Pernas'),
    (w_legs, 3, 'Romanian_Deadlift',                 'Levantamento Terra Romeno',        3, 10, 90,  'Pernas'),
    (w_legs, 4, 'Lying_Leg_Curls',                   'Cadeira Flexora',                  3, 12, 60,  'Pernas'),
    (w_legs, 5, 'Leg_Extensions',                    'Extensão de Pernas',               3, 15, 60,  'Pernas'),
    (w_legs, 6, 'Standing_Calf_Raises',              'Elevação de Panturrilha em Pé',    4, 15, 45,  'Panturrilhas'),
    -- Full body iniciante
    (w_ini,  1, 'Leg_Press',                         'Leg Press',                        3, 12, 60, 'Pernas'),
    (w_ini,  2, 'Seated_Cable_Rows',                 'Remada Sentada no Pulley',         3, 12, 60, 'Costas'),
    (w_ini,  3, 'Barbell_Shoulder_Press',            'Desenvolvimento Militar com Barra', 3, 12, 60, 'Ombro'),
    (w_ini,  4, 'Lying_Leg_Curls',                   'Cadeira Flexora',                  3, 12, 60, 'Pernas'),
    (w_ini,  5, 'Butterfly',                         'Butterfly',                        3, 12, 60, 'Peito'),
    (w_ini,  6, 'Standing_Biceps_Cable_Curl',        'Rosca Direta na Polia em Pé',      3, 12, 60, 'Braço');

  -- Reatribuir aos alunos: Carlos (Push/Pull/Legs), Beatriz (Full body)
  insert into public.student_workouts (student_id, workout_id, weekdays, display_order) values
    (al1_id, w_push, '{1}',   0),
    (al1_id, w_pull, '{3}',   1),
    (al1_id, w_legs, '{5}',   2),
    (al2_id, w_ini,  '{2,4}', 0);
end $$;

commit;
