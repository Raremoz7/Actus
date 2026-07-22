// Tabela de rotas path → destino no React Navigation. Substitui o roteamento por
// arquivos do expo-router: os hrefs em string usados pelo app inteiro (ex.:
// '/(aluno)/treino/123') continuam válidos — o resolver traduz o path para o
// par (tela raiz, params aninhados) que o NavigationContainer entende.

// Destino de um path: tela direta no stack raiz, tela dentro do stack de uma
// área, ou aba dentro das tabs de uma área (área = antigo grupo do expo-router).
export type RouteTarget =
  | { kind: 'root'; name: string }
  | { kind: 'area'; area: string; screen: string }
  | { kind: 'tab'; area: string; tab: string };

type RouteEntry = { pattern: string; target: RouteTarget };

// Nomes das telas raiz (áreas e telas soltas) — exportados para os navigators.
export const AREAS = {
  auth: 'Auth',
  aluno: 'Aluno',
  personal: 'Personal',
  nutri: 'Nutri',
  onboardingAluno: 'OnboardingAluno',
  onboardingProfessor: 'OnboardingProfessor',
} as const;

const ROUTES: RouteEntry[] = [
  { pattern: '/', target: { kind: 'root', name: 'Splash' } },
  { pattern: '/landing', target: { kind: 'root', name: 'Landing' } },

  { pattern: '/(auth)/escolha-perfil', target: { kind: 'area', area: AREAS.auth, screen: 'EscolhaPerfil' } },
  { pattern: '/(auth)/login', target: { kind: 'area', area: AREAS.auth, screen: 'Login' } },
  { pattern: '/(auth)/cadastro-pro', target: { kind: 'area', area: AREAS.auth, screen: 'CadastroPro' } },
  { pattern: '/(auth)/cadastro', target: { kind: 'area', area: AREAS.auth, screen: 'Cadastro' } },
  { pattern: '/(auth)/trocar-senha', target: { kind: 'area', area: AREAS.auth, screen: 'TrocarSenha' } },

  { pattern: '/(aluno)/(tabs)', target: { kind: 'tab', area: AREAS.aluno, tab: 'index' } },
  { pattern: '/(aluno)/(tabs)/treinos', target: { kind: 'tab', area: AREAS.aluno, tab: 'treinos' } },
  { pattern: '/(aluno)/(tabs)/desafios', target: { kind: 'tab', area: AREAS.aluno, tab: 'desafios' } },
  { pattern: '/(aluno)/(tabs)/perfil', target: { kind: 'tab', area: AREAS.aluno, tab: 'perfil' } },
  { pattern: '/(aluno)/alimentacao', target: { kind: 'area', area: AREAS.aluno, screen: 'Alimentacao' } },
  { pattern: '/(aluno)/badges', target: { kind: 'area', area: AREAS.aluno, screen: 'Badges' } },
  { pattern: '/(aluno)/desafio/[id]', target: { kind: 'area', area: AREAS.aluno, screen: 'Desafio' } },
  { pattern: '/(aluno)/dieta/[id]', target: { kind: 'area', area: AREAS.aluno, screen: 'Dieta' } },
  { pattern: '/(aluno)/exercicio/[id]', target: { kind: 'area', area: AREAS.aluno, screen: 'Exercicio' } },
  { pattern: '/(aluno)/par-q', target: { kind: 'area', area: AREAS.aluno, screen: 'ParQ' } },
  { pattern: '/(aluno)/sessao/[id]', target: { kind: 'area', area: AREAS.aluno, screen: 'Sessao' } },
  { pattern: '/(aluno)/treino/[id]', target: { kind: 'area', area: AREAS.aluno, screen: 'Treino' } },

  { pattern: '/(personal)/(tabs)', target: { kind: 'tab', area: AREAS.personal, tab: 'inicio' } },
  { pattern: '/(personal)/(tabs)/inicio', target: { kind: 'tab', area: AREAS.personal, tab: 'inicio' } },
  { pattern: '/(personal)/(tabs)/alunos', target: { kind: 'tab', area: AREAS.personal, tab: 'alunos' } },
  { pattern: '/(personal)/(tabs)/treinos', target: { kind: 'tab', area: AREAS.personal, tab: 'treinos' } },
  { pattern: '/(personal)/(tabs)/desafios', target: { kind: 'tab', area: AREAS.personal, tab: 'desafios' } },
  { pattern: '/(personal)/(tabs)/perfil', target: { kind: 'tab', area: AREAS.personal, tab: 'perfil' } },

  { pattern: '/(nutri)/(tabs)', target: { kind: 'tab', area: AREAS.nutri, tab: 'inicio' } },
  { pattern: '/(nutri)/(tabs)/inicio', target: { kind: 'tab', area: AREAS.nutri, tab: 'inicio' } },
  { pattern: '/(nutri)/(tabs)/alunos', target: { kind: 'tab', area: AREAS.nutri, tab: 'alunos' } },
  { pattern: '/(nutri)/(tabs)/dietas', target: { kind: 'tab', area: AREAS.nutri, tab: 'dietas' } },
  { pattern: '/(nutri)/(tabs)/perfil', target: { kind: 'tab', area: AREAS.nutri, tab: 'perfil' } },

  { pattern: '/onboarding-aluno/foto', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'foto' } },
  { pattern: '/onboarding-aluno/interesse', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'interesse' } },
  { pattern: '/onboarding-aluno/experiencia', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'experiencia' } },
  { pattern: '/onboarding-aluno/frequencia', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'frequencia' } },
  { pattern: '/onboarding-aluno/local', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'local' } },
  { pattern: '/onboarding-aluno/vinculo', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'vinculo' } },
  { pattern: '/onboarding-aluno/corpo', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'corpo' } },
  { pattern: '/onboarding-aluno/par-q', target: { kind: 'area', area: AREAS.onboardingAluno, screen: 'par-q' } },

  { pattern: '/onboarding-professor/foto', target: { kind: 'area', area: AREAS.onboardingProfessor, screen: 'foto' } },
  { pattern: '/onboarding-professor/perfil', target: { kind: 'area', area: AREAS.onboardingProfessor, screen: 'perfil' } },
  { pattern: '/onboarding-professor/forma-uso', target: { kind: 'area', area: AREAS.onboardingProfessor, screen: 'forma-uso' } },
  { pattern: '/onboarding-professor/convite', target: { kind: 'area', area: AREAS.onboardingProfessor, screen: 'convite' } },

  { pattern: '/aluno/[id]', target: { kind: 'root', name: 'AlunoDetail' } },
  { pattern: '/atribuir-dieta', target: { kind: 'root', name: 'AtribuirDieta' } },
  { pattern: '/atribuir-treino', target: { kind: 'root', name: 'AtribuirTreino' } },
  { pattern: '/banco-treino/[id]', target: { kind: 'root', name: 'BancoTreino' } },
  { pattern: '/convite', target: { kind: 'root', name: 'Convite' } },
  { pattern: '/convite/novo', target: { kind: 'root', name: 'ConviteNovo' } },
  { pattern: '/criar-desafio', target: { kind: 'root', name: 'CriarDesafio' } },
  { pattern: '/desafio-pro/[id]', target: { kind: 'root', name: 'DesafioPro' } },
  { pattern: '/editar-perfil', target: { kind: 'root', name: 'EditarPerfil' } },
  { pattern: '/montar-dieta', target: { kind: 'root', name: 'MontarDieta' } },
  { pattern: '/montar-treino', target: { kind: 'root', name: 'MontarTreino' } },
  { pattern: '/register', target: { kind: 'root', name: 'Register' } },
  { pattern: '/usar-convite', target: { kind: 'root', name: 'UsarConvite' } },
  { pattern: '/_dev/health', target: { kind: 'root', name: 'DevHealth' } },
];

