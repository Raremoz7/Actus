-- ============================================================================
-- [DEV] Seed do ecossistema Actus — simula o app em uso real.
--
-- Cria alunos vinculados aos profissionais existentes (Rafael personal / Carla nutri),
-- com treinos e dietas atribuídos, check-ins/sequências, sessões concluídas e um desafio
-- ativo com ranking. As datas são RELATIVAS a current_date, então o seed continua "fresco"
-- sempre que rodar. IDEMPOTENTE: apaga o que semeou (por IDs fixos) e recria do zero.
--
-- Rodar (PowerShell, no projeto):
--   Get-Content scripts/seed-ecosystem.sql -Raw | docker exec -i actutus_fit_backend-main-db-1 psql -U actus -d actus
--
-- Senha de todos os alunos: actus123  (mesmo hash bcrypt dos profissionais).
-- NUNCA usar em produção.
-- ============================================================================

begin;

-- Hash bcrypt(12) de 'actus123' — reutilizado para todos os alunos.
-- (Profissionais já existem e não são tocados além de enriquecer professional_info.)

-- ----------------------------------------------------------------------------
-- 0) Limpeza idempotente (cascatas removem dependentes: links, sessões, check-ins,
--    student_workouts/diets, participações em desafio).
-- ----------------------------------------------------------------------------
delete from app_users where id in (
  'aaaaaaa1-0000-4000-8000-000000000001', -- João
  'aaaaaaa2-0000-4000-8000-000000000002', -- Marina
  'aaaaaaa3-0000-4000-8000-000000000003', -- Pedro
  'aaaaaaa4-0000-4000-8000-000000000004', -- Bia
  'aaaaaaa5-0000-4000-8000-000000000005'  -- Lucas
);
delete from challenges where id = '9999c111-0000-4000-8000-0000000000c1';
delete from workouts where id in (
  '7777aaaa-0000-4000-8000-00000000000a',
  '7777bbbb-0000-4000-8000-00000000000b',
  '7777cccc-0000-4000-8000-00000000000c'
);
delete from diet_templates where id in (
  '8888d111-0000-4000-8000-000000000d11',
  '8888d222-0000-4000-8000-000000000d22'
);
delete from invites where id in (
  'b0000001-0000-4000-8000-0000000000b1',
  'b0000002-0000-4000-8000-0000000000b2'
);

-- ----------------------------------------------------------------------------
-- 1) Alunos: app_users + profiles + user_basic_info
-- ----------------------------------------------------------------------------
insert into app_users (id, email, password_hash, must_change_password) values
  ('aaaaaaa1-0000-4000-8000-000000000001', 'joao@actus.test',   '$2b$12$lAzRpYU7nwYo1NLGN1ck9ug9lDzfmzWCNHTiWlG3BI99RGhGhWCXO', false),
  ('aaaaaaa2-0000-4000-8000-000000000002', 'marina@actus.test', '$2b$12$lAzRpYU7nwYo1NLGN1ck9ug9lDzfmzWCNHTiWlG3BI99RGhGhWCXO', false),
  ('aaaaaaa3-0000-4000-8000-000000000003', 'pedro@actus.test',  '$2b$12$lAzRpYU7nwYo1NLGN1ck9ug9lDzfmzWCNHTiWlG3BI99RGhGhWCXO', false),
  ('aaaaaaa4-0000-4000-8000-000000000004', 'bia@actus.test',    '$2b$12$lAzRpYU7nwYo1NLGN1ck9ug9lDzfmzWCNHTiWlG3BI99RGhGhWCXO', false),
  ('aaaaaaa5-0000-4000-8000-000000000005', 'lucas@actus.test',  '$2b$12$lAzRpYU7nwYo1NLGN1ck9ug9lDzfmzWCNHTiWlG3BI99RGhGhWCXO', false);

insert into profiles (id, tipo, display_name) values
  ('aaaaaaa1-0000-4000-8000-000000000001', 'aluno', 'João Aluno'),
  ('aaaaaaa2-0000-4000-8000-000000000002', 'aluno', 'Marina Aluna'),
  ('aaaaaaa3-0000-4000-8000-000000000003', 'aluno', 'Pedro Aluno'),
  ('aaaaaaa4-0000-4000-8000-000000000004', 'aluno', 'Bia Aluna'),
  ('aaaaaaa5-0000-4000-8000-000000000005', 'aluno', 'Lucas Aluno');

