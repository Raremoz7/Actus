// [ACTUS-NEW] Upload de avatar do usuário logado (POST /me/avatar). Em produção não havia
// nada de upload/storage. Aqui: multipart → grava em disco (AVATAR_UPLOAD_DIR) → seta
// profiles.avatar_url para a URL servida estaticamente em /uploads. Substituível por
// Supabase Storage/S3 depois (trocar saveFile + a base da URL). Ver backend/CHANGES-FROM-PRODUCTION.md.
import { Router } from "express";
import multer from "multer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { withTx } from "../db.js";
import { authedUserId } from "../middleware/requireAuth.js";
import { uuid } from "../crypto.js";

// Onde os arquivos ficam. Lazy (lido por request/mount) p/ testes apontarem um tmp.
// Configurável via AVATAR_UPLOAD_DIR; default ./uploads na raiz da API.
export function avatarUploadDir(): string {
  return process.env.AVATAR_UPLOAD_DIR ?? path.resolve(process.cwd(), "uploads");
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// multer em memória — escrevemos o arquivo nós mesmos (nome controlado + valida mime).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) cb(null, true);
    else cb(null, false);
  },
});

// Base pública da URL servida. Atrás de proxy/ngrok, PUBLIC_BASE_URL é o mais confiável;
// senão deriva do request (protocolo + host).
function publicBase(req: { protocol: string; get: (h: string) => string | undefined }): string {
  const env = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (env) return env;
  return `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

const router = Router();

// Montado em /me/avatar → a rota é "/".
router.post("/", upload.single("avatar"), async (req, res) => {
  const userId = authedUserId(req);
  const file = req.file;
  if (!file) return res.status(400).json({ error: "invalid_image" });

  const ext = EXT_BY_MIME[file.mimetype];
  if (!ext) return res.status(400).json({ error: "invalid_image" });

  try {
    const dir = avatarUploadDir();
    await fs.mkdir(dir, { recursive: true });
    const filename = `${userId}-${uuid()}.${ext}`;
    await fs.writeFile(path.join(dir, filename), file.buffer);

    const avatarUrl = `${publicBase(req)}/uploads/${filename}`;
    const out = await withTx(async (client) => {
      const r = await client.query<{ id: string }>(
        `update public.profiles set avatar_url = $2, updated_at = now() where id = $1 returning id`,
        [userId, avatarUrl],
      );
      return r.rows.length > 0;
    });
    if (!out) return res.status(404).json({ error: "profile_not_found" });

    return res.status(201).json({ avatar_url: avatarUrl });
  } catch {
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
