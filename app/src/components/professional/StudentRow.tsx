import { Pressable, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { ParqStatusBadge } from '@/components/parq';
import type { ParqStatus } from '@/lib/parq';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  name: string;
  // Subtítulo mono (e-mail do aluno) — a API não fornece status/atividade.
  subtitle: string;
  // "Desde DD/MM" (vínculo) — linha discreta abaixo do nome. Opcional.
  since?: string | null;
  // Micro-rótulo do papel (Personal / Nutri) — só quando a lista mistura papéis.
  roleLabel?: string | null;
  // Selo "Novo" para vínculos recentes.
  isNew?: boolean;
  // Status do Par-Q do aluno (opcional). 'clear' não renderiza selo.
  parqStatus?: ParqStatus;
  onPress: () => void;
};

// Iniciais do nome para o avatar: 1ª letra dos dois primeiros tokens.
// Cai para '·' quando o nome está vazio.
export function studentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

// Linha-pulso do aluno: avatar com INICIAIS reais + nome + e-mail mono + "Desde DD/MM".
// Quando a lista mistura papéis, mostra um micro-rótulo (Personal/Nutri). Vínculos
// recentes ganham o selo "Novo". Sem ponto de status — a lista não traz atividade.
export function StudentRow({ name, subtitle, since, roleLabel, isNew, parqStatus, onPress }: Props) {
  const initials = studentInitials(name);
  const a11y = roleLabel ? `${name}, ${roleLabel}` : name;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.avatar}>
        <AppText variant="label" color="neon">
          {initials}
        </AppText>
      </View>
      <View style={styles.text}>
        <View style={styles.nameLine}>
          <AppText variant="bodyMd" numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          {isNew ? (
            <View style={styles.newBadge}>
              <AppText variant="eyebrow" color="inverse">
                Novo
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="metaSmall" color="tertiary" numberOfLines={1}>
          {subtitle}
        </AppText>
        {since || roleLabel ? (
          <View style={styles.metaLine}>
            {roleLabel ? (
              <AppText variant="eyebrow" color="secondary">
                {roleLabel}
              </AppText>
            ) : null}
            {since && roleLabel ? (
              <AppText variant="eyebrow" color="tertiary">
                ·
              </AppText>
            ) : null}
            {since ? (
              <AppText variant="eyebrow" color="tertiary">
                {since}
              </AppText>
            ) : null}
          </View>
        ) : null}
        {parqStatus ? <ParqStatusBadge status={parqStatus} /> : null}
      </View>
      <CaretRight size={16} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    flexShrink: 1,
  },
  newBadge: {
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.tag,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: 2,
  },
}));