insert into user_basic_info (user_id, full_name, birth_date, gender, body_weight_kg) values
  ('aaaaaaa1-0000-4000-8000-000000000001', 'João Pereira da Silva', '1995-03-12', 'masculino', 82.5),
  ('aaaaaaa2-0000-4000-8000-000000000002', 'Marina Costa Lima',     '1998-07-25', 'feminino',  61.0),
  ('aaaaaaa3-0000-4000-8000-000000000003', 'Pedro Henrique Alves',  '1990-11-02', 'masculino', 91.2),
  ('aaaaaaa4-0000-4000-8000-000000000004', 'Beatriz Souza Rocha',   '2000-01-30', 'feminino',  57.4),
  ('aaaaaaa5-0000-4000-8000-000000000005', 'Lucas Martins',         '1993-09-18', 'masculino', 78.0);

-- ----------------------------------------------------------------------------
-- 2) Enriquece os profissionais (CREF/CRN/bio) — upsert, não recria a conta.
-- ----------------------------------------------------------------------------
insert into professional_info (user_id, cref_number, bio, specialties) values
  ('33333333-3333-3333-3333-333333333333', 'CREF 012345-G/SP', 'Treinador de força e hipertrofia há 8 anos.', '["hipertrofia","forca","emagrecimento"]'::jsonb)
on conflict (user_id) do update set cref_number = excluded.cref_number, bio = excluded.bio, specialties = excluded.specialties;

insert into professional_info (user_id, crn_number, bio, specialties) values
  ('44444444-4444-4444-4444-444444444444', 'CRN 54321/SP', 'Nutricionista esportiva, foco em composição corporal.', '["nutricao_esportiva","emagrecimento"]'::jsonb)
on conflict (user_id) do update set crn_number = excluded.crn_number, bio = excluded.bio, specialties = excluded.specialties;

-- ----------------------------------------------------------------------------
-- 3) Vínculos aluno ↔ profissional (trigger valida role x tipo do profissional)
--    Rafael(personal)=33..  Carla(nutri)=44..
-- ----------------------------------------------------------------------------
insert into student_professional_links (student_id, professional_id, professional_role, status, linked_at) values
  -- João: ecossistema completo (personal + nutri)
  ('aaaaaaa1-0000-4000-8000-000000000001', '33333333-3333-3333-3333-333333333333', 'personal',      'active', now() - interval '30 days'),
  ('aaaaaaa1-0000-4000-8000-000000000001', '44444444-4444-4444-4444-444444444444', 'nutricionista', 'active', now() - interval '30 days'),
  -- Marina: só personal
  ('aaaaaaa2-0000-4000-8000-000000000002', '33333333-3333-3333-3333-333333333333', 'personal',      'active', now() - interval '20 days'),
  -- Pedro: só nutri
  ('aaaaaaa3-0000-4000-8000-000000000003', '44444444-4444-4444-4444-444444444444', 'nutricionista', 'active', now() - interval '15 days'),
  -- Bia: personal + nutri
  ('aaaaaaa4-0000-4000-8000-000000000004', '33333333-3333-3333-3333-333333333333', 'personal',      'active', now() - interval '10 days'),
  ('aaaaaaa4-0000-4000-8000-000000000004', '44444444-4444-4444-4444-444444444444', 'nutricionista', 'active', now() - interval '10 days'),
  -- Lucas: personal (recém-chegado)
  ('aaaaaaa5-0000-4000-8000-000000000005', '33333333-3333-3333-3333-333333333333', 'personal',      'active', now() - interval '1 day');

-- ----------------------------------------------------------------------------
-- 4) Treinos do Rafael (trigger valida owner=personal) + exercícios
-- ----------------------------------------------------------------------------
insert into workouts (id, owner_personal_id, name, notes) values
  ('7777aaaa-0000-4000-8000-00000000000a', '33333333-3333-3333-3333-333333333333', 'Treino A — Peito e Tríceps', 'Foco em volume. Cadência controlada na fase excêntrica.'),
  ('7777bbbb-0000-4000-8000-00000000000b', '33333333-3333-3333-3333-333333333333', 'Treino B — Costas e Bíceps', 'Puxadas com pegada variada.'),
  ('7777cccc-0000-4000-8000-00000000000c', '33333333-3333-3333-3333-333333333333', 'Treino C — Pernas e Core',   'Aquecer joelhos antes dos agachamentos.');

