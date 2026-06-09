// [DEV] Proxy CORS local — só para iterar a UI no navegador (Expo web).
//
// O backend Actus não envia headers de CORS, então o navegador bloqueia qualquer chamada
// cross-origin de localhost:8081 (Expo web) para o backend. Este proxy repassa tudo para o
// backend e injeta os headers Access-Control-*, desbloqueando o web. No celular (nativo)
// não há CORS, então nada disso é necessário lá.
//
// Uso:  node scripts/cors-proxy.mjs    (ou: npm run cors-proxy)
// Fluxo: navegador → http://localhost:8010 → este proxy → http://localhost:3000 (backend)
//
// NUNCA usar em produção: libera CORS para qualquer origem.
import http from 'node:http';

const TARGET_HOST = process.env.PROXY_TARGET_HOST ?? 'localhost';
const TARGET_PORT = Number(process.env.PROXY_TARGET_PORT ?? 3000);
const PORT = Number(process.env.PROXY_PORT ?? 8010);

// Allowlist explícita das origens do Expo web (não refletir origem arbitrária com
// credenciais). Sobrescrevível via PROXY_ALLOWED_ORIGINS (lista separada por vírgula).
const DEFAULT_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:19006',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://127.0.0.1:19006',
];
const ALLOWED_ORIGINS = new Set(
  (process.env.PROXY_ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean)) ??
    DEFAULT_ORIGINS,
);

const server = http.createServer((req, res) => {
  // CORS só para origens conhecidas do dev server (com credenciais). Origem desconhecida
  // recebe 'null' → o navegador bloqueia, como deve.
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ?? 'Content-Type,Authorization',
  );

  // Preflight: responde na hora, sem repassar ao backend.
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const proxyReq = http.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` },
    },
    (proxyRes) => {
      // setHeader (CORS) tem precedência; o backend não manda Access-Control-*, então sobrevivem.
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'proxy_error', detail: String(err) }));
  });

  req.pipe(proxyReq);
});

// Bind só em loopback: o proxy é dev-only e não deve ficar exposto na rede.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[cors-proxy] http://127.0.0.1:${PORT} -> http://${TARGET_HOST}:${TARGET_PORT}`);
});
