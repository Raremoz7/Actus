import { z } from 'zod';

// TODO Bloco 6: schemas completos de gamificação (XP, badges, streaks detalhados).

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Dia individual dentro do resumo semanal.
export const WeeklyOverviewDaySchema = z.object({
  date: dateOnly,
  weekday: z.number().int().min(1).max(7),
  completed: z.boolean(),
});
export type WeeklyOverviewDay = z.infer<typeof WeeklyOverviewDaySchema>;

// GET /me/gamification/weekly-overview → visão da semana atual com streak.
export const WeeklyOverviewSchema = z.object({
  week_start: dateOnly,
  week_end: dateOnly,
  today_date: dateOnly,
  today_weekday: z.number().int().min(1).max(7),
  timezone: z.string(),
  streak_current: z.number().int().min(0),
  streak_best: z.number().int().min(0),
  days: z.array(WeeklyOverviewDaySchema),
  is_broken: z.boolean().optional(),
  last_activity_at: z.string().nullable().optional(),
});
export type WeeklyOverview = z.infer<typeof WeeklyOverviewSchema>;

// Badge do catálogo + status de conquista (GET /me/badges).
export const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  asset_key: z.string(),
  sort_order: z.number().int().optional(),
  earned: z.boolean().optional(),
  earned_at: z.string().nullable().optional(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export const BadgeListSchema = z.object({ badges: z.array(BadgeSchema) });
export type BadgeList = z.infer<typeof BadgeListSchema>;
