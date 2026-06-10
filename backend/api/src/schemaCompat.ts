import type { Response } from "express";

/** Postgres / driver: objeto no schema não existe (migração pendente). */
export function isMissingDbObjectError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("undefined_column") ||
    msg.includes("undefined table") ||
    (msg.includes("relation ") && msg.includes(" does not exist"))
  );
}

/** Enum no Postgres sem o rótulo esperado (migração pendente). */
export function isInvalidEnumValue(err: unknown, enumLabel: string): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  const needle = enumLabel.toLowerCase();
  return msg.includes("invalid input value for enum") && msg.includes(needle);
}

/** FK check_ins.workout_session_id → workout_sessions (sessão inexistente ou outro aluno). */
export function isCheckInsWorkoutSessionFkViolation(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err);
  return msg.includes("check_ins_workout_session_id_fkey");
}

export function sendInternalError(res: Response, err: unknown): void {
  const expose = process.env.NODE_ENV !== "production" || process.env.EXPOSE_ERROR_DETAIL === "1";
  if (expose) {
    console.error(err);
    res.status(500).json({
      error: "internal_error",
      detail: String((err as Error)?.message ?? err),
    });
    return;
  }
  res.status(500).json({ error: "internal_error" });
}
