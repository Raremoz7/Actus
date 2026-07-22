import { describe, expect, it } from "vitest";
import { REFERENCE_BODY_WEIGHT_KG, caloriesFromMet, pickMetForSession } from "../src/domain/workoutCalories.js";

describe("workoutCalories", () => {
  it("usa MET mais alto quando há dados de carga", () => {
    expect(pickMetForSession(true)).toBe(6);
    expect(pickMetForSession(false)).toBe(3.5);
  });

  it("calcula kcal por MET × peso × horas", () => {
    const kcal = caloriesFromMet(6, 80, 3600000);
    expect(kcal).toBe(480);
    expect(caloriesFromMet(3.5, REFERENCE_BODY_WEIGHT_KG, 3600000)).toBe(245);
  });
});
