import { pickNextWorkout } from './nextWorkout';
import type { StudentWorkout } from '@/types/workouts';

function mk(over: Partial<StudentWorkout>): StudentWorkout {
  return {
    id: over.id ?? 'a',
    student_id: 's',
    workout_id: 'w',
    weekdays: over.weekdays ?? [1],
    start_date: '2026-06-01',
    end_date: null,
    display_order: over.display_order ?? 0,
    is_active: over.is_active ?? true,
    created_at: '2026-06-01T00:00:00Z',
    workout_name: over.workout_name ?? 'T',
    workout_notes: null,
    exercise_count: 0,
    last_completed_date: null,
  } as StudentWorkout;
}

describe('pickNextWorkout', () => {
  it('elege treino de hoje quando há match (isToday)', () => {
    const a = mk({ id: 'a', weekdays: [3], workout_name: 'A' });
    const r = pickNextWorkout([a], 3);
    expect(r.next?.id).toBe('a');
    expect(r.isToday).toBe(true);
    expect(r.rest).toHaveLength(0);
  });

  it('sem hoje, escolhe o próximo à frente (circular)', () => {
    const b = mk({ id: 'b', weekdays: [1], display_order: 0 });
    const r = pickNextWorkout([b], 5);
    expect(r.next?.id).toBe('b');
    expect(r.isToday).toBe(false);
  });

  it('desempata por display_order', () => {
    const a = mk({ id: 'a', weekdays: [3], display_order: 5 });
    const b = mk({ id: 'b', weekdays: [3], display_order: 1 });
    const r = pickNextWorkout([a, b], 3);
    expect(r.next?.id).toBe('b');
    expect(r.rest.map((x) => x.id)).toEqual(['a']);
  });

  it('ignora inativos; vazio → next null', () => {
    const a = mk({ id: 'a', weekdays: [3], is_active: false });
    const r = pickNextWorkout([a], 3);
    expect(r.next).toBeNull();
    expect(r.rest).toHaveLength(0);
  });
});
