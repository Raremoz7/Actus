import { render, screen } from '@testing-library/react-native';
import { WeekStrip } from './WeekStrip';
import type { WeeklyOverview } from '@/types/gamification';

const overview: WeeklyOverview = {
  week_start: '2026-06-01',
  week_end: '2026-06-07',
  today_date: '2026-06-03',
  today_weekday: 3,
  timezone: 'America/Sao_Paulo',
  streak_current: 7,
  streak_best: 21,
  days: [
    { date: '2026-06-01', weekday: 1, completed: true },
    { date: '2026-06-02', weekday: 2, completed: true },
    { date: '2026-06-03', weekday: 3, completed: false },
    { date: '2026-06-04', weekday: 4, completed: false },
    { date: '2026-06-05', weekday: 5, completed: false },
    { date: '2026-06-06', weekday: 6, completed: false },
    { date: '2026-06-07', weekday: 7, completed: false },
  ],
};

describe('WeekStrip', () => {
  it('consolida o streak num KPI único com atual e recorde', () => {
    render(<WeekStrip overview={overview} plannedWeekdays={[1, 3, 5]} />);
    expect(screen.getByText('Sequência')).toBeTruthy();
    expect(screen.getByText('Atual 7 · Recorde 21')).toBeTruthy();
  });
});
