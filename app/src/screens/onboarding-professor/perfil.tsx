// Perfil profissional mínimo (PDF): nome profissional + área de atuação obrigatórios;
// CREF, tempo de experiência e Cidade/UF opcionais — [MOCK até endpoint existir].
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from '@/navigation';
import { CaretDown, CaretUp, Check } from 'phosphor-react-native';
import type { z } from 'zod';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Input } from '@/components/ui';
import { OnboardingScreen } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { darkTheme } from '@/theme';
import {
  AREA_LABEL,
  AreaAtuacaoSchema,
  saveProfessionalProfile,
} from '@/api/professionalProfile';

const { colors } = darkTheme;

type Area = z.infer<typeof AreaAtuacaoSchema>;
const AREAS = AreaAtuacaoSchema.options;

function AreaSelect({
  value,
  onChange,
  invalid = false,
}: {
  value: Area | null;
  onChange: (v: Area) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Selecionar área de atuação"
        accessibilityState={{ expanded: open }}
        aria-invalid={invalid || undefined}
        onPress={() => setOpen((v) => !v)}
        style={[styles.trigger, open && styles.triggerOpen, invalid && !open && styles.triggerInvalid]}
      >
        <View style={styles.triggerContent}>
          <AppText variant="metaSmall" color="tertiary" style={styles.triggerLabel}>
            Área de atuação
          </AppText>
          <AppText variant="bodyLg" color={value ? 'primary' : 'tertiary'}>
            {value ? AREA_LABEL[value] : 'Selecionar…'}
          </AppText>
        </View>
        {open ? (
          <CaretUp size={18} weight="bold" color={colors.textTertiary} />
        ) : (
          <CaretDown size={18} weight="bold" color={colors.textTertiary} />
        )}
      </Pressable>

      {open && (
        <View style={styles.dropdown}>
          {AREAS.map((a) => {
            const selected = value === a;
            return (
              <Pressable
                key={a}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(a);
                  setOpen(false);
                }}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <AppText
                  variant="bodyMd"
                  color={selected ? 'neon' : 'primary'}
                  style={styles.optionText}
                >
                  {AREA_LABEL[a]}
                </AppText>
                {selected ? (
                  <Check size={16} weight="bold" color={colors.neon} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function PerfilProfissionalScreen() {
  const user = useAuthStore((s) => s.user);
  const [nome, setNome] = useState('');
  const [area, setArea] = useState<Area | null>(null);
  const [cref, setCref] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [cidade, setCidade] = useState('');
  const [nomeError, setNomeError] = useState<string | null>(null);
  const [areaError, setAreaError] = useState(false);

  const nomeValido = nome.trim().length >= 2;

  // Marca os campos obrigatórios pendentes ao tentar avançar sem preencher. (TEC-74)
  function markInvalidFields() {
    setNomeError(nomeValido ? null : 'Informe seu nome profissional.');
    setAreaError(area === null);
  }

  async function advance() {
    if (!user) return;
    if (!nomeValido) {
      setNomeError('Informe seu nome profissional.');
      return;
    }
    if (!area) return;
    // Baixa fricção: persiste o perfil, mas não trava o onboarding se a rede falhar.
    try {
      await saveProfessionalProfile({
        nome_profissional: nome.trim(),
        area,
        cref: cref.trim() || undefined,
        experiencia_anos: experiencia.trim() || undefined,
        cidade_uf: cidade.trim() || undefined,
      });
    } catch {
      // Segue o fluxo; o perfil pode ser completado depois.
    }
    router.push('/onboarding-professor/forma-uso');
  }

  return (
    <OnboardingScreen
      step={2}
      total={4}
      title="Conte o básico sobre sua atuação"
      subtitle="CREF e demais dados podem ser preenchidos depois, no perfil."
      ctaLabel="Continuar"
      canAdvance={nomeValido && area !== null}
      onInvalidAttempt={markInvalidFields}
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
      <AreaSelect
        value={area}
        onChange={(v) => {
          setAreaError(false);
          setArea(v);
        }}
        invalid={areaError}
      />
      {areaError ? (
        <AppText variant="bodySm" color="error">
          Selecione sua área de atuação.
        </AppText>
      ) : null}
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

const styles = StyleSheet.create((theme) => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 56,
  },
  triggerOpen: {
    borderColor: theme.colors.neon,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerInvalid: {
    borderColor: theme.colors.error,
  },
  triggerContent: { flex: 1, gap: 2 },
  triggerLabel: { marginBottom: 1 },
  dropdown: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.colors.neon,
    borderBottomLeftRadius: theme.radius.card,
    borderBottomRightRadius: theme.radius.card,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  optionSelected: {
    backgroundColor: theme.colors.surface3,
  },
  optionText: { flex: 1 },
}));
