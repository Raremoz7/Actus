import { Router } from "express";
import { z } from "zod";
import { authedUserId } from "../middleware/requireAuth.js";
import { withTx } from "../db.js";

const router = Router();

const patchMeSchema = z
  .object({
    display_name: z.string().min(1).max(200).optional(),
    avatar_url: z.union([z.string().url().max(2000), z.literal("")]).optional(),
    timezone: z.string().min(1).max(64).optional(),
    full_name: z.string().min(3).max(200).optional(),
    phone: z.string().min(6).max(40).optional().nullable(),
    gender: z.enum(["masculino", "feminino", "nao_informar", "outro"]).optional(),
    body_weight_kg: z.number().min(20).max(400).optional().nullable(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty_patch" });

router.get("/", async (req, res) => {
  const userId = authedUserId(req);
  const me = await withTx(async (client) => {
    const q = await client.query<{ id: string; tipo: string; display_name: string | null }>(
      `select id, tipo::text, display_name from public.profiles where id = $1`,
      [userId],
    );
    const profile = q.rows[0] ?? null;
    if (!profile) return null;
    // [ACTUS — academia] contexto da academia (se o usuário for membro ativo): o painel web usa
    // para rotear o gestor e exibir o nome da academia. Membro = gestor (manager) ou instrutor.
    const aq = await client.query<{ id: string; name: string; role: string }>(
      `select am.academy_id as id, a.name, am.role
       from public.academy_members am
       join public.academies a on a.id = am.academy_id
       where am.user_id = $1 and am.status = 'active'
       order by am.created_at asc
       limit 1`,
      [userId],
    );
    return { ...profile, academy: aq.rows[0] ?? null };
  });
  if (!me) return res.status(404).json({ error: "profile_not_found" });
  return res.json(me);
});

// [ACTUS-NEW] A4 — perfil RICO do usuário logado (read-back do que o PATCH /me grava).
// GET /me não muda (bootstrap/MeSchema). Aqui juntamos profiles + user_basic_info para a
// tela editar-perfil pré-preencher. user_basic_info é student-shaped: profissional não tem
// (campos vêm null). Ver backend/CHANGES-FROM-PRODUCTION.md.
function toDateOnly(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    // Coluna `date` volta como Date à meia-noite UTC (node-pg e pg-mem). Extrair por
    // componentes UTC — usar locais causaria off-by-one em fuso atrás de UTC (UTC-3).
    const p = (n: number) => String(n).padStart(2, "0");
    return `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())}`;
  }
  return String(v).slice(0, 10);
}

router.get("/profile", async (req, res) => {
  const userId = authedUserId(req);
  try {
    const row = await withTx(async (client) => {
      const q = await client.query<{
        id: string;
        tipo: string;
        display_name: string | null;
        avatar_url: string | null;
        timezone: string | null;
        full_name: string | null;
        phone: string | null;
        gender: string | null;
        body_weight_kg: string | number | null;
        birth_date: unknown;
      }>(
        // coalesce: aluno guarda full_name/phone em user_basic_info; profissional (sem
        // user_basic_info) guarda em profiles (display_name/phone). Lê os dois.
        `select p.id, p.tipo::text as tipo, p.display_name, p.avatar_url, p.timezone,
                coalesce(i.full_name, p.display_name) as full_name,
                coalesce(i.phone, p.phone) as phone,
                i.gender::text as gender, i.body_weight_kg, i.birth_date
         from public.profiles p
         left join public.user_basic_info i on i.user_id = p.id
         where p.id = $1`,
        [userId],
      );
      return q.rows[0] ?? null;
    });

    if (!row) return res.status(404).json({ error: "profile_not_found" });
    return res.json({
      id: row.id,
      tipo: row.tipo,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      timezone: row.timezone,
      full_name: row.full_name,
      phone: row.phone,
      gender: row.gender,
      // pg devolve numeric como string → number (ou null).
      body_weight_kg: row.body_weight_kg == null ? null : Number(row.body_weight_kg),
      birth_date: toDateOnly(row.birth_date),
    });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

router.patch("/", async (req, res) => {
  const userId = authedUserId(req);
  const parsed = patchMeSchema.safeParse(req.body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    if (flat.fieldErrors && Object.keys(flat.fieldErrors).length === 0 && String(parsed.error.message).includes("empty")) {
      return res.status(400).json({ error: "invalid_body", details: { formErrors: ["Informe ao menos um campo"] } });
    }
    return res.status(400).json({ error: "invalid_body", details: flat });
  }

  const { display_name, avatar_url, timezone, full_name, phone, gender, body_weight_kg } = parsed.data;

  const hasInfoFields =
    full_name !== undefined || phone !== undefined || gender !== undefined || body_weight_kg !== undefined;

  try {
    const me = await withTx(async (client) => {
      // tipo decide ONDE phone/full_name moram: aluno → user_basic_info; profissional
      // (sem user_basic_info) → profiles (phone/display_name); staff → não tem onde.
      const tQ = await client.query<{ tipo: string }>(`select tipo::text as tipo from public.profiles where id = $1`, [userId]);
      const tipo = tQ.rows[0]?.tipo ?? null;
      if (!tipo) return { ok: false as const, status: 404, error: "profile_not_found" as const };
      const isProfessional = tipo === "personal" || tipo === "nutricionista";

      // Checa cedo (antes de qualquer UPDATE) → sem commit parcial no caminho de erro.
      let hasInfo = false;
      if (hasInfoFields) {
        const infoQ = await client.query(`select 1 from public.user_basic_info where user_id = $1`, [userId]);
        hasInfo = infoQ.rows.length > 0;
        if (!hasInfo && !isProfessional) {
          return { ok: false as const, status: 400, error: "user_basic_info_not_found" as const };
        }
      }

      const profFields: string[] = [];
      const profVals: unknown[] = [];
      let i = 1;
      if (display_name !== undefined) {
        profFields.push(`display_name = $${i++}`);
        profVals.push(display_name);
      }
      if (avatar_url !== undefined) {
        profFields.push(`avatar_url = $${i++}`);
        profVals.push(avatar_url === "" ? null : avatar_url);
      }
      if (timezone !== undefined) {
        profFields.push(`timezone = $${i++}`);
        profVals.push(timezone);
      }
      // Profissional: phone → profiles.phone; full_name → profiles.display_name (se não veio display_name).
      if (isProfessional && !hasInfo) {
        if (phone !== undefined) {
          profFields.push(`phone = $${i++}`);
          profVals.push(phone);
        }
        if (full_name !== undefined && display_name === undefined) {
          profFields.push(`display_name = $${i++}`);
          profVals.push(full_name);
        }
      }
      if (profFields.length) {
        profVals.push(userId);
        await client.query(
          `update public.profiles set ${profFields.join(", ")}, updated_at = now() where id = $${i}`,
          profVals,
        );
      }

      // user_basic_info (aluno com a linha). gender/body_weight_kg de profissional não têm
      // casa (sem user_basic_info) → ignorados de propósito.
      if (hasInfoFields && hasInfo) {
        const uFields: string[] = [];
        const uVals: unknown[] = [];
        let j = 1;
        if (full_name !== undefined) {
          uFields.push(`full_name = $${j++}`);
          uVals.push(full_name);
        }
        if (phone !== undefined) {
          uFields.push(`phone = $${j++}`);
          uVals.push(phone);
        }
        if (gender !== undefined) {
          uFields.push(`gender = $${j++}::public.user_gender`);
          uVals.push(gender);
        }
        if (body_weight_kg !== undefined) {
          uFields.push(`body_weight_kg = $${j++}`);
          uVals.push(body_weight_kg);
        }
        if (uFields.length) {
          uVals.push(userId);
          await client.query(
            `update public.user_basic_info set ${uFields.join(", ")} where user_id = $${j}`,
            uVals,
          );
        }
      }

      const q = await client.query<{ id: string; tipo: string; display_name: string | null }>(
        `select id, tipo::text, display_name from public.profiles where id = $1`,
        [userId],
      );
      return { ok: true as const, row: q.rows[0] ?? null };
    });

    if (!me.ok) return res.status(me.status).json({ error: me.error });
    if (!me.row) return res.status(404).json({ error: "profile_not_found" });
    return res.json(me.row);
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
