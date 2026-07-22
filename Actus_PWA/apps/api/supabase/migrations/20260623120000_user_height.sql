-- Altura do aluno (cm). Usada pela Visão Geral do perfil (web Personal). Idempotente.
begin;

alter table public.user_basic_info
  add column if not exists height_cm numeric(5, 1);

comment on column public.user_basic_info.height_cm is
  'Altura em centímetros (ex.: 168.0). Nullable; editável pelo profissional vinculado.';

commit;
