import { z } from 'zod';

// [MOCK — sem endpoint na API v1] A API de dieta não expõe a "próxima refeição"
// com horário. Até existir, o card do HOJE usa este texto fixo.
export const NextMealMockSchema = z.object({ label: z.string(), time: z.string() });
export type NextMealMock = z.infer<typeof NextMealMockSchema>;

// [MOCK — sem endpoint na API v1]
export const nextMealMock: NextMealMock = NextMealMockSchema.parse({
  label: 'Próxima refeição',
  time: '12:30',
});
