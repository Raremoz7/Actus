// [ACTUS-NEW] A3 — testes do preview público de convite.
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { createApp } from '../src/app.js';
import { closePool, setPoolForTests } from '../src/db.js';
import { createInMemoryPg, minimalSchemaSql } from './helpers/testDb.js';

describe('GET /invites/:code/preview (público)', () => {
  let pool: any;
  let app: any;
  let proId: string;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    await pool.query(minimalSchemaSql);

    proId = crypto.randomUUID();
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'pro.inv@ex.com', 'x')`, [proId]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, 'personal', 'Treinador Ana')`, [proId]);

    const future = new Date(Date.now() + 7 * 864e5).toISOString();
    const past = new Date(Date.now() - 864e5).toISOString();
    await pool.query(
      `insert into public.invites (id, professional_id, code, expires_at, max_uses, used_count) values ($1,$2,'VALIDO',$3,5,0)`,
      [crypto.randomUUID(), proId, future],
    );
    await pool.query(
      `insert into public.invites (id, professional_id, code, expires_at, max_uses, used_count) values ($1,$2,'EXPIRADO',$3,5,0)`,
      [crypto.randomUUID(), proId, past],
    );
    await pool.query(
      `insert into public.invites (id, professional_id, code, expires_at, max_uses, used_count) values ($1,$2,'ESGOTADO',$3,2,2)`,
      [crypto.randomUUID(), proId, future],
    );

    app = createApp();
  });

  afterAll(async () => {
    await closePool();
  });

  it('convite válido → 200 ok + nome do convidador (sem auth)', async () => {
    const res = await request(app).get('/invites/VALIDO/preview');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.professional_display_name).toBe('Treinador Ana');
  });

  it('convite expirado → erro invite_expired', async () => {
    const res = await request(app).get('/invites/EXPIRADO/preview');
    expect(res.status).toBe(410);
    expect(res.body.error).toBe('invite_expired');
  });

  it('convite esgotado → erro invite_exhausted', async () => {
    const res = await request(app).get('/invites/ESGOTADO/preview');
    expect(res.status).toBe(410);
    expect(res.body.error).toBe('invite_exhausted');
  });

  it('código inexistente → invalid_invite', async () => {
    const res = await request(app).get('/invites/NAOEXISTE/preview');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('invalid_invite');
  });

  it('não exige autenticação (sem header Authorization)', async () => {
    const res = await request(app).get('/invites/VALIDO/preview');
    expect(res.status).not.toBe(401);
  });
});
