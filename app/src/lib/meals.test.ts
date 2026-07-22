import {
  isMealInputValid,
  mealTimeLabel,
  groupFeedByDay,
  type FeedMeal,
} from './meals';

describe('isMealInputValid', () => {
  const base = { eatenAt: '2026-07-01T12:00:00.000Z', tags: [] };
  it('exige horário + (descrição OU foto)', () => {
    expect(isMealInputValid({ ...base, description: 'ovos', photoUri: null })).toBe(true);
    expect(isMealInputValid({ ...base, description: null, photoUri: 'file://x.jpg' })).toBe(true);
    expect(isMealInputValid({ ...base, description: '  ', photoUri: null })).toBe(false);
    expect(isMealInputValid({ ...base, description: null, photoUri: null })).toBe(false);
  });
});

describe('mealTimeLabel', () => {
  it('formata HH:MM local', () => {
    const d = new Date(2026, 6, 1, 8, 5);
    expect(mealTimeLabel(d.toISOString())).toBe('08:05');
  });
});

describe('groupFeedByDay', () => {
  it('agrupa por dia local, mais recente primeiro', () => {
    const mk = (id: string, iso: string): FeedMeal => ({
      key: id, id, photoUri: null, eatenAt: iso, description: id,
      tags: [], comments: [], sync: 'synced',
    });
    const a = mk('a', new Date(2026, 6, 1, 9, 0).toISOString());
    const b = mk('b', new Date(2026, 6, 1, 20, 0).toISOString());
    const c = mk('c', new Date(2026, 6, 2, 7, 0).toISOString());
    const groups = groupFeedByDay([a, b, c]);
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-07-02', '2026-07-01']);
    expect(groups[1]!.meals.map((m) => m.id)).toEqual(['b', 'a']);
  });
});
