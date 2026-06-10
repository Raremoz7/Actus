// [ACTUS — NOVO vs produção: testes do auto-cadastro de profissional.
// Ver backend/CHANGES-FROM-PRODUCTION.md]
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { closePool, setPoolForTests } from '../src/db.js';
import { createInMemoryPg, minimalSchemaSql } from './helpers/testDb.js';

describe('POST /auth/register-professional', () => {
  let pool: any;

  beforeAll(async () => {
    const mem = createInMemoryPg();
    pool = mem.pool;
    setPoolForTests(pool);
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
    process.env.REFRESH_TOKEN_TTL_DAYS = '30';
    await pool.query(minimalSchemaSql);
  });

  afterAll(async () => {
    await closePool();
  });

  const body = {
    email: 'pro.novo@example.com',
    password: 'senhaforte1',
    full_name: 'Personal Novo',
    phone: '+55 31 99999-0000',
    lgpd_consent: true,
  };

  it('cria profissional ATIVO com tokens; login funciona e /me devolve tipo personal', async () => {
    const app = createApp();

    const reg = await request(app).post('/auth/register-professional').send(body);
    expect(reg.status, JSON.stringify(reg.body)).toBe(201);
    expect(typeof reg.body.access_token).toBe('string');
    expect(typeof reg.body.refresh_token).toBe('string');

    // Conta ativa: login imediato com as mesmas credenciais.
    const login = await request(app)
      .post('/auth/login')
      .send({ email: body.email, password: body.password });
    expect(login.status, JSON.stringify(login.body)).toBe(200);

    // /me roteia por tipo → personal.
    const me = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${reg.body.access_token as string}`);
    expect(me.status, JSON.stringify(me.body)).toBe(200);
    expect(me.body.tipo).toBe('personal');
    expect(me.body.display_name).toBe('Personal Novo');
  });

  it('e-mail duplicado → 409 email_already_in_use', async () => {
    const app = createApp();
    await request(app).post('/auth/register-professional').send({ ...body, email: 'dup@example.com' });
    const again = await request(app).post('/auth/register-professional').send({ ...body, email: 'dup@example.com' });
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('email_already_in_use');
  });

  it('corpo inválido (senha curta) → 400 invalid_body', async () => {
    const app = createApp();
    const bad = await request(app)
      .post('/auth/register-professional')
      .send({ ...body, email: 'curta@example.com', password: '123' });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('invalid_body');
  });
});
