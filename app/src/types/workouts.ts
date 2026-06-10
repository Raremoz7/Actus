import { z } from 'zod';

// TODO Bloco 4: schemas completos de treinos (templates, exercícios, séries, atribuição ao aluno).

// Dia da semana no padrão ISO-8601: 1 = segunda ... 7 = domingo.
export const WeekdaySchema = z.number().int().min(1).max(7);
export type Weekday = z.infer<typeof WeekdaySchema>;
