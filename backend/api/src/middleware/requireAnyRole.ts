import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt.js";
import type { AuthedRequest } from "./requireAuth.js";
import { isPasswordChangeExemptPath } from "./requireAuth.js";

export function requireAnyRole(roles: string[]) {
  const allowed = new Set(roles);
  return function requireAnyRoleMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "missing_authorization" });
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const claims = verifyAccessToken(token);
      (req as AuthedRequest).userId = claims.sub;
      if (claims.must_change_password && !isPasswordChangeExemptPath(req)) {
        return res.status(403).json({ error: "must_change_password" });
      }
      const rs = claims.roles ?? [];
      if (!rs.some((r) => allowed.has(r))) {
        return res.status(403).json({ error: "forbidden" });
      }
      return next();
    } catch {
      return res.status(401).json({ error: "invalid_token" });
    }
  };
}
