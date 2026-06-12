-- ---------------------------------------------------------------------------
-- Tabela de exercícios físicos em PT-BR
-- Fonte: yuhonas/free-exercise-db (Unlicense) + joao-gugel/exercicios-bd-ptbr
-- Campos de enum mantidos em inglês (chave canônica estável); rótulos PT-BR
-- vivem em local/exercise-enum-map-pt.json para uso no frontend.
-- ---------------------------------------------------------------------------

create table if not exists public.exercises (
  id                 text        primary key,        -- slug do free-exercise-db, ex: "3_4_Sit-Up"
  name_pt            text        not null,
  name_en            text        not null,
  category           text,                           -- ex: "strength", "cardio"
  equipment          text,                           -- ex: "barbell", "body only"
  level              text,                           -- "beginner" | "intermediate" | "expert"
  mechanic           text,                           -- "compound" | "isolation" | null
  force              text,                           -- "push" | "pull" | "static" | null
  primary_muscles    text[]      not null default '{}',
  secondary_muscles  text[]      not null default '{}',
  instructions_pt    text[]      not null default '{}',
  image_0_url        text,
  image_1_url        text,
  created_at         timestamptz not null default now()
);

-- Índices úteis para busca e filtro
create index if not exists exercises_category_idx   on public.exercises (category);
create index if not exists exercises_equipment_idx  on public.exercises (equipment);
create index if not exists exercises_level_idx      on public.exercises (level);
create index if not exists exercises_muscles_gin_idx on public.exercises using gin (primary_muscles);

-- RLS: exercícios são leitura pública para qualquer usuário autenticado
alter table public.exercises enable row level security;

create policy exercises_select on public.exercises
  for select using (auth.role() = 'authenticated');
