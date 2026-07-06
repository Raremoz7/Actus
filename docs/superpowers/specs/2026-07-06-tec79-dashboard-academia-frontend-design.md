# TEC-79 — Dashboard da Academia (Frontend): filtro de unidade, hover e layout

## Contexto

O dashboard gerencial rico já está implementado em React (`web/src/pages/academia/AcademyDashboardPage.tsx`) — KPIs reais + cards de "Prévia" (mock) para widgets sem endpoint agregador, usando os gráficos de `web/src/components/ui/charts.tsx` e os mocks de `web/src/mocks/academyInsights.ts`. O design foi validado no protótipo `web/public/prototipo-dashboard-gerencial.html` (aprovado pelo Davi).

A TEC-79 (sub-issue de TEC-53, "Frontend") pede 4 ajustes sobre essa tela existente. Este spec cobre só o delta — não reconstrói a página.

## Requisitos (da issue)

1. **Filtro por academia/filial/franquia** no topo, junto ao filtro de período. Impacta os cards/gráficos. Sem seleção = visão consolidada.
2. **Remover "Comissões"** do menu lateral. Manter Dashboard, (Rede, se HQ,) Equipe, Configurações.
3. **Ajustar layout** — alinhamento, espaçamento, consistência; corrigir quebras/desalinhamentos.
4. **Hover no gráfico** "Alunos por dia da semana" — tooltip com dia da semana, quantidade e categoria (masc/fem).

## Decisões

### Filtro de unidade
- Aparece **apenas** para gestor de rede (`academy.network_role === 'network_hq'`). Para gestor de academia independente/filial, não há sub-unidades — o filtro não é exibido.
- Lista de unidades vem de `useNetworkDashboard().units` (`GET /academy/network/dashboard` → `units: [{id, name, kpis:{total_students, instructors}}]`).
- Opções: "Todas as unidades" (consolidado, padrão) + uma por unidade da rede.
- Dropdown custom (botão + menu), no padrão visual do protótipo aprovado (não `<select>` nativo).
- Posicionado no header, à direita, ao lado do controle de período.

### Controle de período
- O protótipo aprovado tem um segmented "Este mês / Mês passado / 90 dias". A tela React ainda não tem. Adicionar para bater com o design e concentrar os filtros numa área.
- **Sem efeito de dados nesta fase** (o backend não aceita parâmetro de período) — é um controle visual (estado local) marcado como prévia. Não bloqueia a entrega.

### Escopo de dados por unidade (limitação de backend)
- Não existe endpoint de dashboard completo por unidade. O `/academy/dashboard` é sempre a academia logada (para o HQ, é o consolidado da própria rede-matriz).
- Comportamento nesta fase:
  - **"Todas as unidades"**: KPIs/ranking reais de `/academy/dashboard` + cards de prévia consolidados (como hoje).
  - **Unidade específica selecionada**: os cards de **prévia** passam a exibir dados mock **determinísticos por unidade** (variam de forma estável conforme o `id`), deixando a interação de filtro demonstrável e coerente com o critério de aceite. Os KPIs reais que existem por unidade (`total_students`, `instructors` de `/academy/network/dashboard`) são exibidos quando a unidade é selecionada; os demais KPIs reais permanecem com "—" ou o valor consolidado, sinalizados como prévia.
- Uma tarefa de backend (endpoint de dashboard por unidade) fica registrada como follow-up para o Julio — o frontend já fica pronto para consumi-lo.

### Hover no gráfico de dias da semana
- Novo componente interativo (substitui o uso de `MultiLineChart` **apenas neste card**; `MultiLineChart` segue existindo para outros usos).
- Corrige a distorção: os pontos hoje viram elipses por causa de `preserveAspectRatio="none"`. A camada interativa (pontos/guia/tooltip) é posicionada em % via HTML sobre o SVG das linhas, então os pontos ficam circulares.
- Ao passar o mouse numa coluna do dia: guia vertical, os dois pontos do dia destacados, o label do dia realçado, e um tooltip com: dia por extenso, Masculino (valor), Feminino (valor), Total.
- Acessível: colunas de hover são focáveis o suficiente para o protótipo; teclado fica como melhoria futura (fora de escopo).

## Componentes

- `web/src/components/academy/UnitFilter.tsx` — dropdown de unidade (recebe `units`, `value`, `onChange`).
- `web/src/components/academy/PeriodSegmented.tsx` — segmented de período (estado visual).
- `web/src/components/ui/charts.tsx` — novo `WeekdayLineChart` (linha multi-série com hover). Reusa tokens `--color-data-*`.
- `web/src/pages/academia/AcademyDashboardPage.tsx` — header ganha a área de filtros; estado `scope`/`period`; troca o card de dias da semana para `WeekdayLineChart`; cards de prévia passam a receber dados por `scope`.
- `web/src/mocks/academyInsights.ts` — funções `*ForScope(scope)` derivando mocks determinísticos por unidade (ou um helper único).
- `web/src/layouts/AcademyLayout.tsx` — remover item "Comissões".

## Fora de escopo

- Endpoint de dashboard real por unidade (backend — follow-up Julio).
- Efeito real do filtro de período (backend).
- Navegação por teclado no tooltip do gráfico.
- Reescrever os demais gráficos (área/donut/colunas) — permanecem como estão.

## Testes

- `WeekdayLineChart`: renderiza linhas/labels; ao hover numa coluna, o tooltip aparece com dia + masc + fem + total corretos; ao sair, some.
- `UnitFilter`: lista "Todas" + unidades; selecionar dispara `onChange` com o id certo; "Todas" retorna scope consolidado.
- `AcademyDashboardPage`: para `network_hq`, o filtro de unidade aparece; para não-HQ, não aparece. Selecionar uma unidade muda o título/tag e os cards de prévia.
- `AcademyLayout`: "Comissões" não está na sidebar.
