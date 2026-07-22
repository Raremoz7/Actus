// Babel do RN bare. ATENÇÃO à ordem dos plugins: o do worklets (Reanimated 4)
// precisa ser o ÚLTIMO — plugin duplicado/faltando é o erro de build mais comum
// (o babel-preset-expo fazia isso sozinho; aqui é explícito).
const fs = require('fs');
const path = require('path');

// Carrega .env para o process.env do worker do Metro — as EXPO_PUBLIC_* são
// inlined em build time pelo transform-inline-environment-variables (mesmo
// comportamento que o babel-preset-expo tinha). Nomes mantidos para não tocar
// nos call sites.
function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
}
loadDotEnv();

module.exports = function (api) {
  api.cache(false); // .env pode mudar entre builds
  return {
    presets: ['@react-native/babel-preset'],
    plugins: [
      // Alias '@/x' → 'src/x' (no Expo isso era resolvido pelo Metro; no bare é babel).
      ['module-resolver', { root: ['.'], alias: { '@': './src' } }],
      [
        'transform-inline-environment-variables',
        {
          include: [
            'EXPO_PUBLIC_API_BASE_URL',
            'EXPO_PUBLIC_API_BASE_URL_WEB',
            'EXPO_PUBLIC_DEV_BYPASS_AUTH',
            'EXPO_PUBLIC_DEV_TIPO',
          ],
        },
      ],
      ['react-native-unistyles/plugin', { root: 'src' }],
      'react-native-worklets/plugin',
    ],
  };
};