-- Exercícios do Treino A (IDs fixos: referenciados em session_sets)
insert into workout_exercises (id, workout_id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, muscle_group, notes) values
  ('7a000001-0000-4000-8000-0000000000a1', '7777aaaa-0000-4000-8000-00000000000a', 1, 73,  'Supino reto com barra',        4, 8,  90, 'peito',   null),
  ('7a000002-0000-4000-8000-0000000000a2', '7777aaaa-0000-4000-8000-00000000000a', 2, 80,  'Supino inclinado com halteres', 3, 10, 75, 'peito',   null),
  ('7a000003-0000-4000-8000-0000000000a3', '7777aaaa-0000-4000-8000-00000000000a', 3, 206, 'Crucifixo na máquina',          3, 12, 60, 'peito',   'Sentir o alongamento.'),
  ('7a000004-0000-4000-8000-0000000000a4', '7777aaaa-0000-4000-8000-00000000000a', 4, 191, 'Tríceps na corda',              4, 12, 60, 'triceps', null);

-- Exercícios do Treino B
insert into workout_exercises (workout_id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, muscle_group) values
  ('7777bbbb-0000-4000-8000-00000000000b', 1, 181, 'Barra fixa pronada',        4, 8,  90, 'costas'),
  ('7777bbbb-0000-4000-8000-00000000000b', 2, 109, 'Remada curvada com barra',  4, 10, 90, 'costas'),
  ('7777bbbb-0000-4000-8000-00000000000b', 3, 119, 'Puxada na frente',          3, 12, 75, 'costas'),
  ('7777bbbb-0000-4000-8000-00000000000b', 4, 74,  'Rosca direta com barra',    3, 10, 60, 'biceps');

-- Exercícios do Treino C
insert into workout_exercises (workout_id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, muscle_group) values
  ('7777cccc-0000-4000-8000-00000000000c', 1, 111, 'Agachamento livre',         5, 5,  120, 'pernas'),
  ('7777cccc-0000-4000-8000-00000000000c', 2, 120, 'Leg press 45°',             4, 12, 90,  'pernas'),
  ('7777cccc-0000-4000-8000-00000000000c', 3, 117, 'Cadeira flexora',           3, 12, 60,  'pernas'),
  ('7777cccc-0000-4000-8000-00000000000c', 4, 271, 'Prancha abdominal',         3, 1,  45,  'core');

-- ----------------------------------------------------------------------------
-- 5) Atribuição de treinos (student_workouts) — weekdays ISO 1=seg..7=dom
-- ----------------------------------------------------------------------------
insert into student_workouts (id, student_id, workout_id, weekdays, start_date, display_order, is_active) values
  -- João: split A/B/C
  ('6a000001-0000-4000-8000-00000000a001', 'aaaaaaa1-0000-4000-8000-000000000001', '7777aaaa-0000-4000-8000-00000000000a', ARRAY[1,4], current_date - 30, 0, true),
  ('6a000002-0000-4000-8000-00000000a002', 'aaaaaaa1-0000-4000-8000-000000000001', '7777bbbb-0000-4000-8000-00000000000b', ARRAY[2,5], current_date - 30, 1, true),
  ('6a000003-0000-4000-8000-00000000a003', 'aaaaaaa1-0000-4000-8000-000000000001', '7777cccc-0000-4000-8000-00000000000c', ARRAY[3,6], current_date - 30, 2, true),
  -- Marina: A + C
  ('6a000010-0000-4000-8000-00000000a010', 'aaaaaaa2-0000-4000-8000-000000000002', '7777aaaa-0000-4000-8000-00000000000a', ARRAY[1,3,5], current_date - 20, 0, true),
  ('6a000011-0000-4000-8000-00000000a011', 'aaaaaaa2-0000-4000-8000-000000000002', '7777cccc-0000-4000-8000-00000000000c', ARRAY[6],     current_date - 20, 1, true),
  -- Bia: A
  ('6a000020-0000-4000-8000-00000000a020', 'aaaaaaa4-0000-4000-8000-000000000004', '7777aaaa-0000-4000-8000-00000000000a', ARRAY[2,4], current_date - 10, 0, true),
  -- Lucas: A (recém-atribuído, começa hoje)
  ('6a000030-0000-4000-8000-00000000a030', 'aaaaaaa5-0000-4000-8000-000000000005', '7777aaaa-0000-4000-8000-00000000000a', ARRAY[1,3,5], current_date, 0, true);

