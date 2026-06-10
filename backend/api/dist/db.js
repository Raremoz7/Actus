import pg from "pg";
const { Pool } = pg;
let _pool = null;
function getPool() {
    if (_pool)
        return _pool;
    const url = process.env.DATABASE_URL;
    if (!url)
        throw new Error("DATABASE_URL is required");
    _pool = new Pool({ connectionString: url });
    return _pool;
}
export function setPoolForTests(pool) {
    _pool = pool;
}
export async function closePool() {
    if (_pool) {
        const p = _pool;
        _pool = null;
        await p.end();
    }
}
export async function withTx(fn) {
    const client = await getPool().connect();
    try {
        await client.query("begin");
        const result = await fn(client);
        await client.query("commit");
        return result;
    }
    catch (err) {
        await client.query("rollback");
        throw err;
    }
    finally {
        client.release();
    }
}
