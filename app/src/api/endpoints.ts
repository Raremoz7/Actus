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
  invites: '/invites',
  // Validação de um código de convite antes do cadastro (passo 1). [pendente no backend]
  invitePreview: (code: string) => `/invites/${code}/preview`,
  health: '/health',
  // Templates de treino do profissional logado (GET/POST /workouts, GET/PATCH /workouts/:id).
  workouts: '/workouts',
  // Atribuição de treino a um aluno: POST /students/:student_id/workouts.
  studentWorkouts: (studentId: string) => `/students/${studentId}/workouts`,
  // Templates de dieta do nutricionista logado (GET/POST /diet-templates,
  // GET/PATCH /diet-templates/:id). requireAuth + dono nutricionista.
  dietTemplates: '/diet-templates',
  // Atribuição de dieta a um aluno: POST /students/:student_id/diets.
  studentDiets: (studentId: string) => `/students/${studentId}/diets`,
  // Desafios do profissional logado (GET/POST /professional/challenges,
  // GET/PATCH /professional/challenges/:id, .../participants, .../ranking).
  professionalChallenges: '/professional/challenges',
} as const;
