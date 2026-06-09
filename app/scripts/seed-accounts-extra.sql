-- ============================================================================
-- [DEV] Seed de contas extras (cenário "Diego/Julio") — reproduz no banco local as
-- contas/vínculos/convites fornecidos. IDEMPOTENTE: apaga por IDs e recria.
--
-- Senhas (hash bcrypt 12):
--   12345678               → Diego, Nikollas, Cris, Nogs, Godoy, Julio
--   ChangedMeSuporte#2026  → actus@suporte.com
--
-- SUPOSIÇÃO (corrigir se preciso): Nogs e Godoy vieram no formato de ALUNO
-- (id/email/full_name/professional_role/linked_at = shape de Student), mas o dump NÃO
-- disse a QUEM estão vinculados. Aqui estão como alunos do **Diego**. Se forem de outro
-- profissional (ou se forem personais de verdade), me avise que eu ajusto.
--
-- Rodar (PowerShell):
--   Get-Content scripts/seed-accounts-extra.sql -Raw | docker exec -i actutus_fit_backend-main-db-1 psql -U actus -d actus
-- NUNCA usar em produção.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0) Limpeza idempotente (cascatas removem vínculos, convites, redemptions, etc.).
--    NÃO apagamos o suporte (id 2222…) — ele é upsert.
-- ----------------------------------------------------------------------------
delete from app_users where id in (
  'd1e90d1e-0000-4000-8000-000000000001', -- Diego
  '13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e', -- Julio
  '4374a5c9-50dd-4a17-b8e5-a05d23d982d5', -- Nogs / Mateus
  '2112276d-efca-441d-af19-458e6eb07d67', -- Godoy
  'c0c0c0c0-0000-4000-8000-000000000001', -- Nikollas
  'c0c0c0c0-0000-4000-8000-000000000002'  -- Cris
);
delete from invites where id in (
  'e58d9382-3a67-452e-9a81-50dce21118b4', -- convite Diego
  '5083602a-1ba6-4163-b6aa-482a5c364b54'  -- convite Julio
);

-- ----------------------------------------------------------------------------
-- 1) Suporte (actus_suporte) — upsert (não recria a conta; ajusta senha/role).
-- ----------------------------------------------------------------------------
insert into app_users (id, email, password_hash, must_change_password) values
  ('22222222-2222-2222-2222-222222222222', 'actus@suporte.com',
   '$2b$12$Kv1hz7Yp.fsPiPUH254b/uiDSOQ3TINpfVf2PgY7mjoTWnmzt5udu', false)
on conflict (id) do update
  set email = excluded.email,
      password_hash = excluded.password_hash,
      must_change_password = excluded.must_change_password;

insert into profiles (id, tipo, display_name) values
  ('22222222-2222-2222-2222-222222222222', 'actus_suporte', 'Actus Suporte')
on conflict (id) do nothing;

insert into app_user_roles (user_id, role) values
  ('22222222-2222-2222-2222-222222222222', 'actus_suporte')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 2) Contas (app_users) — senha 12345678 para todas.
-- ----------------------------------------------------------------------------
insert into app_users (id, email, password_hash, must_change_password) values
  ('d1e90d1e-0000-4000-8000-000000000001', 'actus@diego.com',       '$2b$12$iDzeGkkh7/UFenxWEh/f2uwcCC4GQ1yMptXyBt8.6S/X7EH.wOtSC', false),
  ('13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e', 'julio.poderoso@actus.com','$2b$12$iDzeGkkh7/UFenxWEh/f2uwcCC4GQ1yMptXyBt8.6S/X7EH.wOtSC', false),
  ('4374a5c9-50dd-4a17-b8e5-a05d23d982d5', 'user@mateus.com',        '$2b$12$iDzeGkkh7/UFenxWEh/f2uwcCC4GQ1yMptXyBt8.6S/X7EH.wOtSC', false),
  ('2112276d-efca-441d-af19-458e6eb07d67', 'godoy.gordin@actus.com', '$2b$12$iDzeGkkh7/UFenxWEh/f2uwcCC4GQ1yMptXyBt8.6S/X7EH.wOtSC', false),
  ('c0c0c0c0-0000-4000-8000-000000000001', 'coriga@actus.com',       '$2b$12$iDzeGkkh7/UFenxWEh/f2uwcCC4GQ1yMptXyBt8.6S/X7EH.wOtSC', false),
  ('c0c0c0c0-0000-4000-8000-000000000002', 'cris@testejulio.com',    '$2b$12$iDzeGkkh7/UFenxWEh/f2uwcCC4GQ1yMptXyBt8.6S/X7EH.wOtSC', false);

-- ----------------------------------------------------------------------------
-- 3) Perfis — Diego/Julio = personal; Nogs/Godoy/Nikollas/Cris = aluno.
-- ----------------------------------------------------------------------------
insert into profiles (id, tipo, display_name) values
  ('d1e90d1e-0000-4000-8000-000000000001', 'personal', 'Diegão da quebrada'),
  ('13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e', 'personal', 'Julio Poderoso'),
  ('4374a5c9-50dd-4a17-b8e5-a05d23d982d5', 'aluno',    'Mateusao nogs dogs'),
  ('2112276d-efca-441d-af19-458e6eb07d67', 'aluno',    'Godoy manlandrão'),
  ('c0c0c0c0-0000-4000-8000-000000000001', 'aluno',    'Nikolinhos Coringa Master'),
  ('c0c0c0c0-0000-4000-8000-000000000002', 'aluno',    'Cris');

