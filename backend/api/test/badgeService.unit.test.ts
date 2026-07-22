import { describe, it, expect } from "vitest";
import { selectNewlyEarned, type BadgeRow, type BadgeMetrics } from "../src/services/badgeService.js";

const catalog: BadgeRow[] = [
  { id: "first_step", name: "Primeiro Passo", description: "", criteria_type: "workout_count", criteria_threshold: 1, asset_key: "a", sort_order: 1, active: true },
  { id: "committed_5", name: "Comprometido", description: "", criteria_type: "workout_count", criteria_threshold: 5, asset_key: "a", sort_order: 2, active: true },
  { id: "fire_streak_7", name: "Sequência de Fogo", description: "", criteria_type: "streak", criteria_threshold: 7, asset_key: "a", sort_order: 3, active: true },
  { id: "personal_record", name: "Recorde Pessoal", description: "", criteria_type: "personal_record", criteria_threshold: null, asset_key: "a", sort_order: 4, active: true },
];

const metrics = (m: Partial<BadgeMetrics>): BadgeMetrics =>
  ({ total_workouts_completed: 0, streak_current: 0, had_pr: false, ...m });

describe("selectNewlyEarned", () => {
  it("desbloqueia first_step com 1 treino", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ total_workouts_completed: 1 }));
    expect(r.map((b) => b.id)).toEqual(["first_step"]);
  });
  it("desbloqueia first_step e committed_5 com 5 treinos", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ total_workouts_completed: 5 }));
    expect(r.map((b) => b.id).sort()).toEqual(["committed_5", "first_step"]);
  });
  it("não redesbloqueia o que já foi conquistado", () => {
    const r = selectNewlyEarned(catalog, new Set(["first_step"]), metrics({ total_workouts_completed: 5 }));
    expect(r.map((b) => b.id)).toEqual(["committed_5"]);
  });
  it("streak 7 desbloqueia fire_streak_7", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ streak_current: 7 }));
    expect(r.map((b) => b.id)).toEqual(["fire_streak_7"]);
  });
  it("PR desbloqueia personal_record", () => {
    const r = selectNewlyEarned(catalog, new Set(), metrics({ had_pr: true }));
    expect(r.map((b) => b.id)).toEqual(["personal_record"]);
  });
});
