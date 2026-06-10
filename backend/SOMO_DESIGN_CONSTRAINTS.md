— SOMO DESIGN CONSTRAINTS — Anti-AI-Slop / Vibe Coding Aesthetic —



Este prompt define restrições criativas obrigatórias para qualquer geração de design,

código frontend ou copy pela Somo Tecnologia. O objetivo é garantir originalidade visual

e evitar o "AI slop aesthetic" — o look genérico produzido por Tailwind + shadcn/ui + v0.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIPOGRAFIA — NUNCA USAR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER use these fonts (AI defaults, saturated):

Inter · Roboto · Open Sans · Lato · Poppins · Geist · DM Sans · Manrope

Space Grotesk · Plus Jakarta Sans · system-ui · Arial



NEVER: single font with no pairing, uniform weight (400 only), font-size jumps < 2x.



ALWAYS:

\- High-contrast pairing: display + mono, serif + geometric sans, or variable font

&#x20; with extreme weights (100 vs 900).

\- Minimum 3x size jump between body and headline.

\- Personality must be intentional and specific to the brand — not "clean and modern."



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORES \& PALETA — NUNCA USAR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER use as brand/primary color:

indigo-500 (#6366F1) · violet-600 (#8B5CF6) · blue-500 (#3B82F6)

cyan-400 (#22D3EE) · emerald-500 (#10B981) como success padrão

Qualquer purple-to-blue gradient como cor principal.



NEVER:

\- Dark mode com neon/cyan/violet glow como atalho "tech vibe"

\- Gradientes decorativos em hero, nav, backgrounds (ok apenas em 1 elemento de ação)

\- Glassmorphism (backdrop-blur) como recurso estético padrão

\- Blur radial / glow atrás de elementos hero

\- Paleta completamente neutra sem nenhum accent forte e intencional

\- Verde lime / vermelho tomato do Tailwind como cores de feedback padrão



ALWAYS:

\- Cor primária escolhida por significado cultural para o contexto do cliente, não por "tech"

\- Dominant color + sharp accent (não "2 cores pastéis equilibradas")

\- Cores de feedback (success/error) definidas explicitamente no design token, não herdadas do Tailwind



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ÍCONES \& COMPONENTES — NUNCA USAR

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER use as default icon set:

Lucide · Heroicons · Tabler · Feather (todos são defaults de shadcn/Tailwind)



NEVER import or use out-of-the-box aesthetics from:

shadcn/ui · Aceternity UI · Magic UI · 21st.dev

(Radix headless is OK — style it from scratch)



NEVER use Aceternity/Magic UI effects:

background-beams · aurora · meteors · glowing-stars · sparkles · spotlight

grid-and-dot-background · animated-borders · hover-border-gradient

infinite-moving-cards · text-generate-effect · typewriter



NEVER default components:

\- Pill button com gradient roxo e seta → ("Get Started →")

\- Ghost outline button idêntico ao primário em tamanho e shape

\- Badge com rounded-full verde/azul



ALWAYS:

\- Se ícones: custom desenhados para o domínio do produto, ou Phosphor/Iconoir com estilo

&#x20; diferenciado (weight stroke, filled vs outline) definido no design system

\- Componentes estilizados do zero sobre primitivos headless

\- Variação intencional de shape entre botões de diferentes hierarquias



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CARDS, ESPAÇAMENTO, SOMBRAS — NUNCA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER:

\- rounded-xl/rounded-2xl em TODOS os elementos igualmente

\- shadow-sm com opacity \~0.1 em todo card como padrão único

\- Padding p-6 / p-8 uniforme sem hierarquia espacial

\- gap-4 / gap-6 idêntico em todos os grids

\- Border 1px neutral-200/800 + bg-card → o "card shadcn" padrão



ALWAYS:

\- Variação intencional de border-radius por função:

&#x20; (ex: cards 4px sharp · botões pill 9999px · inputs 6px)

\- Sombras apenas onde criam elevação semântica real (modal, tooltip, dropdown)

\- Hierarquia espacial: espaçamento maior entre seções, menor entre elementos relacionados



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYOUT \& ESTRUTURA — NUNCA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER use the "AI slop LP formula":

\[Nav] → \[Hero centralizado + 2 CTAs] → \[Logo bar "Trusted by" cinza] →

\[3 feature cards idênticos ícone+título+2 linhas] → \[Bento grid 4 quadrantes] →

\[Zig-zag screenshot + bullets] → \[Stats 3-4 colunas] →

\[Pricing 3 colunas card-central-destacado] → \[Testimonial carrossel] →

\[FAQ accordion] → \[CTA full-width gradiente = cópia do hero] → \[Footer 5 colunas]



NEVER:

\- Hero simétrico centralizado como ponto de partida

\- 3 itens em grid idêntico (icon + title + 2-line desc) repetidos N vezes

\- Bento grid Apple-style com 4 quadrantes de tamanho uniforme

\- Pricing table com card central "Most Popular" em indigo/violet

\- Infinite-moving-cards / carrossel para testimonials

\- CTA final que repete literalmente o hero



ALWAYS prefer:

\- Composições assimétricas, off-grid, editoriais, split-screen ou scroll-driven

\- Variar densidade: 1 feature como texto longo + 1 como número grande + 1 como visual

\- Testimonials como citação editorial, grid estático ou integrado ao corpo do texto

\- Seções com hierarquia visual real, não copy-paste da seção anterior



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANIMAÇÕES \& MOTION — NUNCA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER:

\- Fade-in + slide-up on scroll em TODOS os elementos (Framer Motion whileInView default)

\- Loop infinito de logos (Marquee)

\- Hover lift (translate-y -2px + shadow maior) em todo card

\- Qualquer efeito de background animado da Aceternity (aurora, beams, meteors, sparkles)

\- Typewriter / text-generate no headline como "momento wow"



ALWAYS:

\- 1 momento de motion alto-impacto e orquestrado (ex: page load com staggered reveals)

&#x20; em vez de 20 micro-interactions espalhadas

\- Motion motivado por feedback de ação do usuário, não por decoração



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMAGENS \& ASSETS — NUNCA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER use:

\- Fotos Unsplash genéricas (laptop em mesa de madeira, pessoa sorrindo em escritório)

\- Ilustrações unDraw / Storyset / Humaaans / Ouch (saturadas, sem personalidade)

\- Isometric 3D pastel (hype 2020–2022)

\- Lottie genérica (foguete decolando, gráfico subindo, engrenagens girando)

\- AI-generated illustration blobs 3D com aquele "smooth plastic quality"

\- Avatares com iniciais (ui-avatars.com) ou Dicebear em produção



ALWAYS:

\- Screenshots reais do produto (melhor ativo disponível)

\- Fotografia real de equipe, clientes, contexto do negócio

\- Ilustrações customizadas para o domínio (bar, restaurante, CRM, consultiva)

\- Se placeholder: deixar explícito que é placeholder, não fingir que é final



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COPY \& MICROCOPY — NUNCA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER use these headline structures:

"Transforme seu \[negócio/time/operação]"

"A plataforma tudo-em-um para \[X]"

"Tudo que você precisa para \[Y]"

"Construa o futuro de \[X]"

"\[Verbo abstrato] sem limites"

"Reimagine como você \[trabalha/vende/atende]"

"Powered by AI" / "Movido por IA" como proposta de valor única



NEVER use these buzzwords (PT-BR):

transforme · revolucione · desbloqueie · eleve · potencialize · otimize

simplifique · escale · capacite · impulsione · robusto · escalável · inovador

disruptivo · modular · customizável · intuitivo · perfeito · sem esforço · de ponta

próxima geração · sob medida · líder de mercado · completo · em segundos



NEVER use these buzzwords (EN):

unlock · transform · revolutionize · supercharge · harness · leverage · optimize

streamline · unleash · seamless · powerful · intuitive · comprehensive · tailored

scalable · agile · cutting-edge · best-in-class · next-generation · robust · elevate

empower · foster · delve · unprecedented · enhanced · enable · ensure · deliver



NEVER use these CTAs:

"Get Started" · "Comece Agora" · "Try it Free" · "Experimente Grátis"

"Learn More" · "Saiba Mais" · "Book a Demo" · "Agende uma Demo"

"Join the Waitlist" · "Sign Up" · "Cadastre-se"



NEVER format features as:

\[Ícone outline 24px] + \[Título 2-4 palavras] + \[Descrição \~120 chars genérica]

repetido 3 ou 6 vezes em grid simétrico com padding idêntico.



NEVER:

\- Em-dash (—) em série como pontuação decorativa

\- Bullet points com emoji no início (🚀 ⚡ 🎯 ✨)

\- Listas de exatamente 3 itens em todo lugar

\- Negrito aleatório no meio de parágrafos



ALWAYS:

\- Headline específica, verificável, com substantivos concretos e números reais

\- Copy com voz de fundador: 1 usuário, 1 problema, 1 frase

\- CTA com verbo específico ligado ao outcome real do usuário

&#x20; (ex: "Ver minha primeira comanda em 3 min" / "Calcular quanto economizo")

\- Microcopy de feature variando formato e densidade, não template uniforme

\- Frases curtas. Parágrafo máximo 3 linhas. Sem "in today's competitive landscape."



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTA FINAL — SOBRE INTERFACES DE PRODUTO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para dashboards, CRMs e plataformas (Plenum, Manda):

Algumas convenções de UX são legítimas mesmo que a IA as gere por padrão

(sidebar, tabela com avatar+nome, ⌘K, empty state).

O diferencial Somo está nos DETALHES:

tipografia do número de KPI · transição entre estados · microcopy do empty state

· ícones desenhados para o domínio (comanda, mesa, balcão, negociação, pipeline)

NÃO em reinventar padrões de navegação consolidados.



Não troque um clichê por outro (brutalist, "Linear-wannabe", "Vercel-wannabe").

Defina primeiro o positivo (paleta própria, grid, motion language, voice).

O negativo serve para não começar pelo default — não para ser diferente por obrigação.



— FIM DAS RESTRIÇÕES SOMO —

