import jwt from "jsonwebtoken";

function getAccessSecret(): string {
  const s = process.env.JWT_ACCESS_SECRET ?? "";
  if (!s) throw new Error("JWT_ACCESS_SECRET is required");
  return s;
}

function getAccessTtlSeconds(): number {
  const n = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900);
  if (!Number.isFinite(n) || n <= 0) throw new Error("ACCESS_TOKEN_TTL_SECONDS must be a positive number");
  return n;
}

export type AccessTokenClaims = {
  sub: string; // user_id
  typ: "access";
  roles: string[];
  must_change_password: boolean;
};

export function signAccessToken(input: {
  userId: string;
  roles: string[];
  must_change_password: boolean;
}): { token: string; expiresInSeconds: number } {
  const accessSecret = getAccessSecret();
  const accessTtlSeconds = getAccessTtlSeconds();
  const payload = {
    sub: input.userId,
    typ: "access",
    roles: input.roles,
    must_change_password: input.must_change_password,
  } satisfies AccessTokenClaims;

  const token = jwt.sign(payload, accessSecret, {
    expiresIn: accessTtlSeconds,
  });
  return { token, expiresInSeconds: accessTtlSeconds };
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const accessSecret = getAccessSecret();
  const decoded = jwt.verify(token, accessSecret) as unknown;
  if (!decoded || typeof decoded !== "object") throw new Error("Invalid token");
  const sub = (decoded as { sub?: unknown }).sub;
  const typ = (decoded as { typ?: unknown }).typ;
  const rolesRaw = (decoded as { roles?: unknown }).roles;
  const mustRaw = (decoded as { must_change_password?: unknown }).must_change_password;

  if (typeof sub !== "string" || typ !== "access") throw new Error("Invalid token");

  const roles = Array.isArray(rolesRaw) ? rolesRaw.filter((r): r is string => typeof r === "string") : [];
  const must_change_password = Boolean(mustRaw);

  return { sub, typ: "access", roles, must_change_password };
}

