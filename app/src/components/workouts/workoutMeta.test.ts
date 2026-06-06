import {
  aggregatedMuscleGroups,
  estMinutesFromCount,
  lastCompletedLabel,
  planValidityLabel,
} from './workoutMeta';
import { formatDateLocal } from '@/lib/format';

describe('workoutMeta', () => {
  describe('lastCompletedLabel', () => {
    it('null → "Ainda não feito"', () => {
      expect(lastCompletedLabel(null)).toBe('Ainda não feito');
    });
    it('hoje → "Feito hoje"', () => {
      expect(lastCompletedLabel(formatDateLocal(new Date()))).toBe('Feito hoje');
    });
    it('ontem → "Ontem"', () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      expect(lastCompletedLabel(formatDateLocal(d))).toBe('Ontem');
    });
    it('3 dias atrás → "Há 3 dias"', () => {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      expect(lastCompletedLabel(formatDateLocal(d))).toBe('Há 3 dias');
    });
  });

  describe('planValidityLabel', () => {
    it('null → null', () => {
      expect(planValidityLabel(null)).toBeNull();
    });
    it('data → "Plano até 30 jun"', () => {
      expect(planValidityLabel('2026-06-30')).toBe('Plano até 30 jun');
    });
  });

  describe('aggregatedMuscleGroups', () => {
    it('únicos na ordem de aparição, ignorando null', () => {
      const out = aggregatedMuscleGroups([
        { muscle_group: 'Peito' },
        { muscle_group: 'Tríceps' },
        { muscle_group: 'Peito' },
        { muscle_group: null },
      ]);
      expect(out).toBe('Peito · Tríceps');
    });
    it('lista vazia → ""', () => {
      expect(aggregatedMuscleGroups([])).toBe('');
    });
  });

  describe('estMinutesFromCount', () => {
    it('0 exercícios → 0', () => {
      expect(estMinutesFromCount(0)).toBe(0);
    });
    it('arredonda a múltiplos de 5 (>=5)', () => {
      expect(estMinutesFromCount(6)).toBe(35);
      expect(estMinutesFromCount(1)).toBe(5);
    });
  });
});
