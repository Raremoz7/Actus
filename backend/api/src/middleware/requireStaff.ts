import { requireAnyRole } from "./requireAnyRole.js";

export const requireStaff = requireAnyRole(["actus_admin", "actus_suporte"]);
