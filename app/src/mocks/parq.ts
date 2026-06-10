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

// Falha de persistência NUNCA quebra o fluxo — vale para os DOIS branches: no web,
// o próprio acesso a localStorage lança SecurityError com storage bloqueado.
async function loadRaw(): Promise<string | null> {
  try {
    if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function saveRaw(value: string): Promise<void> {
  try {
    if (isWeb) {
      globalThis.localStorage?.setItem(KEY, value);
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Mock: melhor perder a persistência do que o envio do aluno.
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

// Promise in-flight do hydrate: evita dois loadRaw simultâneos e, pior, um hydrate
// tardio sobrescrevendo um submit já aplicado em memória com o snapshot velho do disco.
let hydrating: Promise<void> | null = null;

export const useParqMock = create<ParqMockState>((set, get) => ({
  byStudent: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    if (!hydrating) {
      hydrating = (async () => {
        const map = parseMap(await loadRaw());
        // Merge: o que já está em memória (submit antes do hydrate) vence o disco.
        set({ byStudent: { ...map, ...get().byStudent }, hydrated: true });
      })()
        .catch(() => {
          // Storage indisponível ≠ travar a UI: marca hidratado com o que há em
          // memória (o gate da Home espera `hydrated` — não pode esperar para sempre).
          set({ hydrated: true });
        })
        .finally(() => {
          hydrating = null;
        });
    }
    return hydrating;
  },
  submit: async (studentId, answers) => {
    // Garante o mapa do disco antes de gravar por cima — sem isso, um submit em
    // store frio (deep link/cold start direto em /par-q) salvaria um mapa de uma
    // entrada só, apagando submissões persistidas de outros alunos.
    await get().hydrate();
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

// Hook: o mapa já foi reidratado do storage? Use para não pintar estado default
// ("não respondido") antes de saber a verdade — ex.: CTA da Home.
export function useParqHydrated(): boolean {
  return useParqMock((s) => s.hydrated);
}
