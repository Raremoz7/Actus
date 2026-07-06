// [MOCK — sem endpoint na API v1] Insights do dashboard gerencial (faixa etária, objetivo,
// distribuição por sexo, ocupação, modalidades, inadimplência, aniversariantes). A API hoje só
// agrega os KPIs e o ranking de instrutores em GET /academy/dashboard (ver useAcademy.ts) — o
// resto exigiria colunas/tabelas que não existem ainda (sexo, objetivo, faixa etária, check-in
// por catraca, cobrança). Trocar por hooks reais quando os endpoints existirem.

export const mockAgeBuckets = [
  { label: '18–24', value: 42 },
  { label: '25–34', value: 88 },
  { label: '35–44', value: 61 },
  { label: '45–54', value: 34 },
  { label: '55+', value: 23 },
];

export const mockGoals = [
  { label: 'Hipertrofia', value: 76, color: 'var(--color-data-1)' },
  { label: 'Emagrecimento', value: 94, color: 'var(--color-data-2)' },
  { label: 'Condicionamento', value: 41, color: 'var(--color-data-3)' },
  { label: 'Saúde', value: 25, color: 'var(--color-data-4)' },
  { label: 'Reabilitação', value: 12, color: 'var(--color-data-5)' },
];

export const mockWeeklyFrequencyTotals = [
  { label: '1×', value: 22 },
  { label: '2×', value: 48 },
  { label: '3×', value: 71 },
  { label: '4×', value: 53 },
  { label: '5×', value: 31 },
  { label: '6×', value: 15 },
  { label: '7×', value: 8 },
];

export const mockWeekdayBySex = {
  xLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  masc: [61, 54, 58, 49, 63, 38, 12],
  fem: [72, 66, 69, 58, 55, 47, 18],
};

export const weekdayFullLabels = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

export const mockMonthlyCheckIns = {
  xLabels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
  values: [2180, 2540, 3010, 3260, 3540, 3810, 3960, 3890],
  peakIndex: 6,
};

export const mockOccupancy = { current: 138, capacity: 245 };

export const mockModalities = [
  { label: 'Musculação', value: 182, color: 'var(--color-data-2)' },
  { label: 'Funcional', value: 96, color: 'var(--color-data-4)' },
  { label: 'Crossfit', value: 74, color: 'var(--color-data-3)' },
  { label: 'Yoga', value: 61, color: 'var(--color-data-5)' },
  { label: 'Pilates', value: 53, color: 'var(--color-data-6)' },
  { label: 'Spinning', value: 44, color: 'var(--color-data-1)' },
  { label: 'Boxe', value: 38, color: 'var(--color-data-4)' },
  { label: 'Natação', value: 29, color: 'var(--color-data-2)' },
  { label: 'Corrida', value: 22, color: 'var(--color-data-3)' },
];

export const mockAdherenceByGoal = [
  { label: 'Hipertrofia', pct: 78, color: 'var(--color-data-1)' },
  { label: 'Emagrecimento', pct: 64, color: 'var(--color-data-2)' },
  { label: 'Condicionamento', pct: 71, color: 'var(--color-data-3)' },
  { label: 'Saúde', pct: 82, color: 'var(--color-data-4)' },
  { label: 'Reabilitação', pct: 59, color: 'var(--color-data-5)' },
];

export const mockOverdueStudents = [
  { name: 'Ricardo Campos', dueDate: '05/06', daysOverdue: 27, amountCents: 22000 },
  { name: 'Letícia Moraes', dueDate: '10/06', daysOverdue: 22, amountCents: 18000 },
  { name: 'Fábio Tavares', dueDate: '15/06', daysOverdue: 17, amountCents: 35000 },
  { name: 'Aline Santos', dueDate: '20/06', daysOverdue: 12, amountCents: 22000 },
  { name: 'Paulo Guedes', dueDate: '25/06', daysOverdue: 7, amountCents: 94000 },
];

export const mockUpcomingBirthdaysStudents = [
  { name: 'Beatriz Aluna', turningAge: 27, when: 'Hoje' },
  { name: 'Carlos Aluno', turningAge: 31, when: 'Amanhã' },
  { name: 'Gabriela Souza', turningAge: 24, when: 'Qui, 04/07' },
  { name: 'Marcos Oliveira', turningAge: 39, when: 'Sáb, 06/07' },
];

export const mockUpcomingBirthdaysStaff = [
  { name: 'Carla Coach', role: 'Personal trainer', when: 'Sex, 05/07' },
  { name: 'Diego Fit', role: 'Personal trainer', when: 'Dom, 07/07' },
];

// [TEC-79] Escala determinística dos mocks por unidade selecionada, para o filtro de unidade
// mudar visivelmente os cards de "Prévia" sem backend por unidade. scope=null => consolidado (1.0).
export function scopeFactor(scope: string | null): number {
  if (!scope) return 1;
  let h = 0;
  for (let i = 0; i < scope.length; i++) h = (h * 31 + scope.charCodeAt(i)) >>> 0;
  return 0.55 + (h % 41) / 100; // 0.55 .. 0.95, estável por id
}

export function scaleColumns<T extends { value: number }>(rows: T[], f: number): T[] {
  return rows.map((r) => ({ ...r, value: Math.round(r.value * f) }));
}