-- ----------------------------------------------------------------------------
-- 6) Dietas da Carla (trigger valida owner=nutricionista) + atribuição
-- ----------------------------------------------------------------------------
insert into diet_templates (id, owner_nutritionist_id, name, body) values
  ('8888d111-0000-4000-8000-000000000d11', '44444444-4444-4444-4444-444444444444', 'Cutting 1.800 kcal',
   '{"target_kcal":1800,"water":3000,"notes":"Priorizar proteína em todas as refeições.","meals":[
       {"name":"Café da manhã","time":"07:30","foods":"3 ovos mexidos, 40g aveia, 1 banana","kcal":420,"protein":28,"carbs":48,"fat":14},
       {"name":"Almoço","time":"12:30","foods":"150g frango grelhado, 100g arroz integral, salada à vontade","kcal":540,"protein":45,"carbs":55,"fat":12},
       {"name":"Lanche","time":"16:00","foods":"1 scoop whey, 1 maçã","kcal":260,"protein":26,"carbs":28,"fat":4},
       {"name":"Jantar","time":"20:00","foods":"150g tilápia, legumes no vapor","kcal":380,"protein":38,"carbs":18,"fat":15}
     ]}'::jsonb),
  ('8888d222-0000-4000-8000-000000000d22', '44444444-4444-4444-4444-444444444444', 'Hipertrofia 2.800 kcal',
   '{"target_kcal":2800,"water":3500,"notes":"Carboidrato antes e depois do treino.","meals":[
       {"name":"Café da manhã","time":"07:00","foods":"4 ovos, 60g aveia, 2 fatias pão integral","kcal":620,"protein":38,"carbs":70,"fat":20},
       {"name":"Pré-treino","time":"11:00","foods":"1 banana, 30g pasta de amendoim","kcal":300,"protein":8,"carbs":35,"fat":16},
       {"name":"Almoço","time":"13:00","foods":"200g patinho, 150g arroz, feijão, salada","kcal":780,"protein":55,"carbs":85,"fat":18},
       {"name":"Lanche","time":"17:00","foods":"2 scoops whey, 50g granola","kcal":480,"protein":52,"carbs":48,"fat":8},
       {"name":"Jantar","time":"21:00","foods":"180g salmão, 120g batata-doce, brócolis","kcal":620,"protein":42,"carbs":50,"fat":26}
     ]}'::jsonb);

insert into student_diets (student_id, diet_template_id, start_date, is_active) values
  ('aaaaaaa1-0000-4000-8000-000000000001', '8888d222-0000-4000-8000-000000000d22', current_date - 28, true), -- João: hipertrofia
  ('aaaaaaa3-0000-4000-8000-000000000003', '8888d111-0000-4000-8000-000000000d11', current_date - 14, true), -- Pedro: cutting
  ('aaaaaaa4-0000-4000-8000-000000000004', '8888d111-0000-4000-8000-000000000d11', current_date - 8,  true); -- Bia: cutting

-- ----------------------------------------------------------------------------
-- 7) Check-ins (geram sequência via trigger). generate_series relativo a hoje.
-- ----------------------------------------------------------------------------
-- João: 12 dias seguidos (sequência forte)
insert into check_ins (student_id, check_in_date, source)
select 'aaaaaaa1-0000-4000-8000-000000000001', d::date, 'app'
from generate_series((current_date - 11)::timestamp, current_date::timestamp, interval '1 day') g(d);
-- Marina: 5 dias seguidos
insert into check_ins (student_id, check_in_date, source)
select 'aaaaaaa2-0000-4000-8000-000000000002', d::date, 'app'
from generate_series((current_date - 4)::timestamp, current_date::timestamp, interval '1 day') g(d);
-- Pedro: 3 dias
insert into check_ins (student_id, check_in_date, source)
select 'aaaaaaa3-0000-4000-8000-000000000003', d::date, 'app'
from generate_series((current_date - 2)::timestamp, current_date::timestamp, interval '1 day') g(d);
-- Bia: 2 dias
insert into check_ins (student_id, check_in_date, source)
select 'aaaaaaa4-0000-4000-8000-000000000004', d::date, 'app'
from generate_series((current_date - 1)::timestamp, current_date::timestamp, interval '1 day') g(d);
-- Lucas: sem check-in (estado "novo").

