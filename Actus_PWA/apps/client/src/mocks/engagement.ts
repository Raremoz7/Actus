// [MOCK — sem endpoint na API v1: visão agregada de engajamento]
// O painel "Engajamento" do dashboard pediria GET /professional/overview
// (adesão, check-ins recentes, inatividade). Até existir, derivamos métricas
// DETERMINÍSTICAS a partir da lista real de alunos (hash do uuid) — assim o
// bloco reage aos alunos de verdade e é estável entre renders, sem inventar
// números aleatórios. Trocar por dados reais quando o endpoint chegar.
import { z } from 'zod';

import type { Student } from '@/types/professional';

export const RecentCheckInSchema = z.object({
  student_id: z.string(),
  name: z.string(),
  // Dias desde o último check-in (0 = hoje).
  days_ago: z.number().int().nonnegative(),
});
export type RecentCheckIn = z.infer<typeof RecentCheckInSchema>;

export const EngagementOverviewSchema = z.object({
  // % de alunos com pelo menos 1 check-in nos últimos 7 dias.
  adherence_pct: z.number().int().min(0).max(100),
  // Total de check-ins na semana (proxy: 1 por aluno ativo).
  checkins_7d: z.number().int().nonnegative(),
  // Alunos sem check-in há mais de 14 dias.
  inactive_count: z.number().int().nonnegative(),
  // Até 3 check-ins mais recentes para a lista.
  recent: z.array(RecentCheckInSchema),
});
export type EngagementOverview = z.infer<typeof EngagementOverviewSchema>;

// Hash estável (FNV-1a simplificado) → mesmo aluno sempre cai no mesmo "perfil".
function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function firstName(s: Student): string {
  const full = (s.full_name?.trim() || s.email.split('@')[0]) ?? s.email;
  return full.split(/\s+/)[0] ?? full;
}

// Deriva a visão de engajamento a partir dos alunos. Sem alunos → tudo zerado.
export function buildEngagementOverview(students: Student[]): EngagementOverview {
  if (students.length === 0) {
    return EngagementOverviewSchema.parse({
      adherence_pct: 0,
      checkins_7d: 0,
      inactive_count: 0,
      recent: [],
    });
  }

  // days_ago no intervalo 0..29, determinístico por aluno.
  const withDays = students.map((s) => ({
    student_id: s.id,
    name: firstName(s),
    days_ago: hashId(s.id) % 30,
  }));

  const active7d = withDays.filter((s) => s.days_ago <= 7);
  const inactive = withDays.filter((s) => s.days_ago > 14);
  const adherence_pct = Math.round((active7d.length / students.length) * 100);

  const recent = [...active7d]
    .sort((a, b) => a.days_ago - b.days_ago)
    .slice(0, 3);

  return EngagementOverviewSchema.parse({
    adherence_pct,
    checkins_7d: active7d.length,
    inactive_count: inactive.length,
    recent,
  });
}

// Rótulo relativo curto para o check-in ("hoje", "ontem", "há 3 dias").
export function checkInAgoLabel(daysAgo: number): string {
  if (daysAgo <= 0) return 'hoje';
  if (daysAgo === 1) return 'ontem';
  return `há ${daysAgo} dias`;
}