type CompiledRoute = { segments: string[]; target: RouteTarget };

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function isGroup(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')');
}

// Índice: chave = path normalizado (nº de segmentos + literais), com e sem grupos.
// O expo-router aceita hrefs sem os grupos (ex.: '/par-q' → '/(aluno)/par-q');
// aliases sem grupo só entram quando NÃO são ambíguos entre áreas.
const compiled: CompiledRoute[] = [];
const seenAlias = new Map<string, number>(); // aliasKey → índice em compiled (-1 = ambíguo)

function aliasKey(segments: string[]): string {
  return segments.map((s) => (s.startsWith('[') ? '[]' : s)).join('/');
}

for (const { pattern, target } of ROUTES) {
  const full = splitPath(pattern);
  compiled.push({ segments: full, target });

  const stripped = full.filter((s) => !isGroup(s));
  if (stripped.length !== full.length && stripped.length > 0) {
    const key = aliasKey(stripped);
    if (seenAlias.has(key)) {
      seenAlias.set(key, -1); // ambíguo entre áreas — alias descartado
    } else {
      seenAlias.set(key, compiled.length - 1);
    }
  }
}

const aliases: CompiledRoute[] = [...seenAlias.entries()]
  .filter(([, idx]) => idx >= 0)
  .map(([key, idx]) => {
    const source = compiled[idx]!;
    // Reconstrói os segmentos do alias reusando os nomes de parâmetro originais.
    const paramNames = source.segments.filter((s) => s.startsWith('['));
    let p = 0;
    const segments = key.split('/').map((s) => (s === '[]' ? paramNames[p++]! : s));
    return { segments, target: source.target };
  });

function matchAgainst(routes: CompiledRoute[], segments: string[]) {
  outer: for (const route of routes) {
    if (route.segments.length !== segments.length) continue;
    const params: Record<string, string> = {};
    for (let i = 0; i < segments.length; i++) {
      const pat = route.segments[i]!;
      const seg = segments[i]!;
      if (pat.startsWith('[')) {
        params[pat.slice(1, -1)] = decodeURIComponent(seg);
      } else if (pat !== seg) {
        continue outer;
      }
    }
    return { target: route.target, params };
  }
  return null;
}

export type ResolvedRoute = {
  target: RouteTarget;
  params: Record<string, string>;
};

// Traduz um href do expo-router (string ou {pathname, params}) para o destino.
export function resolveHref(href: string | { pathname: string; params?: Record<string, unknown> }): ResolvedRoute | null {
  const pathname = typeof href === 'string' ? href : href.pathname;
  const extraParams = typeof href === 'string' ? undefined : href.params;

  const [pathPart, queryPart] = pathname.split('?');
  const segments = splitPath(pathPart ?? '');

  // Raiz '/'
  const match =
    segments.length === 0
      ? { target: ROUTES[0]!.target, params: {} as Record<string, string> }
      : (matchAgainst(compiled, segments) ?? matchAgainst(aliases, segments));

  if (!match) return null;

  const params = { ...match.params };
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  }
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined && v !== null) params[k] = String(v);
    }
  }
  return { target: match.target, params };
}

// Converte o destino resolvido no par (nome raiz, params aninhados) do React Navigation.
export function toNavigateArgs(resolved: ResolvedRoute): { name: string; params?: object } {
  const { target, params } = resolved;
  switch (target.kind) {
    case 'root':
      return { name: target.name, params };
    case 'area':
      return { name: target.area, params: { screen: target.screen, params } };
    case 'tab':
      return {
        name: target.area,
        params: { screen: 'Tabs', params: { screen: target.tab, params } },
      };
  }
}
