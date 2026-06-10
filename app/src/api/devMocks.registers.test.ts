// Garante que os mocks de register respondem no MESMO shape que o app valida
// (TokensResponseSchema) — se o contrato mudar, este teste quebra antes da UI.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

import { TokensResponseSchema } from '@/types/auth';
import { __testables } from './devMocks';

describe('devMocks registers', () => {
  it('mockRegisterTokens casa com TokensResponseSchema', () => {
    expect(TokensResponseSchema.safeParse(__testables.mockRegisterTokens('x')).success).toBe(
      true,
    );
  });
});