-- ----------------------------------------------------------------------------
-- 8) Sessões concluídas (alimentam totais e ranking do desafio).
--    Trigger soma total_workouts_completed em 'completed' e recomputa sequência.
-- ----------------------------------------------------------------------------
-- João — 7 concluídas (A1 com ID fixo p/ anexar séries)
insert into workout_sessions (id, student_id, student_workout_id, scheduled_for_date, status, started_at, completed_at) values
  ('5e550a01-0000-4000-8000-000000000a01', 'aaaaaaa1-0000-4000-8000-000000000001', '6a000001-0000-4000-8000-00000000a001', current_date - 1,  'completed', now() - interval '1 day',  now() - interval '1 day'),
  (gen_random_uuid(), 'aaaaaaa1-0000-4000-8000-000000000001', '6a000001-0000-4000-8000-00000000a001', current_date - 7,  'completed', now() - interval '7 days',  now() - interval '7 days'),
  (gen_random_uuid(), 'aaaaaaa1-0000-4000-8000-000000000001', '6a000001-0000-4000-8000-00000000a001', current_date - 13, 'completed', now() - interval '13 days', now() - interval '13 days'),
  (gen_random_uuid(), 'aaaaaaa1-0000-4000-8000-000000000001', '6a000002-0000-4000-8000-00000000a002', current_date - 2,  'completed', now() - interval '2 days',  now() - interval '2 days'),
  (gen_random_uuid(), 'aaaaaaa1-0000-4000-8000-000000000001', '6a000002-0000-4000-8000-00000000a002', current_date - 9,  'completed', now() - interval '9 days',  now() - interval '9 days'),
  (gen_random_uuid(), 'aaaaaaa1-0000-4000-8000-000000000001', '6a000003-0000-4000-8000-00000000a003', current_date - 4,  'completed', now() - interval '4 days',  now() - interval '4 days'),
  (gen_random_uuid(), 'aaaaaaa1-0000-4000-8000-000000000001', '6a000003-0000-4000-8000-00000000a003', current_date - 11, 'completed', now() - interval '11 days', now() - interval '11 days');

-- Marina — 3 concluídas
insert into workout_sessions (id, student_id, student_workout_id, scheduled_for_date, status, started_at, completed_at) values
  (gen_random_uuid(), 'aaaaaaa2-0000-4000-8000-000000000002', '6a000010-0000-4000-8000-00000000a010', current_date - 1, 'completed', now() - interval '1 day',  now() - interval '1 day'),
  (gen_random_uuid(), 'aaaaaaa2-0000-4000-8000-000000000002', '6a000010-0000-4000-8000-00000000a010', current_date - 5, 'completed', now() - interval '5 days', now() - interval '5 days'),
  (gen_random_uuid(), 'aaaaaaa2-0000-4000-8000-000000000002', '6a000011-0000-4000-8000-00000000a011', current_date - 3, 'completed', now() - interval '3 days', now() - interval '3 days');

-- Bia — 1 parcial (não soma total_workouts_completed, mas conta como atividade)
insert into workout_sessions (id, student_id, student_workout_id, scheduled_for_date, status, started_at, completed_at) values
  (gen_random_uuid(), 'aaaaaaa4-0000-4000-8000-000000000004', '6a000020-0000-4000-8000-00000000a020', current_date - 1, 'completed_partial', now() - interval '1 day', now() - interval '1 day');

-- Séries registradas na última sessão do João (Treino A) — detalhe realista.
insert into session_sets (session_id, workout_exercise_id, set_index, weight_kg, reps_done, rest_seconds_actual) values
  ('5e550a01-0000-4000-8000-000000000a01', '7a000001-0000-4000-8000-0000000000a1', 1, 60.0, 8, 95),
  ('5e550a01-0000-4000-8000-000000000a01', '7a000001-0000-4000-8000-0000000000a1', 2, 62.5, 8, 100),
  ('5e550a01-0000-4000-8000-000000000a01', '7a000001-0000-4000-8000-0000000000a1', 3, 62.5, 7, 110),
  ('5e550a01-0000-4000-8000-000000000a01', '7a000002-0000-4000-8000-0000000000a2', 1, 24.0, 10, 80),
  ('5e550a01-0000-4000-8000-000000000a01', '7a000002-0000-4000-8000-0000000000a2', 2, 24.0, 9,  85);

