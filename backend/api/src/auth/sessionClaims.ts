import type pg from "pg";

export type SessionClaims = {
  roles: string[];
  must_change_password: boolean;
};

export async function loadSessionClaims(client: pg.PoolClient, userId: string): Promise<SessionClaims> {
  const u = await client.query<{ must_change_password: boolean }>(
    `select must_change_password from public.app_users where id = $1`,
    [userId],
  );
  const must_change_password = u.rows[0]?.must_change_password ?? false;

  const r = await client.query<{ role: string }>(`select role from public.app_user_roles where user_id = $1`, [userId]);
  const staffRoles = r.rows.map((x) => x.role);

  // Papéis de app (personal / nutricionista / aluno) vivem em profiles.tipo; app_user_roles só cobre staff.
  // Sem isso, o JWT vinha com roles=[] e o cliente costumava assumir "personal" por padrão.
  let roles: string[];
  if (staffRoles.length > 0) {
    roles = staffRoles;
  } else {
    const p = await client.query<{ tipo: string }>(
      `select tipo::text as tipo from public.profiles where id = $1`,
      [userId],
    );
    const tipo = p.rows[0]?.tipo;
    roles = tipo != null ? [tipo] : ["aluno"];
  }

  return { roles, must_change_password };
}
