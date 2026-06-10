import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt.js";

export type AuthedRequest = Request & { userId: string };

/** Use em rotas com `mergeParams` onde o `Request` tipado não inclui `userId`. */
export function authedUserId(req: Request): string {
  return (req as unknown as AuthedRequest).userId;
}

function fullRequestPath(req: Request): string {
  const base = req.baseUrl ?? "";
  const path = req.path ?? "";
  return `${base}${path}` || "/";
}

export function isPasswordChangeExemptPath(req: Request): boolean {
  const p = fullRequestPath(req);
  return (
    p === "/auth/change-password" ||
    p.startsWith("/auth/change-password/") ||
    p === "/auth/logout" ||
    p.startsWith("/auth/logout/")
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_authorization" });
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const claims = verifyAccessToken(token);
    (req as AuthedRequest).userId = claims.sub;

    if (claims.must_change_password) {
      if (!isPasswordChangeExemptPath(req)) {
        return res.status(403).json({ error: "must_change_password" });
      }
    }

    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

