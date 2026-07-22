// [ACTUS-NEW] A4 — testes do GET /me/profile (perfil rico).
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { createApp } from '../src/app.js';
import { closePool, setPoolForTests } from '../src/db.js';
import { createInMemoryPg, minimalSchemaSql } from './helpers/testDb.js';

async function login(app: any, email: string, password: string): Promise<string> {
  const res = await request(app).post('/auth/login').send({ email, password });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body.access_token as string;
}

describe('GET /me/profile', () => {
  let pool: any;
  let app: any;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    await pool.query(minimalSchemaSql);
    app = createApp();
  });

  afterAll(async () => {
    await closePool();
  });

  it('aluno: junta profiles + user_basic_info (peso vira número, data YYYY-MM-DD)', async () => {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash('alunopass', 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'a.profile@ex.com', $2)`, [id, hash]);
    await pool.query(`insert into public.profiles (id, tipo, display_name, avatar_url, timezone) values ($1, 'aluno', 'Aluno P', null, 'America/Sao_Paulo')`, [id]);
    await pool.query(
      `insert into public.user_basic_info (user_id, full_name, birth_date, phone, gender, body_weight_kg)
       values ($1, 'Aluno Pereira', '2000-01-15'::date, '+5531999999999', 'masculino'::public.user_gender, 75.5)`,
      [id],
    );

    const token = await login(app, 'a.profile@ex.com', 'alunopass');
    const res = await request(app).get('/me/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.tipo).toBe('aluno');
    expect(res.body.full_name).toBe('Aluno Pereira');
    expect(res.body.phone).toBe('+5531999999999');
    expect(res.body.gender).toBe('masculino');
    expect(res.body.body_weight_kg).toBe(75.5);
    expect(typeof res.body.body_weight_kg).toBe('number');
    expect(res.body.birth_date).toBe('2000-01-15');
    expect(res.body.timezone).toBe('America/Sao_Paulo');
  });

  it('profissional sem user_basic_info: campos student vêm null, profile vem preenchido', async () => {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash('propass', 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p.profile@ex.com', $2)`, [id, hash]);
    // Profissional auto-cadastrado: phone em profiles.phone, sem user_basic_info.
    await pool.query(`insert into public.profiles (id, tipo, display_name, phone) values ($1, 'personal', 'Personal P', '+5531988887777')`, [id]);

    const token = await login(app, 'p.profile@ex.com', 'propass');
    const res = await request(app).get('/me/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.tipo).toBe('personal');
    expect(res.body.display_name).toBe('Personal P');
    // coalesce: phone de profiles.phone; full_name cai pro display_name (sem user_basic_info).
    expect(res.body.phone).toBe('+5531988887777');
    expect(res.body.full_name).toBe('Personal P');
    expect(res.body.body_weight_kg).toBeNull();
    expect(res.body.birth_date).toBeNull();
  });

  it('profissional edita o próprio telefone via PATCH /me → grava em profiles.phone (não 400)', async () => {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash('propass', 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, 'p.edit@ex.com', $2)`, [id, hash]);
    await pool.query(`insert into public.profiles (id, tipo, display_name, phone) values ($1, 'personal', 'Pro Edit', '+5511111111111')`, [id]);

    const token = await login(app, 'p.edit@ex.com', 'propass');
    const patch = await request(app)
      .patch('/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+5599999999999' });
    expect(patch.status, JSON.stringify(patch.body)).toBe(200);

    const res = await request(app).get('/me/profile').set('Authorization', `Bearer ${token}`);
    expect(res.body.phone).toBe('+5599999999999');
  });

  it('sem token → 401', async () => {
    const res = await request(app).get('/me/profile');
    expect(res.status).toBe(401);
  });
});
