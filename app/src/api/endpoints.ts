// Paths da API (sem /api, sem /v1 — base URL já é a raiz do backend).
// Os paths de /auth NÃO recebem Bearer no request interceptor (register, login, refresh).
export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    // Auto-cadastro de professor (personal).
    registerProfessional: '/auth/register-professional',
  },
  me: {
    root: '/me',
    // Perfil rico (read-back) — destrava o pré-preenchimento de editar-perfil.
    profile: '/me/profile',
    // Upload de avatar (multipart) → seta avatar_url.
    avatar: '/me/avatar',
    workouts: '/me/workouts',
    checkIns: '/me/check-ins',
    diets: '/me/diets',
    weeklyOverview: '/me/gamification/weekly-overview',
    challenges: '/me/challenges',
    badges: '/me/badges',
    badgesUnseen: '/me/badges/unseen',
    badgesSeen: '/me/badges/seen',
    deviceTokens: '/me/device-tokens',
  },
  professional: {
    students: '/professional/students',
    studentCheckIns: (studentId: string) =>
      `/professional/students/${studentId}/check-ins`,
  },
  invites: '/invites',
  // Validação de um código de convite antes do cadastro (passo 1).
  invitePreview: (code: string) => `/invites/${code}/preview`,
  // Aluno logado consome convite para vincular novo profissional (endpoint REAL).
  invitesConsume: '/invites/consume',
  health: '/health',
  // Templates de treino do profissional logado (GET/POST /workouts, GET/PATCH /workouts/:id).
  workouts: '/workouts',
  // Banco de Treinos curado (templates do admin, lidos por todos os autenticados):
  // GET /workout-templates (lista), GET /workout-templates/:id (detalhe),
  // POST /workout-templates/:id/copy (personal clona p/ sua biblioteca → workout_id).
  workoutTemplates: '/workout-templates',
  workoutTemplateById: (id: string) => `/workout-templates/${id}`,
  workoutTemplateCopy: (id: string) => `/workout-templates/${id}/copy`,
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
  // Par-Q (questionário de prontidão). Aluno envia o próprio e lê em /me/par-q;
  // profissional vinculado lê por aluno ou em massa (status da lista). [endpoint REAL]
  parq: {
    me: '/me/par-q',
    student: (studentId: string) => `/students/${studentId}/par-q`,
    professionalStudent: (studentId: string) => `/professional/students/${studentId}/par-q`,
    professionalStatuses: '/professional/students/par-q',
  },
} as const;
