-- [ACTUS-NEW] Perfil profissional self-service (onboarding do professor).
-- A produção só permitia editar dados profissionais via staff (/admin/professionals).
-- O onboarding do professor (TEC-8) coleta área de atuação principal, tempo de
-- experiência, Cidade/UF e a intenção de uso ("o que quer fazer primeiro") — campos
-- que não tinham coluna própria em professional_info. Aqui adicionamos colunas planas
-- (text) para o profissional gravar isso no próprio perfil via PATCH /me/professional-profile.
-- Mantém-se text livre (não enum no banco) para o app evoluir as opções sem migration.
-- Ver backend/CHANGES-FROM-PRODUCTION.md.

alter table public.professional_info
  add column if not exists primary_area text,
  add column if not exists experience text,
  add column if not exists city_uf text,
  add column if not exists onboarding_intent text;