-- ----------------------------------------------------------------------------
-- 4) Dados básicos (full_name, birth_date; Diego com cpf/phone/gender).
-- ----------------------------------------------------------------------------
insert into user_basic_info (user_id, full_name, birth_date, gender, cpf_normalized, cpf_last4, phone) values
  ('d1e90d1e-0000-4000-8000-000000000001', 'Diegão da quebrada',        '1990-01-30', 'masculino', '06901346140', '6140', '61996094656'),
  ('13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e', 'Julio Poderoso',            '1990-01-30', 'nao_informar', null, null, null),
  ('4374a5c9-50dd-4a17-b8e5-a05d23d982d5', 'Mateusao nogs dogs',        '1990-01-30', 'nao_informar', null, null, null),
  ('2112276d-efca-441d-af19-458e6eb07d67', 'Godoy manlandrão',          '1990-01-30', 'nao_informar', null, null, null),
  ('c0c0c0c0-0000-4000-8000-000000000001', 'Nikolinhos Coringa Master', '1990-01-30', 'masculino', null, null, null),
  ('c0c0c0c0-0000-4000-8000-000000000002', 'Cris',                      '1990-01-30', 'masculino', null, null, null);

-- ----------------------------------------------------------------------------
-- 5) professional_info dos personais (mínimo).
-- ----------------------------------------------------------------------------
insert into professional_info (user_id, bio) values
  ('d1e90d1e-0000-4000-8000-000000000001', 'Personal da quebrada.'),
  ('13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e', 'Personal poderoso.')
on conflict (user_id) do update set bio = excluded.bio;

-- ----------------------------------------------------------------------------
-- 6) Convites (códigos reais; used_count=1 = o aluno que entrou por ele).
-- ----------------------------------------------------------------------------
insert into invites (id, professional_id, code, expires_at, max_uses, used_count) values
  ('e58d9382-3a67-452e-9a81-50dce21118b4', 'd1e90d1e-0000-4000-8000-000000000001', 'HUlPl4CgWSqr', now() + interval '30 days', 5, 1),
  ('5083602a-1ba6-4163-b6aa-482a5c364b54', '13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e', '6wCMm9VnXb9-', now() + interval '30 days', 5, 1);

-- ----------------------------------------------------------------------------
-- 7) Vínculos aluno → personal.
--    Nikollas/Nogs/Godoy → Diego · Cris → Julio. (Nogs/Godoy = suposição; ver topo.)
-- ----------------------------------------------------------------------------
insert into student_professional_links (student_id, professional_id, professional_role, status, linked_at) values
  ('c0c0c0c0-0000-4000-8000-000000000001', 'd1e90d1e-0000-4000-8000-000000000001', 'personal', 'active', now()),
  ('4374a5c9-50dd-4a17-b8e5-a05d23d982d5', 'd1e90d1e-0000-4000-8000-000000000001', 'personal', 'active', '2026-04-30T14:24:46.532Z'),
  ('2112276d-efca-441d-af19-458e6eb07d67', 'd1e90d1e-0000-4000-8000-000000000001', 'personal', 'active', '2026-05-03T23:58:12.275Z'),
  ('c0c0c0c0-0000-4000-8000-000000000002', '13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e', 'personal', 'active', now());

-- ----------------------------------------------------------------------------
-- 8) Redemptions (quem usou qual convite).
-- ----------------------------------------------------------------------------
insert into invite_redemptions (id, invite_id, redeemed_user_id) values
  (gen_random_uuid(), 'e58d9382-3a67-452e-9a81-50dce21118b4', 'c0c0c0c0-0000-4000-8000-000000000001'), -- Nikollas ← convite Diego
  (gen_random_uuid(), '5083602a-1ba6-4163-b6aa-482a5c364b54', 'c0c0c0c0-0000-4000-8000-000000000002')  -- Cris ← convite Julio
on conflict (invite_id, redeemed_user_id) do nothing;

-- ----------------------------------------------------------------------------
-- 9) Consentimentos LGPD informados.
-- ----------------------------------------------------------------------------
insert into user_lgpd_consents (id, user_id, policy_version, source) values
  (gen_random_uuid(), 'd1e90d1e-0000-4000-8000-000000000001', '2',  'api'),
  (gen_random_uuid(), 'c0c0c0c0-0000-4000-8000-000000000001', 'v1', 'api'),
  (gen_random_uuid(), 'c0c0c0c0-0000-4000-8000-000000000002', 'v1', 'api');

commit;

-- Resumo.
select pr.tipo, pr.display_name, u.email
from profiles pr join app_users u on u.id = pr.id
where u.id in (
  'd1e90d1e-0000-4000-8000-000000000001','13966ef0-3fb5-40d2-9d7b-6cbbab6d5d2e',
  '4374a5c9-50dd-4a17-b8e5-a05d23d982d5','2112276d-efca-441d-af19-458e6eb07d67',
  'c0c0c0c0-0000-4000-8000-000000000001','c0c0c0c0-0000-4000-8000-000000000002'
)
order by pr.tipo, u.email;
