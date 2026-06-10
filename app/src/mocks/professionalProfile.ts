// [MOCK — sem endpoint na API v1: perfil profissional do professor]
// PDF de onboarding: nome profissional + área de atuação (obrigatórios),
// CREF/experiência/cidade opcionais + forma de uso (intenção).
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { z } from 'zod';

export const AreaAtuacaoSchema = z.enum([
  'musculacao',
  'condicionamento',
  'emagrecimento',
  'hipertrofia',
  'reabilitacao',
  'funcional',
  'corrida',
  'outro',
]);
export const FormaUsoSchema = z.enum([
  'organizar',
  'prescrever',
  'acompanhar',
  'convidar',
  'testar',
]);

export const ProfessionalProfileSchema = z.object({
  nome_profissional: z.string().min(2).max(120).optional(),
  area: AreaAtuacaoSchema.optional(),
  cref: z.string().max(40).optional(),
  experiencia_anos: z.string().max(20).optional(),
  cidade_uf: z.string().max(80).optional(),
  forma_uso: FormaUsoSchema.optional(),
});
export type ProfessionalProfile = z.infer<typeof ProfessionalProfileSchema>;

const KEY = 'actus.mock.professionalProfile';
const isWeb = Platform.OS === 'web';

async function loadRaw(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function saveRaw(value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Mock.
  }
}

type ProfileMap = Record<string, ProfessionalProfile>;

interface ProfessionalProfileState {
  byUser: ProfileMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (userId: string, partial: ProfessionalProfile) => Promise<void>;
}

export const useProfessionalProfileMock = create<ProfessionalProfileState>((set, get) => ({
  byUser: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    let map: ProfileMap = {};
    try {
      const obj = JSON.parse((await loadRaw()) ?? '{}') as Record<string, unknown>;
      for (const [id, v] of Object.entries(obj)) {
        const parsed = ProfessionalProfileSchema.safeParse(v);
        if (parsed.success) map[id] = parsed.data;
      }
    } catch {
      map = {};
    }
    set({ byUser: map, hydrated: true });
  },
  save: async (userId, partial) => {
    // Hidrata antes de sobrescrever (ver nota em studentOnboarding.save).
    if (!get().hydrated) await get().hydrate();
    const merged = ProfessionalProfileSchema.parse({
      ...(get().byUser[userId] ?? {}),
      ...partial,
    });
    const next = { ...get().byUser, [userId]: merged };
    set({ byUser: next });
    await saveRaw(JSON.stringify(next));
  },
}));

export async function saveProfessionalProfile(
  userId: string,
  partial: ProfessionalProfile,
): Promise<void> {
  return useProfessionalProfileMock.getState().save(userId, partial);
}

// Hook: perfil de um professor, hidratando na primeira montagem.
export function useProfessionalProfile(
  userId: string | undefined,
): ProfessionalProfile | null {
  const byUser = useProfessionalProfileMock((s) => s.byUser);
  const hydrate = useProfessionalProfileMock((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return userId ? (byUser[userId] ?? null) : null;
}

export const AREA_LABEL: Record<z.infer<typeof AreaAtuacaoSchema>, string> = {
  musculacao: 'Musculação',
  condicionamento: 'Condicionamento físico',
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  reabilitacao: 'Reabilitação / retorno ao treino',
  funcional: 'Funcional',
  corrida: 'Corrida',
  outro: 'Outro',
};
export const FORMA_USO_LABEL: Record<z.infer<typeof FormaUsoSchema>, string> = {
  organizar: 'Organizar meus alunos',
  prescrever: 'Prescrever treinos',
  acompanhar: 'Acompanhar evolução',
  convidar: 'Convidar alunos',
  testar: 'Testar o app primeiro',
};
