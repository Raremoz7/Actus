/**
 * Estimativa MET simplificada (Compendium aproximado).
 * Com registro de cargas: esforço moderado-forte; sem cargas: atividade leve pelo tempo.
 */
export function pickMetForSession(hasLoadData) {
    return hasLoadData ? 6 : 3.5;
}
/** kcal ≈ MET × peso(kg) × horas (fórmula usual ACSM). */
export function caloriesFromMet(met, bodyWeightKg, durationMs) {
    if (!Number.isFinite(met) || !Number.isFinite(bodyWeightKg) || bodyWeightKg <= 0 || durationMs <= 0)
        return 0;
    const hours = durationMs / 3_600_000;
    return Math.round(met * bodyWeightKg * hours);
}
export const REFERENCE_BODY_WEIGHT_KG = 70;
