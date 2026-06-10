import jwt from "jsonwebtoken";
function getAccessSecret() {
    const s = process.env.JWT_ACCESS_SECRET ?? "";
    if (!s)
        throw new Error("JWT_ACCESS_SECRET is required");
    return s;
}
function getAccessTtlSeconds() {
    const n = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900);
    if (!Number.isFinite(n) || n <= 0)
        throw new Error("ACCESS_TOKEN_TTL_SECONDS must be a positive number");
    return n;
}
export function signAccessToken(input) {
    const accessSecret = getAccessSecret();
    const accessTtlSeconds = getAccessTtlSeconds();
    const payload = {
        sub: input.userId,
        typ: "access",
        roles: input.roles,
        must_change_password: input.must_change_password,
    };
    const token = jwt.sign(payload, accessSecret, {
        expiresIn: accessTtlSeconds,
    });
    return { token, expiresInSeconds: accessTtlSeconds };
}
export function verifyAccessToken(token) {
    const accessSecret = getAccessSecret();
    const decoded = jwt.verify(token, accessSecret);
    if (!decoded || typeof decoded !== "object")
        throw new Error("Invalid token");
    const sub = decoded.sub;
    const typ = decoded.typ;
    const rolesRaw = decoded.roles;
    const mustRaw = decoded.must_change_password;
    if (typeof sub !== "string" || typ !== "access")
        throw new Error("Invalid token");
    const roles = Array.isArray(rolesRaw) ? rolesRaw.filter((r) => typeof r === "string") : [];
    const must_change_password = Boolean(mustRaw);
    return { sub, typ: "access", roles, must_change_password };
}
