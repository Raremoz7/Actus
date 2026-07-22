// Árvore de navegação do app — substitui os _layout.tsx do expo-router.
// Cada "área" (antigo grupo) vira um stack aninhado com o MESMO guard que o
// layout original tinha; as tabs usam a ActusTabBar existente (ela já recebe
// BottomTabBarProps do React Navigation).
import { useEffect } from 'react';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  HouseIcon,
  BarbellIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  ForkKnifeIcon,
} from 'phosphor-react-native';

import { ActusTabBar, type TabSpec } from '@/components/navigation/ActusTabBar';
import { UnseenBadgeWatcher } from '@/components/gamification/UnseenBadgeWatcher';
import { useRegisterPushToken } from '@/hooks/useRegisterPushToken';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEV_BYPASS_AUTH } from '@/lib/devAuth';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';
import { authedDestination } from '@/lib/onboardingRoutes';
import { darkTheme } from '@/theme';
import { Redirect } from './router';
import { AREAS } from './routes';

// Telas de auth
import EscolhaPerfilScreen from '@/screens/auth/escolha-perfil';
import LoginScreen from '@/screens/auth/login';
import CadastroProScreen from '@/screens/auth/cadastro-pro';
import CadastroScreen from '@/screens/auth/cadastro/index';
import TrocarSenhaScreen from '@/screens/auth/trocar-senha';

// Telas do aluno
import AlunoHojeScreen from '@/screens/aluno/tabs/index';
import AlunoTreinosScreen from '@/screens/aluno/tabs/treinos';
import AlunoDesafiosScreen from '@/screens/aluno/tabs/desafios';
import AlunoPerfilScreen from '@/screens/aluno/tabs/perfil';
import AlimentacaoScreen from '@/screens/aluno/alimentacao';
import BadgesScreen from '@/screens/aluno/badges';
import DesafioScreen from '@/screens/aluno/desafio/[id]';
import DietaScreen from '@/screens/aluno/dieta/[id]';
import ExercicioScreen from '@/screens/aluno/exercicio/[id]';
import ParQScreen from '@/screens/aluno/par-q';
import SessaoScreen from '@/screens/aluno/sessao/[id]';
import TreinoScreen from '@/screens/aluno/treino/[id]';

// Telas do personal
import PersonalInicioScreen from '@/screens/personal/tabs/inicio';
import PersonalAlunosScreen from '@/screens/personal/tabs/alunos';
import PersonalTreinosScreen from '@/screens/personal/tabs/treinos';
import PersonalDesafiosScreen from '@/screens/personal/tabs/desafios';
import PersonalPerfilScreen from '@/screens/personal/tabs/perfil';

// Telas do nutri
import NutriInicioScreen from '@/screens/nutri/tabs/inicio';
import NutriAlunosScreen from '@/screens/nutri/tabs/alunos';
import NutriDietasScreen from '@/screens/nutri/tabs/dietas';
import NutriPerfilScreen from '@/screens/nutri/tabs/perfil';

// Onboardings
import ObAlunoFotoScreen from '@/screens/onboarding-aluno/foto';
import ObAlunoInteresseScreen from '@/screens/onboarding-aluno/interesse';
import ObAlunoExperienciaScreen from '@/screens/onboarding-aluno/experiencia';
import ObAlunoFrequenciaScreen from '@/screens/onboarding-aluno/frequencia';
import ObAlunoLocalScreen from '@/screens/onboarding-aluno/local';
import ObAlunoVinculoScreen from '@/screens/onboarding-aluno/vinculo';
import ObAlunoCorpoScreen from '@/screens/onboarding-aluno/corpo';
import ObAlunoParQScreen from '@/screens/onboarding-aluno/par-q';
import ObProfFotoScreen from '@/screens/onboarding-professor/foto';
import ObProfPerfilScreen from '@/screens/onboarding-professor/perfil';
import ObProfFormaUsoScreen from '@/screens/onboarding-professor/forma-uso';
import ObProfConviteScreen from '@/screens/onboarding-professor/convite';

// Telas soltas da raiz
import SplashScreenRoute from '@/screens/splash';
import LandingScreen from '@/screens/landing';
import { withAppFrame } from '@/components/layout/AppFrame';
import AlunoDetailScreen from '@/screens/shared/aluno/[id]';
import AtribuirDietaScreen from '@/screens/shared/atribuir-dieta';
import AtribuirTreinoScreen from '@/screens/shared/atribuir-treino';
import BancoTreinoScreen from '@/screens/shared/banco-treino/[id]';
import ConviteScreen from '@/screens/shared/convite/index';
import ConviteNovoScreen from '@/screens/shared/convite/novo';
import CriarDesafioScreen from '@/screens/shared/criar-desafio';
import DesafioProScreen from '@/screens/shared/desafio-pro/[id]';
import EditarPerfilScreen from '@/screens/shared/editar-perfil';
import MontarDietaScreen from '@/screens/shared/montar-dieta';
import MontarTreinoScreen from '@/screens/shared/montar-treino';
import RegisterScreen from '@/screens/shared/register';
import UsarConviteScreen from '@/screens/shared/usar-convite';
import DevHealthScreen from '@/screens/shared/_dev/health';
import NotFoundScreen from '@/screens/not-found';

