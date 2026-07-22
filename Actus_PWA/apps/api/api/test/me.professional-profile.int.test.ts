// [ACTUS-NEW] Perfil profissional self-service (onboarding do professor — TEC-8).
// GET/PATCH /me/professional-profile: profissional grava nome/área/CREF/experiência/
// cidade/intenção; aluno é barrado (403 not_professional).
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

async function makeUser(pool: any, email: string, tipo: string, displayName: string): Promise<string> {
  const id = crypto.randomUUID();
  const hash = await bcrypt.hash('secret123', 12);
  await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, $2, $3)`, [id, email, hash]);
  await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, $2::public.user_role, $3)`, [
    id,
    tipo,
    displayName,
  ]);
  return id;
}

describe('GET/PATCH /me/professional-profile', () => {
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

  it('profissional: grava perfil parcial e lê de volta; nome vai p/ display_name', async () => {
    await makeUser(pool, 'pp.pro@ex.com', 'personal', 'Inicial');
    const token = await login(app, 'pp.pro@ex.com', 'secret123');

    const patch = await request(app)
      .patch('/me/professional-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome_profissional: 'João Personal',
        area: 'musculacao',
        cref: '012345-G/SP',
        experiencia_anos: '5 anos',
        cidade_uf: 'São Paulo/SP',
      });
    expect(patch.status, JSON.stringify(patch.body)).toBe(200);
    expect(patch.body.ok).toBe(true);

    const get = await request(app)
      .get('/me/professional-profile')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status, JSON.stringify(get.body)).toBe(200);
    expect(get.body.nome_profissional).toBe('João Personal');
    expect(get.body.area).toBe('musculacao');
    expect(get.body.cref).toBe('012345-G/SP');
    expect(get.body.experiencia_anos).toBe('5 anos');
    expect(get.body.cidade_uf).toBe('São Paulo/SP');

    // /me/profile (display_name) reflete o nome profissional.
    const profile = await request(app).get('/me/profile').set('Authorization', `Bearer ${token}`);
    expect(profile.body.display_name).toBe('João Personal');

    // PATCH posterior só com forma_uso não apaga os campos anteriores (merge parcial).
    const patch2 = await request(app)
      .patch('/me/professional-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ forma_uso: 'organizar' });
    expect(patch2.status).toBe(200);
    const get2 = await request(app)
      .get('/me/professional-profile')
      .set('Authorization', `Bearer ${token}`);
    expect(get2.body.forma_uso).toBe('organizar');
    expect(get2.body.area).toBe('musculacao');
  });

  it('aluno → 403 not_professional', async () => {
    await makeUser(pool, 'pp.aluno@ex.com', 'aluno', 'Aluno');
    const token = await login(app, 'pp.aluno@ex.com', 'secret123');

    const patch = await request(app)
      .patch('/me/professional-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ area: 'funcional' });
    expect(patch.status).toBe(403);
    expect(patch.body.error).toBe('not_professional');

    const get = await request(app)
      .get('/me/professional-profile')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(403);
    expect(get.body.error).toBe('not_professional');
  });

  it('body vazio → 400 invalid_body; sem token → 401', async () => {
    await makeUser(pool, 'pp.empty@ex.com', 'personal', 'Vazio');
    const token = await login(app, 'pp.empty@ex.com', 'secret123');

    const patch = await request(app)
      .patch('/me/professional-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(patch.status).toBe(400);
    expect(patch.body.error).toBe('invalid_body');

    const noToken = await request(app).get('/me/professional-profile');
    expect(noToken.status).toBe(401);
  });
});
