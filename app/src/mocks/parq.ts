// src/mocks/parq.ts
// [MOCK — sem endpoint na API v1: POST/GET /students/:id/par-q]
// Persistência local (SecureStore, com fallback web) para o envio do aluno sobreviver
// ao reload no dev build. Migração futura: trocar este store por useQuery + parseApi
// sobre o mesmo ParqSubmissionSchema — sem refatorar nenhuma tela (ver src/mocks/README.md).
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { buildSubmission } from '@/lib/parq';
import { ParqSubmissionSchema, type ParqAnswer, type ParqSubmission } from '@/types/parq';

const KEY = 'actus.mock.parq';
const isWeb = Platform.OS === 'web';

type ParqMap = Record<string, ParqSubmission>;

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
    // Mock: falha de persistência não pode quebrar o fluxo.
  }
}

// Valida cada item ao reidratar — dado corrompido é descartado, não propaga.
function parseMap(raw: string | null): ParqMap {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: ParqMap = {};
    for (const [id, v] of Object.entries(obj)) {
      const parsed = ParqSubmissionSchema.safeParse(v);
      if (parsed.success) out[id] = parsed.data;
    }
    return out;
  } catch {
    return {};
  }
}

interface ParqMockState {
  byStudent: ParqMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  submit: (studentId: string, answers: ParqAnswer[]) => Promise<ParqSubmission>;
}

export const useParqMock = create<ParqMockState>((set, get) => ({
  byStudent: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const map = parseMap(await loadRaw());
    set({ byStudent: map, hydrated: true });
  },
  submit: async (studentId, answers) => {
    const sub = buildSubmission(studentId, answers, new Date());
    const next = { ...get().byStudent, [studentId]: sub };
    set({ byStudent: next });
    await saveRaw(JSON.stringify(next));
    return sub;
  },
}));

// Atalho imperativo (telas/serviços que não são componentes).
export async function submitParq(
  studentId: string,
  answers: ParqAnswer[],
): Promise<ParqSubmission> {
  return useParqMock.getState().submit(studentId, answers);
}

// Hook: mapa completo, hidratando na primeira montagem (idempotente).
export function useParqMap(): ParqMap {
  const byStudent = useParqMock((s) => s.byStudent);
  const hydrate = useParqMock((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return byStudent;
}

// Hook: submissão de um aluno específico (ou null).
export function useParqSubmission(studentId: string | undefined): ParqSubmission | null {
  const map = useParqMap();
  return studentId ? (map[studentId] ?? null) : null;
}
