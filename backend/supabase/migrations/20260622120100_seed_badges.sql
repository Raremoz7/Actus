-- Catálogo dos 7 badges da V1. Idempotente.
begin;

insert into public.badges (id, name, description, criteria_type, criteria_threshold, asset_key, sort_order, active) values
  ('first_step',      'Primeiro Passo',  'Concluiu o primeiro treino.',          'workout_count',   1,    'badge_first_step',      1, true),
  ('committed_5',     'Comprometido',    'Concluiu 5 treinos.',                  'workout_count',   5,    'badge_committed',       2, true),
  ('consistent_10',   'Consistente',     'Concluiu 10 treinos.',                 'workout_count',   10,   'badge_consistent',      3, true),
  ('dedicated_30',    'Dedicado',        'Concluiu 30 treinos.',                 'workout_count',   30,   'badge_dedicated',       4, true),
  ('personal_record', 'Recorde Pessoal', 'Bateu o primeiro recorde de carga.',   'personal_record', null, 'badge_personal_record', 5, true),
  ('fire_streak_7',   'Sequência de Fogo','Manteve 7 dias seguidos de treino.',  'streak',          7,    'badge_fire_streak',     6, true),
  ('legendary_30',    'Lendário',        'Manteve 30 dias seguidos de treino.', 'streak',          30,   'badge_legendary',       7, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  criteria_type = excluded.criteria_type,
  criteria_threshold = excluded.criteria_threshold,
  asset_key = excluded.asset_key,
  sort_order = excluded.sort_order,
  active = excluded.active;

commit;
