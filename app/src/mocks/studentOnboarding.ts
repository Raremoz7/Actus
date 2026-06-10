// [MOCK — sem endpoint na API v1: preferências de treino do aluno]
// História de onboarding: interesse, experiência, dias/semana, local, altura e o
// status do vínculo escolhido. Peso NÃO entra aqui (vai REAL via PATCH /me).
// Mesmo padrão do src/mocks/parq.ts: schema Zod + persistência local por aluno.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { z } from 'zod';

export const InteresseSchema = z.enum([
  'hipertrofia',
  'emagrecimento',
  'condicionamento',
  'resistencia',
  'adaptacao',
]);
export const ExperienciaSchema = z.enum(['comecando', 'as_vezes', 'frequente']);
export const DiasSemanaSchema = z.enum(['1', '2', '3', '4', '5+']);
export const LocalTreinoSchema = z.enum(['academia', 'casa', 'condominio', 'ar_livre']);
export const LinkStatusSchema = z.enum(['invited', 'linked', 'none']);

export const StudentAnswersSchema = z.object({
  interesse: InteresseSchema.optional(),
  experiencia: ExperienciaSchema.optional(),
  dias_semana: DiasSemanaSchema.optional(),
  local: LocalTreinoSchema.optional(),
  altura_cm: z.number().int().min(100).max(250).optional(),
  link_status: LinkStatusSchema.optional(),
});
export type StudentAnswers = z.infer<typeof StudentAnswersSchema>;

const KEY = 'actus.mock.studentOnboarding';
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
    // Mock: não pode quebrar o fluxo.
  }
}

type AnswersMap = Record<string, StudentAnswers>;

function parseMap(raw: string | null): AnswersMap {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: AnswersMap = {};
    for (const [id, v] of Object.entries(obj)) {
      const parsed = StudentAnswersSchema.safeParse(v);
      if (parsed.success) out[id] = parsed.data;
    }
    return out;
  } catch {
    return {};
  }
}

interface StudentOnboardingState {
  byStudent: AnswersMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (studentId: string, partial: StudentAnswers) => Promise<void>;
}

export const useStudentOnboardingMock = create<StudentOnboardingState>((set, get) => ({
  byStudent: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ byStudent: parseMap(await loadRaw()), hydrated: true });
  },
  save: async (studentId, partial) => {
    // Hidrata antes de sobrescrever — senão o 1º save de uma sessão nova zeraria
    // respostas já persistidas (o blob inteiro é regravado).
    if (!get().hydrated) await get().hydrate();
    const current = get().byStudent[studentId] ?? {};
    const merged = StudentAnswersSchema.parse({ ...current, ...partial });
    const next = { ...get().byStudent, [studentId]: merged };
    set({ byStudent: next });
    await saveRaw(JSON.stringify(next));
  },
}));

export async function saveStudentAnswers(
  studentId: string,
  partial: StudentAnswers,
): Promise<void> {
  return useStudentOnboardingMock.getState().save(studentId, partial);
}

// Hook: respostas de um aluno, hidratando na primeira montagem.
export function useStudentAnswers(studentId: string | undefined): StudentAnswers | null {
  const byStudent = useStudentOnboardingMock((s) => s.byStudent);
  const hydrate = useStudentOnboardingMock((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return studentId ? (byStudent[studentId] ?? null) : null;
}

// Rótulos pt-BR (uma fonte para telas do aluno e seção do personal).
export const INTERESSE_LABEL: Record<z.infer<typeof InteresseSchema>, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento físico geral',
  resistencia: 'Resistência muscular',
  adaptacao: 'Adaptação neuromotora',
};
export const EXPERIENCIA_LABEL: Record<z.infer<typeof ExperienciaSchema>, string> = {
  comecando: 'Estou começando',
  as_vezes: 'Já treino às vezes',
  frequente: 'Treino com frequência',
};
export const LOCAL_LABEL: Record<z.infer<typeof LocalTreinoSchema>, string> = {
  academia: 'Academia',
  casa: 'Casa',
  condominio: 'Condomínio',
  ar_livre: 'Ar livre',
};
