import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.js";
import invitesRoutes from "./routes/invites.js";
import invitePreviewRouter from "./routes/invitePreview.js"; // [ACTUS-NEW] A3
import meRoutes from "./routes/me.js";
import meStudentProgramRoutes from "./routes/meStudentProgram.js";
import meGamificationRoutes from "./routes/meGamification.js";
import professionalChallengesRoutes from "./routes/professionalChallenges.js";
import meChallengesRoutes from "./routes/meChallenges.js";
import { requirePersonal } from "./middleware/requirePersonal.js";
import adminProfessionalsRoutes from "./routes/adminProfessionals.js";
import professionalStudentsRoutes from "./routes/professionalStudents.js";
import adminStudentLinksRoutes from "./routes/adminStudentLinks.js";
import adminStaffRoutes from "./routes/adminStaff.js";
import workoutsRoutes from "./routes/workouts.js";
import studentWorkoutsRoutes from "./routes/studentWorkouts.js";
import dietTemplatesRoutes from "./routes/dietTemplates.js";
import studentDietsRoutes from "./routes/studentDiets.js";
// [ACTUS-NEW] Par-Q (B5): três routers (aluno envia / aluno lê / profissional lê).
import {
  studentParqRouter,
  meParqRouter,
  professionalParqRouter,
  professionalParqListRouter,
} from "./routes/parq.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { requireStudent } from "./middleware/requireStudent.js";
import { requireStaff } from "./middleware/requireStaff.js";
import { openapi } from "./openapi.js";
import { OPENAPI_TAGS } from "./openapiTags.js";

/**
 * swagger-ui-express serializa `tagsSorter` para o browser com `Function.prototype.toString()`.
 * O código não pode referenciar `openapi` nem outras variáveis do Node — só o que ficar literal no corpo da função.
 */
function createSwaggerUiTagsSorter(): (a: unknown, b: unknown) => number {
  const orderJson = JSON.stringify(OPENAPI_TAGS.map((t) => t.name));
  return new Function(
    "a",
    "b",
    `"use strict";
    try {
      var order = ${orderJson};
      function tagName(tag) {
        if (typeof tag === "string") return tag;
        if (tag != null && typeof tag === "object" && typeof tag.name === "string") return tag.name;
        return "";
      }
      var nameA = tagName(a);
      var nameB = tagName(b);
      var ia = order.indexOf(nameA);
      var ib = order.indexOf(nameB);
      if (ia === -1 && ib === -1) return nameA.localeCompare(nameB);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    } catch (e) {
      return 0;
    }`,
  ) as (a: unknown, b: unknown) => number;
}

const swaggerUiTagsSorter = createSwaggerUiTagsSorter();

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/openapi.json", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(openapi);
  });

  /** Evita Swagger/HTML/init.js antigos no browser após deploy (spec sem PATCH parecia “sumir”). */
  function swaggerNoStore(_req: express.Request, res: express.Response, next: express.NextFunction) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    next();
  }

  /**
   * Spec por URL em vez de embutir no HTML: o bundle serializa o doc dentro de <script>;
   * strings/caracteres raros no OpenAPI podem corromper o JS e o Swagger UI rebenta no React ("BaseLayout").
   */
  app.use(
    "/docs",
    swaggerNoStore,
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerUrl: "/openapi.json",
      swaggerOptions: {
        docExpansion: "list",
        filter: true,
        persistAuthorization: true,
        tagsSorter: swaggerUiTagsSorter,
        operationsSorter: "alpha",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    }),
  );

  app.use("/auth", authRoutes);
  app.use("/admin/professionals", requireStaff, adminProfessionalsRoutes);
  app.use("/admin/links/students", requireStaff, adminStudentLinksRoutes);
  app.use("/admin/staff", requireStaff, adminStaffRoutes);
  // [ACTUS-NEW] A3 — preview PÚBLICO de convite, registrado ANTES do /invites protegido
  // (mais específico + sem requireAuth: é usado no passo 1 do cadastro, sem sessão).
  app.use("/invites/:code/preview", invitePreviewRouter);
  app.use("/invites", requireAuth, invitesRoutes);
  // [ACTUS-NEW] Par-Q em massa — ANTES do mount amplo p/ não cair em :student_id.
  app.use("/professional/students/par-q", requireAuth, professionalParqListRouter);
  app.use("/professional/students", requireAuth, professionalStudentsRoutes);
  app.use("/professional/challenges", requireAuth, requirePersonal, professionalChallengesRoutes);
  app.use("/workouts", requireAuth, workoutsRoutes);
  app.use("/diet-templates", requireAuth, dietTemplatesRoutes);
  app.use("/students/:student_id/workouts", requireAuth, studentWorkoutsRoutes);
  app.use("/students/:student_id/diets", requireAuth, studentDietsRoutes);
  app.use("/me", requireAuth, meRoutes);
  app.use("/me", requireAuth, requireStudent, meStudentProgramRoutes);
  app.use("/me", requireAuth, requireStudent, meGamificationRoutes);
  app.use("/me", requireAuth, requireStudent, meChallengesRoutes);
  // [ACTUS-NEW] Par-Q (B5) — ver routes/parq.ts e migration 20260610120000_par_q.sql.
  app.use("/students/:student_id/par-q", requireAuth, studentParqRouter);
  app.use("/me/par-q", requireAuth, requireStudent, meParqRouter);
  app.use("/professional/students/:student_id/par-q", requireAuth, professionalParqRouter);

  return app;
}

