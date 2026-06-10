// Perfil profissional mínimo (PDF): nome profissional + área de atuação obrigatórios;
// CREF, tempo de experiência e Cidade/UF opcionais — [MOCK até endpoint existir].
import { useState } from 'react';
import { router } from 'expo-router';
import type { z } from 'zod';

import { Input } from '@/components/ui';
import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import {
  AREA_LABEL,
  AreaAtuacaoSchema,
  saveProfessionalProfile,
} from '@/mocks/professionalProfile';

type Area = z.infer<typeof AreaAtuacaoSchema>;
const AREAS = AreaAtuacaoSchema.options;

export default function PerfilProfissionalScreen() {
  const user = useAuthStore((s) => s.user);
  const [nome, setNome] = useState('');
  const [area, setArea] = useState<Area | null>(null);
  const [cref, setCref] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [cidade, setCidade] = useState('');
  const [nomeError, setNomeError] = useState<string | null>(null);

  async function advance() {
    if (!user) return;
    if (nome.trim().length < 2) {
      setNomeError('Informe seu nome profissional.');
      return;
    }
    if (!area) return;
    await saveProfessionalProfile(user.id, {
      nome_profissional: nome.trim(),
      area,
      cref: cref.trim() || undefined,
      experiencia_anos: experiencia.trim() || undefined,
      cidade_uf: cidade.trim() || undefined,
    });
    router.push('/onboarding-professor/forma-uso');
  }

  return (
    <OnboardingScreen
      step={2}
      total={4}
      title="Conte o básico sobre sua atuação"
      subtitle="CREF e demais dados podem ser preenchidos depois, no perfil."
      ctaLabel="Continuar"
      ctaDisabled={nome.trim().length < 2 || !area}
      onCta={() => void advance()}
    >
      <Input
        label="Nome profissional"
        value={nome}
        onChangeText={(t) => {
          if (nomeError) setNomeError(null);
          setNome(t);
        }}
        autoCapitalize="words"
        error={nomeError ?? undefined}
      />
      {AREAS.map((a) => (
        <OptionCard
          key={a}
          label={AREA_LABEL[a]}
          selected={area === a}
          onPress={() => setArea(a)}
        />
      ))}
      <Input
        label="CREF · opcional"
        value={cref}
        onChangeText={setCref}
        autoCapitalize="characters"
      />
      <Input
        label="Tempo de experiência · opcional"
        value={experiencia}
        onChangeText={setExperiencia}
      />
      <Input label="Cidade/UF · opcional" value={cidade} onChangeText={setCidade} />
    </OnboardingScreen>
  );
}
