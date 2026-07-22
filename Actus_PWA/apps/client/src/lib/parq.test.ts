// src/lib/parq.test.ts
import { deriveAnyYes, computeValidUntil, buildSubmission, parqStatus } from './parq';
import type { ParqAnswer } from '@/types/parq';

// Helper: 7 respostas "não", trocando algumas para "sim".
function answers(yesIds: number[] = []): ParqAnswer[] {
  return [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: yesIds.includes(id) }));
}

describe('deriveAnyYes', () => {
  it('false quando todas são não', () => {
    expect(deriveAnyYes(answers())).toBe(false);
  });
  it('true quando há ao menos um sim', () => {
    expect(deriveAnyYes(answers([3]))).toBe(true);
  });
});

describe('computeValidUntil', () => {
  it('soma 12 meses usando componentes LOCAIS (sem bug de fuso)', () => {
    const d = new Date(2026, 0, 1, 0, 0, 0); // 01/01/2026 local
    expect(computeValidUntil(d)).toBe('2027-01-01');
  });
});

describe('buildSubmission', () => {
  it('monta a submissão com derivações corretas', () => {
    const today = new Date(2026, 5, 9); // 09/06/2026
    const sub = buildSubmission('aluno-1', answers([2]), today);
    expect(sub.student_id).toBe('aluno-1');
    expect(sub.any_yes).toBe(true);
    expect(sub.answered_at).toBe('2026-06-09');
    expect(sub.valid_until).toBe('2027-06-09');
    expect(sub.answers).toHaveLength(7);
  });
});

describe('parqStatus', () => {
  const today = new Date(2026, 5, 9);
  it('not_started quando não há submissão', () => {
    expect(parqStatus(null, today)).toBe('not_started');
  });
  it('clear quando respondido sem sim e dentro da validade', () => {
    expect(parqStatus(buildSubmission('a', answers(), today), today)).toBe('clear');
  });
  it('attention quando há sim', () => {
    expect(parqStatus(buildSubmission('a', answers([1]), today), today)).toBe('attention');
  });
  it('expired quando passou da validade', () => {
    const old = buildSubmission('a', answers(), new Date(2024, 0, 1));
    expect(parqStatus(old, today)).toBe('expired');
  });
});
