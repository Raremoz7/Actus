-- Seed de ecossistema de teste (local). Idempotente: apaga os usuários de seed (cascata) e recria.
-- Senha de todos: actus12345  (hash bcrypt via pgcrypto, compatível com bcryptjs do login).
--
-- Topologia:
--   professor@actus.dev  (personal)      João Personal
--   nutri@actus.dev      (nutricionista) Marina Nutri
--   aluno@actus.dev      (aluno)         Carlos Aluno    -> vinculado ao personal E ao nutri
--   aluno2@actus.dev     (aluno)         Beatriz Aluna   -> vinculada ao personal
--   + 4 treinos reais (exercícios do catálogo Wger empacotado) — split Push/Pull/Legs p/ Carlos
--     e full body iniciante p/ Beatriz
--   + 1 dieta atribuída ao Carlos
--   + 1 desafio ATIVO com os dois alunos participando

begin;

delete from public.app_users
where email in ('professor@actus.dev','nutri@actus.dev','aluno@actus.dev','aluno2@actus.dev','teste.personal@actus.dev');

do $$
declare
  prof_id  uuid := gen_random_uuid();
  nutri_id uuid := gen_random_uuid();
  al1_id   uuid := gen_random_uuid();
  al2_id   uuid := gen_random_uuid();
  w_push   uuid := gen_random_uuid();
  w_pull   uuid := gen_random_uuid();
  w_legs   uuid := gen_random_uuid();
  w_ini    uuid := gen_random_uuid();
  diet_id  uuid := gen_random_uuid();
  ch_id    uuid := gen_random_uuid();
