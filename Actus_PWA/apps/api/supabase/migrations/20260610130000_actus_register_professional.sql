-- [ACTUS — NOVO vs produção: suporte ao auto-cadastro de profissional (POST
-- /auth/register-professional). Ver backend/CHANGES-FROM-PRODUCTION.md]
--
-- O profissional se cadastra com telefone, mas não preenche user_basic_info (tabela
-- student-shaped, com birth_date NOT NULL). Guardamos o phone direto no profile.
-- Aditivo e idempotente; não afeta alunos.

begin;

alter table public.profiles add column if not exists phone text;

commit;
