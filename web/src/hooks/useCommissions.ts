import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  CommissionEntriesResponseSchema,
  CommissionReportSchema,
  CommissionRulesResponseSchema,
} from '../lib/schemas';

// [ACTUS — academia] Hooks de comissão (painel do gestor). Regra (como calcular) ≠ base (quanto).
// Base é manual na Fase 1; o relatório (regra × base) é calculado no backend (services/commission.ts).

export type CommissionRuleType = 'percent' | 'fixed_per_student' | 'fixed_monthly';

export function useCommissionRules() {
  return useQuery({
    queryKey: ['commission-rules'] as const,
    queryFn: async () => {
      const r = await api.get('/academy/commissions/rules');
      return CommissionRulesResponseSchema.parse(r.data).rules;
    },
    staleTime: 30_000,
  });
}

export function useCommissionEntries(period: string) {
  return useQuery({
    queryKey: ['commission-entries', period] as const,
    queryFn: async () => {
      const r = await api.get('/academy/commissions/base', { params: { period } });
      return CommissionEntriesResponseSchema.parse(r.data).entries;
    },
    staleTime: 30_000,
  });
}

export function useCommissionReport(period: string) {
  return useQuery({
    queryKey: ['commission-report', period] as const,
    queryFn: async () => {
      const r = await api.get('/academy/commissions/report', { params: { period } });
      return CommissionReportSchema.parse(r.data);
    },
    staleTime: 30_000,
  });
}

function invalidateCommissions(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['commission-rules'] });
  void qc.invalidateQueries({ queryKey: ['commission-entries'] });
  void qc.invalidateQueries({ queryKey: ['commission-report'] });
}

export type SetRuleBody = {
  instructor_user_id: string | null;
  rule_type: CommissionRuleType;
  percent?: number | null;
  amount_cents?: number | null;
};

export function useSetCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: SetRuleBody) => {
      const r = await api.post('/academy/commissions/rules', body);
      return r.data;
    },
    onSuccess: () => invalidateCommissions(qc),
  });
}

export type CreateEntryBody = {
  instructor_user_id: string;
  period: string;
  amount_cents: number;
  subject_type?: 'student' | 'instructor' | 'academy';
  note?: string;
};

export function useCreateCommissionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateEntryBody) => {
      const r = await api.post('/academy/commissions/base', body);
      return r.data;
    },
    onSuccess: () => invalidateCommissions(qc),
  });
}

export function useDeleteCommissionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const r = await api.delete(`/academy/commissions/base/${entryId}`);
      return r.data;
    },
    onSuccess: () => invalidateCommissions(qc),
  });
}

export function useSetPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      instructor_user_id: string;
      period: string;
      status: 'pending' | 'paid';
      amount_cents?: number;
    }) => {
      const r = await api.post('/academy/commissions/payouts', body);
      return r.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['commission-report'] }),
  });
}
