// Landing page (porta de entrada do sistema unificado) em react-native-web.
// Copy canônica portada da LP do projeto `web`. Full-width no desktop (fora do AppFrame).
import { ScrollView, View, Text, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Logo } from '@/components/ui';
import { useRouter } from '@/navigation';

function NeonButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.neonBtn} onPress={onPress}>
      <Text style={styles.neonBtnText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.ghostBtn} onPress={onPress}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

// Título de seção: black condensed uppercase, última parte em neon (padrão da LP).
function SectionTitle({ lead, accent }: { lead: string; accent: string }) {
  return (
    <Text style={styles.h2}>
      {lead}
      {'\n'}
      <Text style={styles.h2Accent}>{accent}</Text>
    </Text>
  );
}

const FEATURES = [
  { title: 'Treinos', body: 'Monte fichas completas com séries, repetições e descanso. Seu aluno recebe tudo direto no app.' },
  { title: 'Acompanhamento', body: 'Acompanhe cada aluno e ajuste o treino quando precisar, com tudo num só lugar.' },
  { title: 'Progresso (em breve)', body: 'Em breve: a evolução de cargas, volume e medidas para provar o resultado de cada aluno.' },
];

const CARDS = [
  { title: 'Tudo num só painel', body: 'Alunos, treinos do dia e adesão num só lugar — comece o dia sabendo quem precisa de você.' },
  { title: 'Acompanhe de perto', body: 'Check-ins e aderência de cada aluno no painel — e, em breve, a evolução de cargas e volume em gráficos.' },
  { title: 'Biblioteca com técnica', body: 'Exercícios com séries sugeridas e orientação de execução para treinar com segurança.' },
  { title: 'Planos de treino sob medida', body: 'Monte treinos e templates ajustados aos objetivos e à rotina de cada aluno.' },
];

const REVIEWS = [
  { title: 'App incrível e prático', author: 'carol.personal · 1 set 2025', text: 'Organizou completamente a minha rotina como personal. Monto os treinos dos meus alunos em minutos e acompanho os check-ins de cada um sem perder nada.' },
  { title: 'Simplesmente excelente', author: 'Amanda, aluna Actus · 14 jun 2025', text: 'Recebo meus treinos direto no celular, com vídeo de cada exercício. A interface é linda e fácil de usar. Meu personal ajusta a ficha na hora quando preciso.' },
  { title: 'Acompanhamento de perto', author: 'Rafael, personal trainer · 30 abr 2025', text: 'O que faz diferença é o acompanhamento. Vejo os check-ins e a atividade recente de cada aluno direto no painel. Ficou muito mais fácil manter a galera no ritmo.' },
];