// bgLowest do design — exceção legítima a hex hardcoded (contentStyle nativo do Stack).
export const STACK_BG = '#10252D';

const SLIDE: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: 300,
  contentStyle: { backgroundColor: STACK_BG },
};

// ───────────────────────────── Auth ─────────────────────────────

const AuthStack = createNativeStackNavigator();

// Usuário já autenticado é mandado direto ao destino do seu tipo, passando pelo
// MESMO gate de onboarding do dispatcher (splash) — comportamento do layout (auth). (TEC-72)
function AuthArea() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const obHydrated = useOnboardingStore((s) => s.hydrated);
  const obHydrate = useOnboardingStore((s) => s.hydrate);
  const isOnboardingDone = useOnboardingStore((s) => s.isDone);

  // [DEV — bypass de auth] Com a flag ligada, as telas de auth ficam navegáveis.
  const shouldRedirect =
    !DEV_BYPASS_AUTH &&
    status === 'authenticated' &&
    !!user &&
    homeForTipo(user.tipo) !== AUTH_ENTRY;

  useEffect(() => {
    if (shouldRedirect && !obHydrated) void obHydrate();
  }, [shouldRedirect, obHydrated, obHydrate]);

  if (shouldRedirect) {
    if (!obHydrated) return null;
    if (user) return <Redirect href={authedDestination(user, isOnboardingDone)} />;
  }

  return (
    <AuthStack.Navigator screenOptions={SLIDE}>
      <AuthStack.Screen name="EscolhaPerfil" component={EscolhaPerfilScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="CadastroPro" component={CadastroProScreen} />
      <AuthStack.Screen
        name="Cadastro"
        component={CadastroScreen}
        options={{ contentStyle: { backgroundColor: darkTheme.colors.bgBase } }}
      />
      {/* Gate de senha provisória: sem voltar (sem gesture). Só sai trocando a senha. */}
      <AuthStack.Screen name="TrocarSenha" component={TrocarSenhaScreen} options={{ gestureEnabled: false }} />
    </AuthStack.Navigator>
  );
}

// ───────────────────────────── Aluno ─────────────────────────────

const ALUNO_TABS: readonly TabSpec[] = [
  { name: 'index', label: 'HOJE', renderIcon: (color, size) => <HouseIcon size={size} color={color} weight="duotone" /> },
  { name: 'treinos', label: 'TREINOS', renderIcon: (color, size) => <BarbellIcon size={size} color={color} weight="duotone" /> },
  { name: 'desafios', label: 'DESAFIOS', renderIcon: (color, size) => <TrophyIcon size={size} color={color} weight="duotone" /> },
  { name: 'perfil', label: 'PERFIL', renderIcon: (color, size) => <UserIcon size={size} color={color} weight="duotone" /> },
];

const AlunoTabs = createBottomTabNavigator();

function AlunoTabsNavigator() {
  return (
    <AlunoTabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={ALUNO_TABS} />}
    >
      <AlunoTabs.Screen name="index" component={AlunoHojeScreen} />
      <AlunoTabs.Screen name="treinos" component={AlunoTreinosScreen} />
      <AlunoTabs.Screen name="desafios" component={AlunoDesafiosScreen} />
      <AlunoTabs.Screen name="perfil" component={AlunoPerfilScreen} />
    </AlunoTabs.Navigator>
  );
}

const AlunoStack = createNativeStackNavigator();

// Guard de papel: só aluno autenticado entra (destinos INEQUÍVOCOS — nunca '/').
function AlunoArea() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // Registra o push token ao autenticar e trata o tap da notificação de conquista.
  // Antes de qualquer early-return para manter a ordem dos hooks estável.
  useRegisterPushToken();

  if (!DEV_BYPASS_AUTH) {
    if (status !== 'authenticated' || !user) return <Redirect href={AUTH_ENTRY} />;
    if (user.tipo !== 'aluno') return <Redirect href={homeForTipo(user.tipo)} />;
  }

  // O watcher fica AO LADO do stack para flutuar sobre as tabs (banner absoluto).
  return (
    <>
      <AlunoStack.Navigator screenOptions={SLIDE}>
        <AlunoStack.Screen name="Tabs" component={AlunoTabsNavigator} />
        <AlunoStack.Screen name="Alimentacao" component={AlimentacaoScreen} />
        <AlunoStack.Screen name="Badges" component={BadgesScreen} />
        <AlunoStack.Screen name="Desafio" component={DesafioScreen} />
        <AlunoStack.Screen name="Dieta" component={DietaScreen} />
        <AlunoStack.Screen name="Exercicio" component={ExercicioScreen} />
        <AlunoStack.Screen name="ParQ" component={ParQScreen} />
        <AlunoStack.Screen name="Sessao" component={SessaoScreen} />
        <AlunoStack.Screen name="Treino" component={TreinoScreen} />
      </AlunoStack.Navigator>
      <UnseenBadgeWatcher />
    </>
  );
}

