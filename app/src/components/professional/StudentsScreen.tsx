import { useEffect, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { MagnifyingGlass, UserPlus, Users } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, ListState } from '@/components/ui';
import { useStudents } from '@/hooks/useStudents';
import type { ProfessionalRole, Student } from '@/types/professional';
import { darkTheme } from '@/theme';
import { StudentRow } from './StudentRow';
import { compareByLinkedDesc, isNewLink, linkedSinceLabel } from './studentPulse';

const { colors, motion } = darkTheme;

// Nome exibido do aluno: full_name quando existe, senão o e-mail (fallback humano).
function displayName(student: Student): string {
  const name = student.full_name?.trim();
  return name && name.length > 0 ? name : student.email;
}

// Micro-rótulo curto do papel — só aparece quando a lista mistura papéis.
const ROLE_LABEL: Record<ProfessionalRole, string> = {
  personal: 'Personal',
  nutricionista: 'Nutri',
};

// Contador no eyebrow: "1 aluno" / "N alunos".
function countLabel(n: number): string {
  return n === 1 ? '1 aluno' : `${n} alunos`;
}

// Tela compartilhada de alunos (personal + nutricionista). A lista da API não traz
// status/atividade — mostramos só identificação (nome + e-mail).
export function StudentsScreen() {
  const list = useStudents();
  const [query, setQuery] = useState('');

  // 1 momento de motion por tela: reveal de entrada (opacity + translateY, 300ms).
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Ordena por vínculo mais recente primeiro — quem entrou há pouco vem no topo.
  const students = useMemo(
    () => [...(list.data?.students ?? [])].sort(compareByLinkedDesc),
    [list.data],
  );

  // A lista mistura papéis? (personal + nutri) → mostramos o micro-rótulo por linha.
  const mixedRoles = useMemo(() => {
    const roles = new Set(students.map((s) => s.professional_role));
    return roles.size > 1;
  }, [students]);

  // Busca client-side por nome ou e-mail (case-insensitive).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return students;
    return students.filter((s) => {
      const name = (s.full_name ?? '').toLowerCase();
      return name.includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [students, query]);

  // "Agora" estável por render — base para "Desde" e selo "Novo".
  const now = useMemo(() => new Date(), []);

  // Rota criada em outro bloco (forward ref) — convite do profissional.
  function openInvite() {
    router.push('/convite' as Href);
  }

  function openStudent(id: string) {
    router.push(('/aluno/' + id) as Href);
  }

  const isEmpty = !list.isLoading && !list.isError && students.length === 0;
  const noMatches =
    !list.isLoading && !list.isError && students.length > 0 && filtered.length === 0;

  return (
    <Screen scroll padded>
      <Animated.View style={revealStyle}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="eyebrow" color="tertiary">
              {countLabel(students.length)}
            </AppText>
            <AppText variant="h2" style={styles.title}>
              Alunos
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Convidar aluno"
            onPress={openInvite}
            style={styles.inviteBtn}
          >
            <UserPlus size={22} weight="duotone" color={colors.textInverse} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={18} weight="duotone" color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou e-mail"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <View style={styles.list}>
          {filtered.map((s) => (
            <StudentRow
              key={s.id}
              name={displayName(s)}
              subtitle={s.email}
              since={linkedSinceLabel(s.linked_at)}
              roleLabel={mixedRoles ? ROLE_LABEL[s.professional_role] : null}
              isNew={isNewLink(s.linked_at, now)}
              onPress={() => openStudent(s.id)}
            />
          ))}
        </View>

        {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}

        {isEmpty ? (
          <ListState
            kind="empty"
            icon={Users}
            title="Nenhum aluno ainda"
            message="Convide alguém para começar a acompanhar o progresso"
            actionLabel="Convidar aluno"
            onAction={openInvite}
          />
        ) : null}

        {noMatches ? (
          <AppText variant="bodySm" color="tertiary" style={styles.note}>
            Nenhum aluno encontrado.
          </AppText>
        ) : null}

        {list.isError ? (
          <ListState
            kind="error"
            title="Não foi possível carregar"
            message="Verifique sua conexão e tente novamente."
            actionLabel="Tentar de novo"
            onAction={() => void list.refetch()}
          />
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {},
  inviteBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.typeScale.bodyMd,
    color: theme.colors.textPrimary,
  },
  list: {},
  note: {
    marginTop: theme.spacing.lg,
  },
}));
