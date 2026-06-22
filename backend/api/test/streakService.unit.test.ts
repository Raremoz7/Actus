import { describe, it, expect } from "vitest";
import { nextStreakState, effectiveStreak } from "../src/services/streakService.js";

const H = (h: number) => h * 60 * 60 * 1000;
const at = (iso: string) => new Date(iso);

describe("nextStreakState", () => {
  it("primeira atividade → streak 1", () => {
    const s = nextStreakState(
      { streak_current: 0, last_activity_at: null, last_credit_date: null },
      { at: at("2026-06-01T14:00:00Z"), localDate: "2026-06-01" },
    );
    expect(s.streak_current).toBe(1);
    expect(s.last_credit_date).toBe("2026-06-01");
  });

  it("dia seguinte dentro de 24h → +1", () => {
    const s = nextStreakState(
      { streak_current: 1, last_activity_at: at("2026-06-01T14:00:00Z"), last_credit_date: "2026-06-01" },
      { at: at("2026-06-02T13:00:00Z"), localDate: "2026-06-02" },
    );
    expect(s.streak_current).toBe(2);
  });

  it("mesmo dia local → sem crédito (debounce)", () => {
    const s = nextStreakState(
      { streak_current: 3, last_activity_at: at("2026-06-01T14:00:00Z"), last_credit_date: "2026-06-01" },
      { at: at("2026-06-01T18:00:00Z"), localDate: "2026-06-01" },
    );
    expect(s.streak_current).toBe(3);
    expect(s.last_activity_at).toEqual(at("2026-06-01T18:00:00Z"));
  });

  it("gap maior que 24h → reseta para 1", () => {
    const s = nextStreakState(
      { streak_current: 9, last_activity_at: at("2026-06-01T14:00:00Z"), last_credit_date: "2026-06-01" },
      { at: at("2026-06-02T15:00:00Z"), localDate: "2026-06-02" },
    );
    expect(s.streak_current).toBe(1);
  });
});

describe("effectiveStreak", () => {
  it("dentro de 24h mantém o valor", () => {
    expect(effectiveStreak(5, at("2026-06-02T13:00:00Z"), at("2026-06-02T20:00:00Z")))
      .toEqual({ streak_current: 5, is_broken: false });
  });
  it("acima de 24h sem atividade → 0 e quebrado", () => {
    expect(effectiveStreak(5, at("2026-06-01T14:00:00Z"), at("2026-06-02T15:00:00Z")))
      .toEqual({ streak_current: 0, is_broken: true });
  });
  it("sem atividade alguma → 0", () => {
    expect(effectiveStreak(0, null, at("2026-06-02T15:00:00Z")))
      .toEqual({ streak_current: 0, is_broken: false });
  });
});
