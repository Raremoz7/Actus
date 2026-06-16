# Actus — Sobre o App

## O que é

O **Actus** é um aplicativo mobile (React Native + Expo SDK 55) que reúne, em um único produto, os três lados da relação de treino: o **aluno** que executa, o **personal trainer** que prescreve e o **nutricionista** que orienta a alimentação. Em vez de pulverizar a rotina entre planilhas, prints de WhatsApp e PDFs soltos, o Actus dá a cada perfil uma área própria — com as ferramentas que ele realmente usa — conectadas por um vínculo profissional-aluno.

É, ao mesmo tempo, uma ferramenta de **gestão** (para quem prescreve) e de **engajamento** (para quem treina). O profissional monta treinos e dietas, atribui a alunos, cria desafios e acompanha adesão; o aluno recebe tudo isso de forma organizada no celular, executa sessão a sessão e vê seu progresso evoluir.

## A proposta

A maioria dos personais e nutricionistas hoje improvisa a gestão dos alunos. O treino vai num documento, a dieta em outro, o acompanhamento some na conversa, e o aluno fica sem clareza do que fazer no dia. O Actus parte de três convicções:

1. **O aluno precisa de foco, não de funcionalidade.** Ao abrir o app, ele vê o que importa hoje: o treino do dia, a dieta, os desafios em andamento. Nada de menu sobrecarregado.
2. **O profissional precisa de alavancagem.** Criar um treino uma vez e atribuir a vários alunos; clonar um programa pronto do Banco de Treinos; acompanhar quem está aderindo e quem sumiu — sem planilha.
3. **O vínculo é o produto.** Tudo gira em torno da relação entre quem prescreve e quem executa. O convite cria esse vínculo; os treinos, dietas e desafios o alimentam; a adesão o sustenta.

O posicionamento visual reforça isso: dark mode exclusivo, estética *quiet luxury* (neon verde sobre tons escuros, tipografia condensada, zero buzzword), feito para parecer um produto premium e não mais um app genérico de academia.

## Os três perfis

O app detecta o tipo de usuário (`aluno`, `personal`, `nutri`) e direciona cada um para sua própria área de navegação, com abas e telas distintas.

### Aluno
Abas: **Hoje · Treinos · Desafios · Perfil**

- **Hoje** — a tela central da experiência. Saudação por horário, fita da semana com o dia atual destacado, card do treino de hoje (com o próximo exercício e botão para iniciar), a dieta vigente e os desafios ativos. Se o Par-Q ainda não foi preenchido, aparece um aviso para fazê-lo.
- **Treinos** — todos os treinos atribuídos pelo profissional, com grupos musculares, número de exercícios e período de validade.
- **Desafios** — competições em que participa ou foi convidado, com progresso, dias da disputa e ranking.
- **Perfil** — dados da conta, edição de perfil, acesso ao Par-Q (pode refazer quando quiser) e logout.

Telas de fluxo: detalhe de treino → **execução de sessão** (stepper exercício a exercício, com foto/gif do movimento e check-in de séries) → resumo final; detalhe de dieta (refeições e macros); detalhe de exercício; detalhe de desafio (aceitar/recusar convite, ranking, sequência de dias).

### Personal Trainer
Abas: **Início · Alunos · Treinos · Desafios · Perfil**

- **Início** — dashboard com KPIs (alunos vinculados, treinos criados, desafios) e ações rápidas (criar treino, gerar convite, criar desafio). Há um bloco de engajamento (adesão, check-ins da semana, alunos inativos) hoje servido por dados derivados localmente, aguardando endpoint dedicado.
- **Alunos** — lista de alunos vinculados, cada um com foto, último check-in e status do Par-Q (verde/amarelo/vermelho). Abre o detalhe completo do aluno.
- **Treinos** — biblioteca de treinos do profissional, com criação via construtor (builder) e acesso ao Banco de Treinos público.
- **Desafios** — desafios criados (rascunho/ativo/finalizado), com participantes e ranking.
- **Perfil** — dados profissionais (área de atuação, CREF opcional, experiência, cidade/UF).

### Nutricionista
Abas: **Início · Alunos · Dietas · Perfil**

Mesma lógica do personal, mas o eixo é a **dieta** no lugar do treino: biblioteca de dietas, construtor de refeições com macros e atribuição a alunos.

## Funcionalidades por domínio

### Autenticação e sessão
Cadastro de aluno e de profissional (fluxos distintos), login, logout e troca de senha obrigatória quando exigida pelo backend. Os tokens ficam em armazenamento seguro (SecureStore), o refresh é automático e rotaciona as credenciais, e a sessão é validada a cada boot. O cadastro de aluno pode acontecer com ou sem código de convite.

### Onboarding
Após o cadastro, cada perfil passa por um fluxo de boas-vindas específico (uma vez só):
- **Aluno**: objetivo de treino, nível de experiência, frequência semanal, local de treino, dados corporais, foto, Par-Q e, opcionalmente, vínculo via convite.
- **Profissional**: perfil profissional (nome, área, CREF, experiência, cidade), forma de uso, foto e criação do primeiro convite.

