// Perfil profissional do professor (onboarding — TEC-8). [endpoint REAL]
// PATCH /me/professional-profile grava nome profissional + área (obrigatórios no fluxo),
// CREF/experiência/Cidade-UF (opcionais) e a intenção de uso. nome_profissional vira
// profiles.display_name no backend; o resto, colunas de professional_info. Schemas e
// labels ficam aqui (consumidos pelas telas de onboarding).
import { z } from 'zod';

import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export const AreaAtuacaoSchema = z.enum([
  'musculacao',
  'condicionamento',
  'emagrecimento',
  'hipertrofia',
  'reabilitacao',
  'funcional',
  'corrida',
  'outro',
]);
export const FormaUsoSchema = z.enum([
  'organizar',
  'prescrever',
  'acompanhar',
  'convidar',
  'testar',
]);

export const ProfessionalProfileSchema = z.object({
  nome_profissional: z.string().min(2).max(120).optional(),
  area: AreaAtuacaoSchema.optional(),
  cref: z.string().max(40).optional(),
  experiencia_anos: z.string().max(20).optional(),
  cidade_uf: z.string().max(80).optional(),
  forma_uso: FormaUsoSchema.optional(),
});
export type ProfessionalProfile = z.infer<typeof ProfessionalProfileSchema>;

// Grava (parcial) o perfil profissional do usuário logado. O backend identifica o
// profissional pelo token; PATCH parcial faz upsert dos campos enviados.
export async function saveProfessionalProfile(partial: ProfessionalProfile): Promise<void> {
  const body = ProfessionalProfileSchema.parse(partial);
  await api.patch(endpoints.me.professionalProfile, body);
}

export const AREA_LABEL: Record<z.infer<typeof AreaAtuacaoSchema>, string> = {
  musculacao: 'Musculação',
  condicionamento: 'Condicionamento físico',
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  reabilitacao: 'Reabilitação / retorno ao treino',
  funcional: 'Funcional',
  corrida: 'Corrida',
  outro: 'Outro',
};
export const FORMA_USO_LABEL: Record<z.infer<typeof FormaUsoSchema>, string> = {
  organizar: 'Organizar meus alunos',
  prescrever: 'Prescrever treinos',
  acompanhar: 'Acompanhar evolução',
  convidar: 'Convidar alunos',
  testar: 'Testar o app primeiro',
};
