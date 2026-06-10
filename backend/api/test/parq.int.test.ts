// [ACTUS-NEW] Par-Q (B5) — testes de integração (pg-mem, sem DB externo).
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createApp } from "../src/app.js";
import { closePool, setPoolForTests } from "../src/db.js";
import { createInMemoryPg, minimalSchemaSql } from "./helpers/testDb.js";

// 7 respostas sim/não; por padrão todas "não", trocando as informadas para "sim".
function answers(yesIds: number[] = []) {
  return [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: yesIds.includes(id) }));
}

describe("Par-Q (B5)", () => {
  let pool: any;
  let app: any;

  const personalId = crypto.randomUUID();
  const alunoId = crypto.randomUUID();

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.REFRESH_TOKEN_TTL_DAYS = "30";
    process.env.DEFAULT_MAX_ACTIVE_INVITES = "20";
    await pool.query(minimalSchemaSql);
    // Tabela do Par-Q (espelha a migration 20260610120000_par_q.sql).
    await pool.query(`
      create table public.par_q_responses (
        student_id uuid primary key references public.profiles (id) on delete cascade,
        answers jsonb not null,
        any_yes boolean not null,
        answered_at date not null,
        valid_until date not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);

    const pHash = await bcrypt.hash("propass", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p@ex.com', $2)`, [personalId, pHash]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Pro')`, [personalId]);

    const aHash = await bcrypt.hash("alunopass", 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'a@ex.com', $2)`, [alunoId, aHash]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'aluno', 'Aluno')`, [alunoId]);
    await pool.query(
      `insert into public.student_professional_links (student_id, professional_id, professional_role, status) values ($1, $2, 'personal', 'active')`,
      [alunoId, personalId],
    );

    app = createApp();
  });

  afterAll(async () => {
    await closePool();
  });

  async function token(email: string, password: string): Promise<string> {
    const r = await request(app).post("/auth/login").send({ email, password });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    return r.body.access_token;
  }

  it("aluno envia o próprio Par-Q (POST) e lê em GET /me/par-q", async () => {
    const t = await token("a@ex.com", "alunopass");

    const post = await request(app)
      .post(`/students/${alunoId}/par-q`)
      .set("Authorization", `Bearer ${t}`)
      .send({ answers: answers([2]) });
    expect(post.status, JSON.stringify(post.body)).toBe(200);
    expect(post.body.par_q.any_yes).toBe(true);
    expect(post.body.par_q.answers).toHaveLength(7);
    expect(post.body.par_q.answered_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(post.body.par_q.valid_until).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const me = await request(app).get(`/me/par-q`).set("Authorization", `Bearer ${t}`);
    expect(me.status, JSON.stringify(me.body)).toBe(200);
    expect(me.body.par_q.any_yes).toBe(true);
  });

  it("profissional vinculado lê o Par-Q do aluno", async () => {
    const t = await token("p@ex.com", "propass");
    const res = await request(app)
      .get(`/professional/students/${alunoId}/par-q`)
      .set("Authorization", `Bearer ${t}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.par_q).not.toBeNull();
    expect(res.body.par_q.any_yes).toBe(true);
  });

  it("um usuário não pode enviar o Par-Q de outro (403)", async () => {
    const t = await token("p@ex.com", "propass");
    const res = await request(app)
      .post(`/students/${alunoId}/par-q`)
      .set("Authorization", `Bearer ${t}`)
      .send({ answers: answers() });
    expect(res.status).toBe(403);
  });
});
