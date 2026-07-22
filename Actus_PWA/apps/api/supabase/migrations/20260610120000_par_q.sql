-- [ACTUS-NEW] Par-Q (questionário de prontidão para atividade física).
-- Uma resposta corrente por aluno (PK = student_id; POST faz upsert). Autorização via
-- backend (sem RLS, padrão do projeto). Ver backend/docs/CHANGES-actus.md (B5) e
-- app/docs/backend-pendencias.md (B5).

begin;

create table public.par_q_responses (
  student_id   uuid primary key references public.profiles (id) on delete cascade,
  answers      jsonb not null,          -- [{ "question_id": 1..7, "value": boolean }] (7 itens)
  any_yes      boolean not null,        -- derivado: true se qualquer resposta for "sim"
  answered_at  date not null,           -- carimbado pelo servidor (current_date)
  valid_until  date not null,           -- answered_at + 12 meses (PAR-Q expira)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint par_q_answers_is_array check (jsonb_typeof(answers) = 'array')
);

commit;