begin
  -- ----- PROFISSIONAIS -----
  insert into public.app_users (id, email, password_hash)
    values (prof_id, 'professor@actus.dev', crypt('actus12345', gen_salt('bf', 12)));
  insert into public.profiles (id, display_name, tipo, phone)
    values (prof_id, 'João Personal', 'personal', '11988880001');
  insert into public.professional_info (user_id, cref_number, bio, specialties)
    values (prof_id, '012345-G/SP', 'Personal trainer há 10 anos.', '["hipertrofia","emagrecimento"]'::jsonb);

  insert into public.app_users (id, email, password_hash)
    values (nutri_id, 'nutri@actus.dev', crypt('actus12345', gen_salt('bf', 12)));
  insert into public.profiles (id, display_name, tipo, phone)
    values (nutri_id, 'Marina Nutri', 'nutricionista', '11988880002');
  insert into public.professional_info (user_id, crn_number, bio, specialties)
    values (nutri_id, 'CRN-3 12345', 'Nutricionista esportiva.', '["esportiva","clinica"]'::jsonb);

  -- ----- ALUNOS -----
  insert into public.app_users (id, email, password_hash)
    values (al1_id, 'aluno@actus.dev', crypt('actus12345', gen_salt('bf', 12)));
  insert into public.profiles (id, display_name, tipo)
    values (al1_id, 'Carlos Aluno', 'aluno');
  insert into public.user_basic_info (user_id, full_name, birth_date, phone, gender)
    values (al1_id, 'Carlos Aluno', '1995-04-12', '11977770001', 'masculino');

  insert into public.app_users (id, email, password_hash)
    values (al2_id, 'aluno2@actus.dev', crypt('actus12345', gen_salt('bf', 12)));
  insert into public.profiles (id, display_name, tipo)
    values (al2_id, 'Beatriz Aluna', 'aluno');
  insert into public.user_basic_info (user_id, full_name, birth_date, phone, gender)
    values (al2_id, 'Beatriz Aluna', '1998-09-23', '11977770002', 'feminino');

  -- ----- VÍNCULOS -----
  insert into public.student_professional_links (student_id, professional_id, professional_role, status) values
    (al1_id, prof_id,  'personal',      'active'),
    (al2_id, prof_id,  'personal',      'active'),
    (al1_id, nutri_id, 'nutricionista', 'active');

  -- ----- TREINOS (personal) — exercícios reais do catálogo Wger empacotado -----
  insert into public.workouts (id, owner_personal_id, name, notes) values
    (w_push, prof_id, 'Peito, Ombro e Tríceps',          'Treino de empurrar focado em volume para superiores.'),
    (w_pull, prof_id, 'Costas e Bíceps',                 'Treino de puxar com ênfase em dorsais e bíceps.'),
    (w_legs, prof_id, 'Pernas completo',                 'Quadríceps, posterior e panturrilha num só treino.'),
    (w_ini,  prof_id, 'Full body iniciante (máquinas)',  'Primeira rotina em máquinas guiadas, corpo inteiro.');

  insert into public.workout_exercises (workout_id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, muscle_group) values
    -- Peito, Ombro e Tríceps
    (w_push, 1, 73,   'Bench Press',                       4, 10, 90, 'Peito'),
    (w_push, 2, 538,  'Incline Bench Press - Barbell',     3, 10, 90, 'Peito'),
    (w_push, 3, 238,  'Fly With Dumbbells',                3, 12, 60, 'Peito'),
    (w_push, 4, 567,  'Shoulder Press, Dumbbells',         3, 10, 90, 'Ombros'),
    (w_push, 5, 348,  'Lateral Raises',                    3, 15, 45, 'Ombros'),
    (w_push, 6, 1185, 'Triceps Pushdown',                  3, 12, 60, 'Braços'),
    -- Costas e Bíceps
    (w_pull, 1, 158,  'Close-grip Lat Pull Down',          4, 10, 90, 'Costas'),
    (w_pull, 2, 921,  'Seated Cable Rows',                 3, 10, 90, 'Costas'),
    (w_pull, 3, 81,   'Bent Over Dumbbell Rows',           3, 10, 75, 'Costas'),
    (w_pull, 4, 1732, 'Face pulls with yellow/green band', 3, 15, 45, 'Costas'),
    (w_pull, 5, 92,   'Biceps Curls With Dumbbell',        3, 12, 60, 'Braços'),
    (w_pull, 6, 1567, 'Alternating dumbbell hammer curl',  3, 12, 60, 'Braços'),
    -- Pernas completo
    (w_legs, 1, 257,  'Front Squats',                      4, 8,  120, 'Pernas'),
    (w_legs, 2, 371,  'Leg Press',                         4, 12, 90,  'Pernas'),
    (w_legs, 3, 1652, 'Dumbbell Romanian Deadlift',        3, 10, 90,  'Pernas'),
    (w_legs, 4, 364,  'Leg Curl',                          3, 12, 60,  'Pernas'),
    (w_legs, 5, 369,  'Leg Extension',                     3, 15, 60,  'Pernas'),
    (w_legs, 6, 622,  'Standing Calf Raises',              4, 15, 45,  'Panturrilhas'),
    -- Full body iniciante (máquinas)
    (w_ini,  1, 371,  'Leg Press',                         3, 12, 60, 'Pernas'),
    (w_ini,  2, 1725, 'Seated Row (Machine)',              3, 12, 60, 'Costas'),
    (w_ini,  3, 543,  'Shoulder Press, on Machine',        3, 12, 60, 'Ombros'),
    (w_ini,  4, 364,  'Leg Curl',                          3, 12, 60, 'Pernas'),
    (w_ini,  5, 135,  'Butterfly',                         3, 12, 60, 'Peito'),
    (w_ini,  6, 95,   'Biceps Curl With Cable',            3, 12, 60, 'Braços');

  -- Carlos: split Push (seg) / Pull (qua) / Legs (sex). Beatriz: full body iniciante (ter/qui).
  insert into public.student_workouts (student_id, workout_id, weekdays, display_order) values
    (al1_id, w_push, '{1}',   0),
    (al1_id, w_pull, '{3}',   1),
    (al1_id, w_legs, '{5}',   2),
    (al2_id, w_ini,  '{2,4}', 0);

  -- ----- DIETA (nutri) -> Carlos -----
  insert into public.diet_templates (id, owner_nutritionist_id, name, body)
    values (diet_id, nutri_id, 'Plano 2200 kcal',
      '{"meals":[{"name":"Café da manhã","items":["Ovos mexidos","Aveia","Banana"]},{"name":"Almoço","items":["Frango grelhado","Arroz integral","Salada"]},{"name":"Jantar","items":["Peixe","Batata-doce","Legumes"]}]}'::jsonb);
  insert into public.student_diets (student_id, diet_template_id)
    values (al1_id, diet_id);

  -- ----- DESAFIO (personal) ATIVO -----
  insert into public.challenges (id, owner_professional_id, name, starts_on, ends_on, status)
    values (ch_id, prof_id, 'Desafio 30 dias',
      (now() - interval '5 days')::date, (now() + interval '25 days')::date, 'active');
  insert into public.challenge_participants (challenge_id, student_id, status, responded_at) values
    (ch_id, al1_id, 'active', now()),
    (ch_id, al2_id, 'active', now());
end $$;

commit;
