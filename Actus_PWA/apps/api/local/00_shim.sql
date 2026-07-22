-- Shim de compatibilidade Supabase para rodar as migrations em Postgres puro (Docker local).
-- NÃO é uma migration de produção: no Supabase real esses objetos (schema auth, auth.users,
-- auth.uid(), roles) já existem. Aqui criamos o mínimo para a migration 1 aplicar; a migration 2
-- (custom auth) re-aponta a FK de profiles para app_users, dropa o trigger e desabilita RLS,
-- tornando o schema independente do Supabase a partir daí.

-- Extensão usada por `email citext` já na migration 1.
create extension if not exists citext;

-- Roles padrão do Supabase (a migration 1 referencia `to authenticated`; a 2 faz revoke de anon/authenticated).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

-- Schema auth + tabela mínima de usuários (alvo da FK e do trigger da migration 1).
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email citext,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- auth.uid(): no Supabase lê o sub do JWT. Localmente a autorização é no Node (API conecta como
-- owner e bypassa RLS), então retornar NULL é suficiente para as policies/RPCs serem criadas.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
