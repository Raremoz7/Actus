# Seed manual — usuários internos (Actus Admin / Suporte)

Este procedimento cria **dois logins internos** com papéis `actus_admin` e `actus_suporte`. As permissões de API vêm de `public.app_user_roles`; o JWT de acesso inclui esses valores em `roles`.

## 1) Gerar `password_hash` (bcrypt, 12 rounds)

No diretório `api/` (onde está o `bcryptjs`):

```bash
node -e "const b=require('bcryptjs'); const p=process.argv[1]||''; if(!p) throw new Error('usage: node ... <senha>'); b.hash(p,12).then(h=>console.log(h))" 'SuaSenhaInicialSegura'
```

Copie o hash impresso para usar nos `INSERT` abaixo.

## 2) SQL (rodar no Postgres do projeto)

Substitua os hashes e e-mails. Os `id` podem ser fixos (como abaixo) ou `gen_random_uuid()` se preferir.

```sql
begin;

insert into public.app_users (id, email, password_hash, must_change_password)
values
  ('11111111-1111-1111-1111-111111111111', 'actus@admin.com', 'actus.admin@123', true),
  ('22222222-2222-2222-2222-222222222222', 'actus@suporte.com', 'actus.suporte@456', true);

-- Perfil coerente com o papel interno (enum estendido em migration)
insert into public.profiles (id, display_name, tipo)
values
  ('11111111-1111-1111-1111-111111111111', 'Actus Admin', 'actus_admin'::public.user_role),
  ('22222222-2222-2222-2222-222222222222', 'Actus Suporte', 'actus_suporte'::public.user_role);

insert into public.app_user_roles (user_id, role)
values
  ('11111111-1111-1111-1111-111111111111', 'actus_admin'),
  ('22222222-2222-2222-2222-222222222222', 'actus_suporte');

commit;
```

## 3) Primeiro login

Com `must_change_password = true`, o usuário recebe tokens, mas rotas protegidas respondem `403` com `must_change_password` até chamar `POST /auth/change-password` com a senha atual e a nova.
