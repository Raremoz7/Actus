// Paths da API (sem /api, sem /v1 — base URL já é a raiz do backend).
// Os paths de /auth NÃO recebem Bearer no request interceptor (register, login, refresh).
export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
  },
  me: {
    root: '/me',
    workouts: '/me/workouts',
    checkIns: '/me/check-ins',
    diets: '/me/diets',
    weeklyOverview: '/me/weekly-overview',
    challenges: '/me/challenges',
  },
  professional: {
    students: '/professional/students',
    studentCheckIns: (studentId: string) =>
      `/professional/students/${studentId}/check-ins`,
  },
  health: '/health',
} as const;
