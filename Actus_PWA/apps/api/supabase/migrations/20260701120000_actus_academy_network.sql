-- Actus: Rede de academias (filiais/franquias). Complemento da TEC-53 — pedido do Matheus
-- (Incluir uma visualização por Filiais e Franquias). Cada filial/franquia continua sendo uma
-- `academies` row independente (próprio gestor/equipe/alunos); o vínculo de rede é só um campo a
-- mais. Sem impacto no dashboard individual existente.

begin;

create type public.academy_network_role as enum ('standalone', 'network_hq', 'unit');

alter table public.academies
  add column if not exists network_role public.academy_network_role not null default 'standalone',
  add column if not exists parent_academy_id uuid references public.academies (id);

alter table public.academies
  add constraint academies_network_role_parent_consistency check (
    (network_role = 'unit' and parent_academy_id is not null) or
    (network_role != 'unit' and parent_academy_id is null)
  );

create index if not exists academies_parent_academy_id_idx on public.academies (parent_academy_id);

commit;
