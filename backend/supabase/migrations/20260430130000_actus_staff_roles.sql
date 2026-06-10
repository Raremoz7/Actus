-- Actus: papéis internos (admin/suporte) + flag de troca de senha obrigatória.

begin;

-- Estende enum de perfil para incluir staff interno (sem misturar com product-role checks que filtram por personal/nutri/aluno)
do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    begin
      alter type public.user_role add value 'actus_admin';
    exception
      when duplicate_object then null;
    end;
    begin
      alter type public.user_role add value 'actus_suporte';
    exception
      when duplicate_object then null;
    end;
  end if;
end$$;

alter table public.app_users
  add column if not exists must_change_password boolean not null default false;

create table if not exists public.app_user_roles (
  user_id uuid not null references public.app_users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.app_users (id),
  constraint app_user_roles_role_allowed check (role in ('actus_admin', 'actus_suporte')),
  primary key (user_id, role)
);

create index if not exists app_user_roles_role_idx on public.app_user_roles (role);

commit;