Essas preferências passam a orientar a relação com o profissional vinculado.

### Treinos
O coração do app para o personal. Um **construtor em etapas** define nome, foco muscular e a lista de exercícios (com séries, repetições, descanso e notas, apoiado no catálogo aberto Wger para imagens e referências). O treino vira um template reutilizável que pode ser **atribuído a alunos** escolhendo dias da semana e período de vigência.

O **Banco de Treinos** é uma biblioteca de programas curados (criados por administradores no painel web) que qualquer profissional pode visualizar e **clonar para a própria biblioteca** com um toque, já abrindo o construtor para personalizar.

Do lado do aluno, o treino é executado em uma **sessão guiada**: avança exercício por exercício, marca séries concluídas e fecha com um resumo de tempo e volume.

### Dietas
Para o nutricionista, o equivalente dos treinos: um construtor de dietas organizado por refeições (café, almoço, lanche, janta), cada uma com alimentos e seus macros (proteína, carboidrato, gordura, calorias). A dieta é atribuída ao aluno com período de validade, e ele a visualiza com o totalizador de macros do dia.

### Desafios
Mecanismo de engajamento por competição. O profissional cria um desafio (nome, período, visibilidade do ranking) e convida alunos. Cada participante acompanha o próprio progresso e — quando o ranking é público entre os participantes — sua posição em tempo real. O aluno aceita ou recusa o convite; o profissional gerencia participantes, publica, encerra e acompanha o relatório.

### Par-Q (prontidão para atividade física)
Questionário de 7 perguntas de triagem de saúde que o aluno preenche antes de treinar. O resultado fica visível para os profissionais vinculados, com um indicador de status (apto / atenção / requer revisão). Pode ser refeito a qualquer momento. É uma das funcionalidades já integradas a endpoint real.

### Convites e vínculo
O profissional gera um **código de convite** com link compartilhável (deep link). Um novo aluno que abre o link já cai no cadastro com o vínculo pré-carregado; um aluno já existente pode inserir o código e ver quem o convidou antes de confirmar. É assim que se forma a relação profissional-aluno que sustenta todo o resto.

### Gestão de alunos (visão do profissional)
O detalhe de cada aluno reúne dados físicos, status e respostas do Par-Q, preferências coletadas no onboarding, treinos e dietas atribuídos e um histórico de check-ins (mapa de atividade). Dali o profissional atribui novos treinos e dietas.

### Dashboard e engajamento
A tela inicial do profissional resume a operação: quantos alunos, quantos treinos/dietas, quantos desafios, além de atalhos para as ações mais frequentes. O bloco de engajamento sinaliza adesão, atividade recente e alunos inativos.

### Gamificação
Para o aluno, elementos de reforço: sequência de dias (streak) com ícone de chama, conquistas (badges) e uma visão semanal de check-ins.

## Como tudo se conecta

```
Profissional cria convite ──► Aluno se vincula
        │                            │
        ├─ monta treinos ────────────┤
        ├─ monta dietas ─────────────┤──► Aluno recebe na tela "Hoje"
        ├─ cria desafios ────────────┤        │
        └─ acompanha adesão ◄────────┘        ▼
                  ▲                     executa sessão,
                  │                     segue dieta,
            check-ins, Par-Q,           participa de desafios
            progresso  ─────────────────────┘
```

O profissional **prescreve e acompanha**; o aluno **executa e progride**; o vínculo criado pelo convite é o fio que liga os dois lados, e os check-ins/Par-Q/progresso fecham o ciclo de volta para o profissional.

## Tecnologia (resumo)

React Native sobre **Expo SDK 55** (dev build — Expo Go não funciona), TypeScript estrito, **Expo Router** para navegação, **Unistyles 3** para estilos, **Zustand** para estado, **TanStack Query v5 + Axios** para dados, **Zod** validando toda resposta da API, **SecureStore** para tokens, **Phosphor** (duotone) para ícones e **Reanimated** para movimento. Monitoramento via Sentry, sempre sem dados pessoais.

A identidade visual segue um design system rigoroso: dark mode, neon verde (`#CBFE00`) como cor de ação, tipografia Barlow Condensed (títulos) / Share Tech Mono (dados) / Barlow (corpo), tudo regido por tokens centralizados — nunca valores avulsos no componente.

## Estado atual

Parte das funcionalidades já consome a API real (autenticação, treinos, dietas, desafios, sessões, Par-Q, Banco de Treinos, convites e gestão de alunos). Algumas áreas ainda rodam sobre mocks isolados enquanto os endpoints correspondentes não entram em produção — engajamento agregado do dashboard, preferências do aluno e perfil profissional estendido. O desenvolvimento é feito por blocos, com validação de design a cada etapa.
