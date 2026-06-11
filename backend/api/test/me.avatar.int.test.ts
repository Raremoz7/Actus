// [ACTUS-NEW] testes do upload de avatar (POST /me/avatar).
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { createApp } from '../src/app.js';
import { closePool, setPoolForTests } from '../src/db.js';
import { createInMemoryPg, minimalSchemaSql } from './helpers/testDb.js';

// 1x1 PNG (bytes válidos) para o upload.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

describe('POST /me/avatar', () => {
  let pool: any;
  let app: any;
  let uploadDir: string;

  beforeAll(async () => {
    uploadDir = path.join(os.tmpdir(), `actus-avatar-${crypto.randomUUID()}`);
    process.env.AVATAR_UPLOAD_DIR = uploadDir; // lido por avatarUploadDir() no mount/request
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
    await fs.rm(uploadDir, { recursive: true, force: true });
  });

  async function seedUser(email: string, tipo: string): Promise<string> {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash('pass12345', 12);
    await pool.query(`insert into public.app_users (id, email, password_hash) values ($1, $2, $3)`, [id, email, hash]);
    await pool.query(`insert into public.profiles (id, tipo, display_name) values ($1, $2::public.user_role, 'U')`, [id, tipo]);
    return id;
  }
  async function token(email: string): Promise<string> {
    const r = await request(app).post('/auth/login').send({ email, password: 'pass12345' });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    return r.body.access_token as string;
  }

  it('aceita imagem, grava em disco, seta profiles.avatar_url e serve o arquivo', async () => {
    const id = await seedUser('avatar1@ex.com', 'personal');
    const t = await token('avatar1@ex.com');

    const res = await request(app)
      .post('/me/avatar')
      .set('Authorization', `Bearer ${t}`)
      .attach('avatar', PNG_1X1, { filename: 'foto.png', contentType: 'image/png' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.avatar_url).toMatch(/\/uploads\/.+\.png$/);

    // profiles.avatar_url atualizado.
    const row = await pool.query(`select avatar_url from public.profiles where id = $1`, [id]);
    expect(row.rows[0].avatar_url).toBe(res.body.avatar_url);

    // arquivo existe e é servido estaticamente.
    const filename = res.body.avatar_url.split('/uploads/')[1];
    await expect(fs.stat(path.join(uploadDir, filename))).resolves.toBeTruthy();
    const served = await request(app).get(`/uploads/${filename}`);
    expect(served.status).toBe(200);
  });

  it('rejeita tipo não-imagem → 400 invalid_image', async () => {
    await seedUser('avatar2@ex.com', 'aluno');
    const t = await token('avatar2@ex.com');
    const res = await request(app)
      .post('/me/avatar')
      .set('Authorization', `Bearer ${t}`)
      .attach('avatar', Buffer.from('not an image'), { filename: 'x.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_image');
  });

  it('sem arquivo → 400 invalid_image', async () => {
    await seedUser('avatar3@ex.com', 'aluno');
    const t = await token('avatar3@ex.com');
    const res = await request(app).post('/me/avatar').set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(400);
  });

  it('sem token → 401', async () => {
    const res = await request(app)
      .post('/me/avatar')
      .attach('avatar', PNG_1X1, { filename: 'foto.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });
});