// ─────────────────────────── Personal ───────────────────────────

const PERSONAL_TABS: readonly TabSpec[] = [
  { name: 'inicio', label: 'INÍCIO', renderIcon: (color, size) => <HouseIcon size={size} color={color} weight="duotone" /> },
  { name: 'alunos', label: 'ALUNOS', renderIcon: (color, size) => <UsersIcon size={size} color={color} weight="duotone" /> },
  { name: 'treinos', label: 'TREINOS', renderIcon: (color, size) => <BarbellIcon size={size} color={color} weight="duotone" /> },
  { name: 'desafios', label: 'DESAFIOS', renderIcon: (color, size) => <TrophyIcon size={size} color={color} weight="duotone" /> },
  { name: 'perfil', label: 'PERFIL', renderIcon: (color, size) => <UserIcon size={size} color={color} weight="duotone" /> },
];

const PersonalTabs = createBottomTabNavigator();

function PersonalTabsNavigator() {
  return (
    <PersonalTabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={PERSONAL_TABS} />}
    >
      <PersonalTabs.Screen name="inicio" component={PersonalInicioScreen} />
      <PersonalTabs.Screen name="alunos" component={PersonalAlunosScreen} />
      <PersonalTabs.Screen name="treinos" component={PersonalTreinosScreen} />
      <PersonalTabs.Screen name="desafios" component={PersonalDesafiosScreen} />
      <PersonalTabs.Screen name="perfil" component={PersonalPerfilScreen} />
    </PersonalTabs.Navigator>
  );
}

const PersonalStack = createNativeStackNavigator();

function PersonalArea() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (!DEV_BYPASS_AUTH) {
    if (status !== 'authenticated' || !user) return <Redirect href={AUTH_ENTRY} />;
    if (user.tipo !== 'personal') return <Redirect href={homeForTipo(user.tipo)} />;
  }

  return (
    <PersonalStack.Navigator screenOptions={SLIDE}>
      <PersonalStack.Screen name="Tabs" component={PersonalTabsNavigator} />
    </PersonalStack.Navigator>
  );
}

// ───────────────────────────── Nutri ─────────────────────────────

const NUTRI_TABS: readonly TabSpec[] = [
  { name: 'inicio', label: 'INÍCIO', renderIcon: (color, size) => <HouseIcon size={size} color={color} weight="duotone" /> },
  { name: 'alunos', label: 'ALUNOS', renderIcon: (color, size) => <UsersIcon size={size} color={color} weight="duotone" /> },
  { name: 'dietas', label: 'DIETAS', renderIcon: (color, size) => <ForkKnifeIcon size={size} color={color} weight="duotone" /> },
  { name: 'perfil', label: 'PERFIL', renderIcon: (color, size) => <UserIcon size={size} color={color} weight="duotone" /> },
];

const NutriTabs = createBottomTabNavigator();

function NutriTabsNavigator() {
  return (
    <NutriTabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={NUTRI_TABS} />}
    >
      <NutriTabs.Screen name="inicio" component={NutriInicioScreen} />
      <NutriTabs.Screen name="alunos" component={NutriAlunosScreen} />
      <NutriTabs.Screen name="dietas" component={NutriDietasScreen} />
      <NutriTabs.Screen name="perfil" component={NutriPerfilScreen} />
    </NutriTabs.Navigator>
  );
}

const NutriStack = createNativeStackNavigator();

function NutriArea() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (!DEV_BYPASS_AUTH) {
    if (status !== 'authenticated' || !user) return <Redirect href={AUTH_ENTRY} />;
    if (user.tipo !== 'nutricionista') return <Redirect href={homeForTipo(user.tipo)} />;
  }

  return (
    <NutriStack.Navigator screenOptions={SLIDE}>
      <NutriStack.Screen name="Tabs" component={NutriTabsNavigator} />
    </NutriStack.Navigator>
  );
}

// ─────────────────────────── Onboardings ───────────────────────────

