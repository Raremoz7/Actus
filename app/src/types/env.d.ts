// Vars de ambiente inlined em build time (babel transform-inline-environment-variables).
// Os nomes EXPO_PUBLIC_* foram mantidos na migração para RN bare para não tocar
// nos call sites (vêm do .env — ver babel.config.js).
declare const process: {
  env: {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_API_BASE_URL_WEB?: string;
    EXPO_PUBLIC_DEV_BYPASS_AUTH?: string;
    EXPO_PUBLIC_DEV_TIPO?: string;
    NODE_ENV?: string;
  };
};
