// src/types/parq.ts
// Contrato do Par-Q (questionário de prontidão). Este schema valida tanto o MOCK
// (src/mocks/parq.ts) quanto a futura resposta real da API — a forma já está contratada.
import { z } from 'zod';

// YYYY-MM-DD (data local, sem hora) — mesmo padrão usado em professional.ts.
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type ParqQuestionId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// As 7 perguntas oficiais do PAR-Q, em pt-BR (voz quiet luxury: direta, sem buzzword).
export const PARQ_QUESTIONS: readonly { id: ParqQuestionId; text: string }[] = [
  { id: 1, text: 'Algum médico já disse que você tem um problema no coração e que só deveria fazer atividade física sob supervisão médica?' },
  { id: 2, text: 'Você sente dor no peito quando faz atividade física?' },
  { id: 3, text: 'No último mês, você sentiu dor no peito sem estar fazendo atividade física?' },
  { id: 4, text: 'Você perde o equilíbrio por tontura, ou já chegou a perder a consciência?' },
  { id: 5, text: 'Você tem algum problema ósseo ou nas articulações que possa piorar com atividade física?' },
  { id: 6, text: 'Você toma algum remédio para pressão arterial ou para o coração?' },
  { id: 7, text: 'Há qualquer outra razão pela qual você não deveria fazer atividade física?' },
] as const;

// Uma resposta: true = "sim" (sinal de atenção médica).
export const ParqAnswerSchema = z.object({
  question_id: z.number().int().min(1).max(7),
  value: z.boolean(),
});
export type ParqAnswer = z.infer<typeof ParqAnswerSchema>;

// Submissão completa. any_yes/answered_at/valid_until são derivados no envio.
export const ParqSubmissionSchema = z.object({
  student_id: z.string(),
  // Exatamente uma resposta por pergunta (1..7) — o invariante vale também para o
  // dado reidratado do storage e para a futura resposta real da API.
  answers: z
    .array(ParqAnswerSchema)
    .length(7)
    .refine((a) => new Set(a.map((x) => x.question_id)).size === 7, {
      message: 'answers deve ter exatamente uma resposta por question_id (1..7)',
    }),
  any_yes: z.boolean(),
  answered_at: dateOnly,
  valid_until: dateOnly,
});
export type ParqSubmission = z.infer<typeof ParqSubmissionSchema>;

// Respostas da API real (validadas por parseApi).
// GET /me/par-q e GET /professional/students/:id/par-q → { par_q: <sub> | null }.
export const ParqGetResponseSchema = z.object({ par_q: ParqSubmissionSchema.nullable() });
export type ParqGetResponse = z.infer<typeof ParqGetResponseSchema>;

// POST /students/:id/par-q → { ok: true, par_q: <sub> }.
export const ParqPostResponseSchema = z.object({ ok: z.literal(true), par_q: ParqSubmissionSchema });
export type ParqPostResponse = z.infer<typeof ParqPostResponseSchema>;

// GET /professional/students/par-q → { par_q: <sub>[] } (status em massa p/ a lista).
export const ParqListResponseSchema = z.object({ par_q: z.array(ParqSubmissionSchema) });
export type ParqListResponse = z.infer<typeof ParqListResponseSchema>;