const OB_SLIDE: NativeStackNavigationOptions = { ...SLIDE, gestureEnabled: false };

const ObAlunoStack = createNativeStackNavigator();

// Onboarding pós-cadastro do aluno: conta criada, o fluxo só avança.
function OnboardingAlunoArea() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== 'authenticated' || !user) return <Redirect href={AUTH_ENTRY} />;
  if (user.tipo !== 'aluno') return <Redirect href={homeForTipo(user.tipo)} />;

  return (
    <ObAlunoStack.Navigator screenOptions={OB_SLIDE}>
      <ObAlunoStack.Screen name="foto" component={ObAlunoFotoScreen} />
      <ObAlunoStack.Screen name="interesse" component={ObAlunoInteresseScreen} />
      <ObAlunoStack.Screen name="experiencia" component={ObAlunoExperienciaScreen} />
      <ObAlunoStack.Screen name="frequencia" component={ObAlunoFrequenciaScreen} />
      <ObAlunoStack.Screen name="local" component={ObAlunoLocalScreen} />
      <ObAlunoStack.Screen name="vinculo" component={ObAlunoVinculoScreen} />
      <ObAlunoStack.Screen name="corpo" component={ObAlunoCorpoScreen} />
      <ObAlunoStack.Screen name="par-q" component={ObAlunoParQScreen} />
    </ObAlunoStack.Navigator>
  );
}

const ObProfStack = createNativeStackNavigator();

function OnboardingProfessorArea() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== 'authenticated' || !user) return <Redirect href={AUTH_ENTRY} />;
  if (user.tipo !== 'personal') return <Redirect href={homeForTipo(user.tipo)} />;

  return (
    <ObProfStack.Navigator screenOptions={OB_SLIDE}>
      <ObProfStack.Screen name="foto" component={ObProfFotoScreen} />
      <ObProfStack.Screen name="perfil" component={ObProfPerfilScreen} />
      <ObProfStack.Screen name="forma-uso" component={ObProfFormaUsoScreen} />
      <ObProfStack.Screen name="convite" component={ObProfConviteScreen} />
    </ObProfStack.Navigator>
  );
}

// ───────────────────────────── Raiz ─────────────────────────────

const RootStack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: STACK_BG } }}
    >
      {/* Full-width (fora do AppFrame): dispatcher e landing. */}
      <RootStack.Screen name="Splash" component={SplashScreenRoute} />
      <RootStack.Screen name="Landing" component={LandingScreen} />

      {/* Áreas do app — enquadradas (coluna centralizada no desktop). */}
      <RootStack.Screen name={AREAS.auth} component={withAppFrame(AuthArea)} />
      <RootStack.Screen name={AREAS.aluno} component={withAppFrame(AlunoArea)} />
      <RootStack.Screen name={AREAS.personal} component={withAppFrame(PersonalArea)} />
      <RootStack.Screen name={AREAS.nutri} component={withAppFrame(NutriArea)} />
      <RootStack.Screen name={AREAS.onboardingAluno} component={withAppFrame(OnboardingAlunoArea)} />
      <RootStack.Screen name={AREAS.onboardingProfessor} component={withAppFrame(OnboardingProfessorArea)} />

      <RootStack.Screen name="AlunoDetail" component={withAppFrame(AlunoDetailScreen)} />
      <RootStack.Screen name="AtribuirDieta" component={withAppFrame(AtribuirDietaScreen)} />
      <RootStack.Screen name="AtribuirTreino" component={withAppFrame(AtribuirTreinoScreen)} />
      <RootStack.Screen name="BancoTreino" component={withAppFrame(BancoTreinoScreen)} />
      <RootStack.Screen name="Convite" component={withAppFrame(ConviteScreen)} />
      <RootStack.Screen name="ConviteNovo" component={withAppFrame(ConviteNovoScreen)} />
      <RootStack.Screen name="CriarDesafio" component={withAppFrame(CriarDesafioScreen)} />
      <RootStack.Screen name="DesafioPro" component={withAppFrame(DesafioProScreen)} />
      <RootStack.Screen name="EditarPerfil" component={withAppFrame(EditarPerfilScreen)} />
      <RootStack.Screen name="MontarDieta" component={withAppFrame(MontarDietaScreen)} />
      <RootStack.Screen name="MontarTreino" component={withAppFrame(MontarTreinoScreen)} />
      <RootStack.Screen name="Register" component={withAppFrame(RegisterScreen)} />
      <RootStack.Screen name="UsarConvite" component={withAppFrame(UsarConviteScreen)} />
      <RootStack.Screen name="DevHealth" component={withAppFrame(DevHealthScreen)} />
      <RootStack.Screen name="NotFound" component={withAppFrame(NotFoundScreen)} />
    </RootStack.Navigator>
  );
}
