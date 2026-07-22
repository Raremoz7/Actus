# Mocks — dados sem endpoint real

Este diretório concentra **todo dado que ainda não tem endpoint na API v1**. A regra
existe para que a UI nunca dependa de objetos inventados espalhados pelas telas: quando
o backend expuser a rota real, basta trocar a fonte aqui — sem refatorar componente algum.

## Convenção

1. **Marque a origem.** Toda constante/factory de mock leva o comentário:

   ```ts
   // [MOCK — sem endpoint na API v1]
   ```

   Um grep por `[MOCK — sem endpoint na API v1]` lista exatamente o que falta no backend.

2. **Schema Zod próprio.** Cada mock define (ou reaproveita de `@/types`) um schema Zod e
   exporta o tipo inferido. O mock é validado pelo mesmo schema que validará a resposta
   real, então a forma dos dados já está "contratada":

   ```ts
   import { z } from 'zod';

   // [MOCK — sem endpoint na API v1]
   export const StreakMockSchema = z.object({
     current_days: z.number().int().nonnegative(),
     best_days: z.number().int().nonnegative(),
   });
   export type StreakMock = z.infer<typeof StreakMockSchema>;

   // [MOCK — sem endpoint na API v1]
   export const streakMock: StreakMock = StreakMockSchema.parse({
     current_days: 7,
     best_days: 21,
   });
   ```

3. **Telas consomem só o tipo.** Componentes importam o **tipo** e o dado mockado pelo
   alias `@/mocks/...`. Como a forma vem do schema Zod, a migração para a API real é:
   substituir o `export const xMock` por um `useQuery` que faz `parseApi(XSchema, data)`.
   O tipo consumido pela tela não muda → zero refator de UI.

## O que NÃO vai aqui

- Dados que já têm endpoint real → use `@/api` + React Query.
- Fixtures de teste → ficam junto dos testes, não neste diretório de runtime.
