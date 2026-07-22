/** Postgres / driver: objeto no schema não existe (migração pendente). */
export function isMissingDbObjectError(err) {
    const msg = String(err?.message ?? err).toLowerCase();
    return (msg.includes("does not exist") ||
        msg.includes("undefined_column") ||
        msg.includes("undefined table") ||
        (msg.includes("relation ") && msg.includes(" does not exist")));
}
/** Enum no Postgres sem o rótulo esperado (migração pendente). */
export function isInvalidEnumValue(err, enumLabel) {
    const msg = String(err?.message ?? err).toLowerCase();
    const needle = enumLabel.toLowerCase();
    return msg.includes("invalid input value for enum") && msg.includes(needle);
}
/** FK check_ins.workout_session_id → workout_sessions (sessão inexistente ou outro aluno). */
export function isCheckInsWorkoutSessionFkViolation(err) {
    const msg = String(err?.message ?? err);
    return msg.includes("check_ins_workout_session_id_fkey");
}
export function sendInternalError(res, err) {
    const expose = process.env.NODE_ENV !== "production" || process.env.EXPOSE_ERROR_DETAIL === "1";
    if (expose) {
        console.error(err);
        res.status(500).json({
            error: "internal_error",
            detail: String(err?.message ?? err),
        });
        return;
    }
    res.status(500).json({ error: "internal_error" });
}