-- ----------------------------------------------------------------------------
-- 9) Desafio do Rafael + participantes (ranking sai das sessões no período)
-- ----------------------------------------------------------------------------
insert into challenges (id, owner_professional_id, name, starts_on, ends_on, visibility, status) values
  ('9999c111-0000-4000-8000-0000000000c1', '33333333-3333-3333-3333-333333333333',
   'Desafio Consistência — 30 dias', current_date - 14, current_date + 14, 'public_among_participants', 'active');

insert into challenge_participants (challenge_id, student_id, status, responded_at) values
  ('9999c111-0000-4000-8000-0000000000c1', 'aaaaaaa1-0000-4000-8000-000000000001', 'active',  now() - interval '13 days'), -- João (líder)
  ('9999c111-0000-4000-8000-0000000000c1', 'aaaaaaa2-0000-4000-8000-000000000002', 'active',  now() - interval '12 days'), -- Marina
  ('9999c111-0000-4000-8000-0000000000c1', 'aaaaaaa4-0000-4000-8000-000000000004', 'active',  now() - interval '9 days'),  -- Bia
  ('9999c111-0000-4000-8000-0000000000c1', 'aaaaaaa5-0000-4000-8000-000000000005', 'invited', null);                        -- Lucas (convidado)

-- ----------------------------------------------------------------------------
-- 10) Convites em aberto (popula a tela "Convites" dos profissionais)
-- ----------------------------------------------------------------------------
insert into invites (id, professional_id, code, expires_at, max_uses, used_count) values
  ('b0000001-0000-4000-8000-0000000000b1', '33333333-3333-3333-3333-333333333333', 'RAFAEL10', now() + interval '14 days', 5, 0),
  ('b0000002-0000-4000-8000-0000000000b2', '55555555-5555-5555-5555-555555555555', 'NOVOPERS', now() + interval '7 days',  1, 0);

-- ----------------------------------------------------------------------------
-- 11) Agregados de gamificação (profiles.streak_*, total_workouts_completed).
--     ESTE banco de dev NÃO tem os triggers da migration de gamificação, então nada
--     recomputa sozinho — e o app lê esses campos direto de profiles. Computamos aqui:
--     sequência = maior corrida de dias consecutivos (gaps-and-islands) sobre as datas
--     de atividade (check-ins + sessões concluídas/parciais); a "atual" só conta se a
--     corrida termina hoje ou ontem. Total de treinos = sessões 'completed'.
-- ----------------------------------------------------------------------------
with act as (
  select distinct student_id, d::date as d from (
    select student_id, check_in_date as d from check_ins
    union all
    select student_id, scheduled_for_date as d from workout_sessions
      where status in ('completed', 'completed_partial')
  ) u
),
isl as (
  select student_id, d,
         (d - (row_number() over (partition by student_id order by d) * interval '1 day'))::date as grp
  from act
),
runs as (
  select student_id, count(*) as len, max(d) as run_end
  from isl group by student_id, grp
),
agg as (
  select r.student_id,
         max(r.len) as best,
         max(case when r.run_end >= current_date - 1 then r.len else 0 end) as cur,
         (select max(a.d) from act a where a.student_id = r.student_id) as last_d
  from runs r group by r.student_id
),
wc as (
  select student_id, count(*) as cnt from workout_sessions where status = 'completed' group by student_id
)
update profiles p set
  streak_best = coalesce(a.best, 0),
  streak_current = coalesce(a.cur, 0),
  last_activity_date = a.last_d,
  total_workouts_completed = coalesce(wc.cnt, 0)
from agg a
left join wc on wc.student_id = a.student_id
where p.id = a.student_id;

commit;

-- ----------------------------------------------------------------------------
-- Resumo do que foi semeado.
-- ----------------------------------------------------------------------------
select p.display_name as aluno, p.streak_current as seq, p.streak_best as recorde,
       p.total_workouts_completed as treinos
from profiles p
where p.tipo = 'aluno'
order by p.streak_current desc;