export default function LandingScreen() {
  const router = useRouter();
  const goLogin = () => router.push('/(auth)/login');
  const goSignup = () => router.push('/(auth)/escolha-perfil');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Topbar */}
      <View style={styles.topbarWrap}>
        <View style={styles.topbar}>
          <Logo variant="horizontal" width={110} accessibilityLabel="Actus" />
          <NeonButton label="Entrar" onPress={goLogin} />
        </View>
      </View>

      {/* Hero */}
      <View style={[styles.section, styles.hero]}>
        <Text style={styles.eyebrow}>O SISTEMA POR TRÁS DO MOVIMENTO</Text>
        <Text style={styles.h1}>
          Profissionais e alunos.{'\n'}
          <Text style={styles.h1Accent}>No mesmo ritmo.</Text>
        </Text>
        <Text style={styles.lead}>
          A plataforma que conecta personal trainers e alunos em torno de treinos claros,
          acompanhamento próximo e evolução contínua.
        </Text>
        <View style={styles.heroCtas}>
          <NeonButton label="Entrar" onPress={goLogin} />
          <GhostButton label="Criar conta" onPress={goSignup} />
        </View>
        <Text style={styles.rating}>★★★★★  4.9 · 2K+ avaliações</Text>
      </View>

      {/* Feature columns */}
      <View style={[styles.section, styles.altBg]}>
        <SectionTitle lead="Tudo para orientar." accent="Em um só lugar." />
        <Text style={styles.sublead}>
          Da primeira conexão ao acompanhamento diário, sem afastar você das pessoas.
        </Text>
        <View style={styles.cols}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.col}>
              <Text style={styles.h3}>{f.title}</Text>
              <Text style={styles.body}>{f.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Feature cards */}
      <View style={styles.section}>
        <SectionTitle lead="Do convite" accent="à evolução" />
        <View style={styles.cards}>
          {CARDS.map((c) => (
            <View key={c.title} style={styles.card}>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={styles.body}>{c.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reviews */}
      <View style={[styles.section, styles.altBg]}>
        <SectionTitle lead="Feito com cuidado," accent="amado em todo lugar" />
        <View style={styles.cards}>
          {REVIEWS.map((r) => (
            <View key={r.title} style={styles.reviewCard}>
              <Text style={styles.stars}>★★★★★</Text>
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.quote}>“{r.text}”</Text>
              <Text style={styles.reviewAuthor}>{r.author}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA final */}
      <View style={[styles.section, styles.ctaSection]}>
        <Text style={styles.h2}>
          Vamos colocar mais gente{'\n'}
          <Text style={styles.h2Accent}>em movimento?</Text>
        </Text>
        <Text style={styles.sublead}>
          Conheça a Actus e descubra uma nova forma de orientar, acompanhar e evoluir.
        </Text>
        <View style={styles.heroCtas}>
          <NeonButton label="Entrar" onPress={goLogin} />
          <GhostButton label="Criar conta" onPress={goSignup} />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Logo variant="symbol" width={40} accessibilityLabel="Actus" />
        <Text style={styles.footerCopy}>© Somo / Actus 2026</Text>
      </View>
    </ScrollView>
  );
}

const CONTENT_MAX = 1080;

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  content: {
    alignItems: 'center',
  },
  topbarWrap: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: theme.colors.bgLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.outlineVariant,
  },
  topbar: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: { xs: 20, md: 40 },
    paddingVertical: 16,
  },
  section: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    paddingHorizontal: { xs: 20, md: 40 },
    paddingVertical: { xs: 56, md: 96 },
    alignItems: 'center',
  },
  altBg: {
    // seções alternadas ganham fundo mais escuro via wrapper full-bleed abaixo
    maxWidth: CONTENT_MAX,
  },
  hero: {
    paddingTop: { xs: 48, md: 88 },
  },
  eyebrow: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.typeScale.eyebrow,
    letterSpacing: 3,
    color: theme.colors.accentMuted,
    marginBottom: 20,
    textAlign: 'center',
  },
  h1: {
    fontFamily: theme.fontFamily.displayBlack,
    fontSize: { xs: 44, md: 72, lg: 88 },
    lineHeight: { xs: 46, md: 74, lg: 90 },
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  h1Accent: {
    color: theme.colors.neon,
  },
  lead: {
    fontFamily: theme.fontFamily.body,
    fontSize: { xs: 16, md: 19 },
    lineHeight: { xs: 24, md: 28 },
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 640,
    marginTop: 24,
  },
  heroCtas: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rating: {
    fontFamily: theme.fontFamily.mono,
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginTop: 20,
    letterSpacing: 1,
  },
  h2: {
    fontFamily: theme.fontFamily.displayBlack,
    fontSize: { xs: 30, md: 48 },
    lineHeight: { xs: 32, md: 50 },
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  h2Accent: {
    color: theme.colors.neon,
  },
  sublead: {
    fontFamily: theme.fontFamily.body,
    fontSize: { xs: 15, md: 17 },
    lineHeight: { xs: 23, md: 26 },
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 620,
    marginTop: 16,
  },
  cols: {
    flexDirection: { xs: 'column', md: 'row' },
    gap: 20,
    marginTop: 44,
    width: '100%',
  },
  col: {
    flex: { xs: undefined, md: 1 },
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.outlineVariant,
    padding: 24,
    gap: 10,
  },
  h3: {
    fontFamily: theme.fontFamily.displayExtraBold,
    fontSize: theme.typeScale.h3,
    color: theme.colors.neon,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: theme.fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 40,
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    flexBasis: { xs: '100%', md: '46%' },
    flexGrow: 1,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.outlineVariant,
    padding: 24,
    gap: 10,
  },
  cardTitle: {
    fontFamily: theme.fontFamily.displayExtraBold,
    fontSize: 22,
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
  },
  reviewCard: {
    flexBasis: { xs: '100%', md: '30%' },
    flexGrow: 1,
    minWidth: 240,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.outlineVariant,
    padding: 20,
    gap: 8,
  },
  stars: {
    color: theme.colors.neon,
    fontSize: 14,
    letterSpacing: 2,
  },
  quote: {
    fontFamily: theme.fontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },
  reviewAuthor: {
    fontFamily: theme.fontFamily.mono,
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  ctaSection: {
    paddingVertical: { xs: 64, md: 112 },
  },
  neonBtn: {
    backgroundColor: theme.colors.neon,
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: theme.radius.pill,
  },
  neonBtnText: {
    fontFamily: theme.fontFamily.displayExtraBold,
    fontSize: 15,
    color: theme.colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: theme.radius.pill,
  },
  ghostBtnText: {
    fontFamily: theme.fontFamily.displayExtraBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.bgLowest,
  },
  footerCopy: {
    fontFamily: theme.fontFamily.mono,
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
}));
