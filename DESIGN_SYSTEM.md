# Actus · Design System

> **Documento canônico e definitivo.** Fonte única de verdade para todo design,
> frontend e copy da Actus — app mobile, painel web e landing. Consolida e substitui:
> `backend/design.md` (v2.0), `backend/SOMO_DESIGN_CONSTRAINTS.md` e as decisões soltas em
> `app/docs/`. Em caso de divergência, **este documento prevalece**.
>
> **Fonte de verdade do código:** `app/src/theme/tokens.ts` (mobile, via Unistyles 3) e
> `web/src/index.css` (`@theme` do Tailwind v4). Os dois **devem** espelhar os mesmos valores.
>
> **Regra de ouro de implementação:** nunca hex/valor solto em componente. Mobile importa de
> `tokens.ts` (consumido por Unistyles + o átomo `AppText`); web usa as classes de token do
> `@theme` (`bg-surface-1`, `text-neon`, etc.).

**Estética:** *Quiet Luxury, Dark Mode único.* Calmo, premium, orientado a dados. Profundidade
por camadas de superfície, neon como **única** cor de ação. A landing é a exceção (tema claro,
editorial) — ver §07.

**Plataformas e como cada uma consome o sistema:**

| Superfície | Stack | Tema | Consumo dos tokens |
|---|---|---|---|
| **App mobile** (produto) | React Native · Expo SDK 55 · Unistyles 3 · Reanimated | Dark único | `tokens.ts` + `AppText` |
| **Painel web** | React · Tailwind v4 · GSAP · Lenis | Dark (mesmos tokens) | `@theme` em `index.css` |
| **Landing** | React · Tailwind v4 · GSAP · Lenis | **Light** editorial | Subsistema próprio (§07) |

---

## 01 · Fundações

### 1.1 Paleta de cores

Mapeamento lado a lado — `tokens.ts` (mobile) ↔ classe Tailwind (web). Os valores são idênticos.

**Fundos & superfícies** (escuro → claro, profundidade gradual):

| Token (mobile) | Classe (web) | Hex | Uso |
|---|---|---|---|
| `bgLowest` | `bg-lowest` | `#10252D` | Fundo de splash/base; header web; cor nativa |
| `bgBase` | `bg-base` | `#1A343F` | Corpo de conteúdo (Screen / body) |
| `surface1` | `surface-1` | `#203F4B` | Cards padrão, inputs, tab bar |
| `surface2` | `surface-2` | `#294B58` | Card elevado, chip neutro, ícone-bolha, hover |
| `surface3` | `surface-3` | `#345867` | Camada intermediária (raro), avatares |
| `surface4` | `surface-4` | `#406575` | Borda de toggle/realce muito sutil |

**Marca & acento:**

| Token | Classe | Hex | Uso |
|---|---|---|---|
| `neon` | `neon` | `#CBFE00` | **Única cor de ação** — CTA primário, estado ativo, foco, KPI, tab ativa |
| `secondary` | `secondary` | `#4DE082` | Sucesso/positivo discreto (raro) |
| `surfaceTint` | — | `#ABD600` | Glow externo sutil de foco do input (**único glow do app**) |
| `accentMuted` | — | `#7BA0BC` | **Azul-névoa** — dados/estrutura: eyebrows, abas/valores secundários, divisórias, gráficos. **Nunca** como ação (é do neon) nem como aviso (é do `info`) |
| `accentMutedSurface` | — | `rgba(123,160,188,0.16)` | Fill suave de chip/badge secundário de dados |

**Texto & contornos:**

| Token | Classe | Valor | Uso |
|---|---|---|---|
| `textPrimary` | `text-1` | `#FFFFFF` | Texto principal |
| `textSecondary` | `text-2` | `rgba(255,255,255,0.70)` | Texto de apoio, corpo |
| `textTertiary` | `text-3` | `rgba(255,255,255,0.50)` | Meta, legenda, labels, ícone inativo |
| `textInverse` | `text-inv` | `#141414` | Texto **sobre neon** / fundo claro; botão primário |
| `onSurface` | `on-surface` | `#E2E4CF` | Texto sobre superfícies tonais específicas (raro) |
| `outline` | `outline` | `#8E9379` | Borda de botão secundário (1px) |
| `outlineVariant` | `outline-v` | `#444933` | Borda padrão: card, input, divisória (1px) |

**Semânticas / feedback:**

| Token | Classe | Hex | Uso |
|---|---|---|---|
| `success` | `success` | `#4ADE80` | Confirmação, check |
| `warning` | `warning` | `#FBBF24` | **Atenção** (ex.: selo de Par-Q com "sim") |
| `error` | `error` | `#F87171` | Erro de validação |
| `info` | — | `#60A5FA` | Aviso pontual informativo |
| `flame` | — | `#F97316` | **Exceção consciente ao neon:** só no símbolo de streak (chama) |

**Overlays & scrims:**

| Token | Valor | Uso |
|---|---|---|
| `overlay` | `rgba(16,37,45,0.7)` | Scrim de modal/sheet (70% de `bgLowest`) |
| `veil` | `rgba(16,37,45,0.28)` | Véu sobre foto de exercício (mantém contraste) |
| `shadow` | `#000000` | Sombra de elevação (modal/sheet/elevado) |

### 1.2 Gradientes (135°, via `expo-linear-gradient`)

| Gradiente | Cores | Locations | Uso |
|---|---|---|---|
| `brand` | `#CBFE00 → #A2CB00` | — | Realces de marca |
| `streak` | `#F97316 → #EF4444` | — | Sequência/chama |
| `heroScrim` | `transparente → bgBase sólido` | `[0, 0.3, 0.68, 1]` | Foto do hero dissolve no corpo sem corte seco; garante leitura do título |
| `cardPhotoScrim` | `transparente → surface1 sólido` | `[0, 0.48, 0.86]` | Foto discreta no topo do card; meta/CTA sobre base sólida |

`neonTransparent` (`rgba(203,254,0,0)`) é o stop transparente para degradês sobre imagem (evita borda "muddy").

### 1.3 Espaçamento (base 4pt)

`xs 4` · `sm 8` · `md 12` · `lg 16` · `xl 24` · `xxl 32`

- `md (12)` — padding interno de campo/input.
- `lg (16)` — padding de tela e barra de topo.
- `xl (24)` — gap entre cards/blocos, padding de card.
- `xxl (32)` — separação entre seções.

> **Hierarquia espacial é obrigatória:** maior espaço entre seções, menor entre elementos
> relacionados. Nunca `gap`/`padding` uniforme em tudo.

### 1.4 Raio (geometria fluida — variação intencional por função)

| Token | px | Aplicado a |
|---|---|---|
| `tag` | 4 | Tags de dado (sharp) |
| `thumb` | 8 | Miniatura de exercício |
| `card` / `input` | 12 | Cards, inputs, botão secundário/ghost |
| `modal` | 24 | Modais, bottom sheets |
| `pill` | 100 | Botão primário, chips de filtro, avatares, toggles |

> O **shape distingue hierarquia**: primário é `pill`, secundário/ghost é `12`. Nunca o mesmo
> raio em todos os elementos.

### 1.5 Tipografia

**Famílias** (carregadas via `@expo-google-fonts` no mobile; `@import` Google Fonts no web):

- **Barlow Condensed** (display) — `800 ExtraBold`, `900 Black`. Títulos e rótulos, **caixa alta**.
- **Barlow** (corpo) — `400 / 500 / 600 / 700`. Texto corrido.
- **Share Tech Mono** (dados) — `400`. Números, eyebrows, metadados.

> **Proibido:** Inter · Roboto · Poppins · Open Sans · Lato · Geist · DM Sans · Manrope ·
> Space Grotesk · system-ui. (ver §08)

**Escala** — variantes do átomo `AppText` (família · tamanho · tracking · caixa):

| Variante | Família | px | Tracking | Caixa | Uso |
|---|---|---|---|---|---|
| `d1` | Condensed Black | 72 | -1px | UPPER | Display hero |
| `h1` | Condensed Black | 48 | — | UPPER | Título de tela grande |
| `h2` | Condensed ExtraBold | 32 | — | UPPER | Título de tela |
| `h3` | Condensed ExtraBold | 22 | — | UPPER | Título de card |
| `h4` | Condensed ExtraBold | 18 | — | UPPER | Item de lista (denso) |
| `label` | Condensed ExtraBold | 14 | 18% (~2.5px) | UPPER | Rótulos, abas, botões |
| `eyebrow` | Mono | 10 | 30% (3px) | UPPER | Sobre-título |
| `dataBig` | Mono | 36 | 8% (~2.9px) | — | KPI grande |
| `dataMed` | Mono | 18 | 12% | — | KPI médio |
| `metaSmall` | Mono | 11 | 15% | — | Meta/legenda |
| `bodyLg` | Barlow | 18 | — | — | Corpo grande |
| `bodyMd` | Barlow | 15 | — | — | Corpo padrão |
| `bodySm` | Barlow | 13 | — | — | Corpo pequeno |

**Fora da escala** (números-herói): `timerHero 88` (sessão de treino) · `inputHero 40` (input grande).

> Salto mínimo de **3× entre corpo e headline**. Pareamento de alto contraste display + mono
> é parte da identidade — não é decoração.

### 1.6 Motion

| Token | Valor | Uso |
|---|---|---|
| `screenMs` | 300ms | Transição de entrada de tela (`AnimatedPage`) — opacity, às vezes + translateY 12px |
| `microMs` | 150ms | Press de botão, toggle, micro-interação |
| `easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | Padrão único (Material out) |

**Regra operacional:** *um único momento de motion por tela* — geralmente o reveal de entrada.
Conteúdo de IA surge suave de baixo para cima ("reveal generativo").

---

## 02 · Componentes (app mobile — referência canônica)

Os componentes do web são **paridade** destes — mesmos tokens, mesma hierarquia (§06).
Local: `app/src/components/ui/` e `app/src/components/<domínio>/`.

### 2.1 Botões (`Button`)

| Variante | BG | Borda | Texto | Raio | Press |
|---|---|---|---|---|---|
| **Primary** | `neon` | — | `textInverse`, Condensed 800 UPPER | `pill` | scale 0.98 + haptic |
| **Secondary** | transparente | 1px `outline` | `textPrimary` | `12` | ghost ao press |
| **Ghost** | transparente | — | `textSecondary` | `12` | BG `surface2` ao press |

Padding 16 (`lg`), gap ícone+label 8 (`sm`).
**Loading = pulso de opacidade** sobre o próprio fill — **nunca spinner, nunca gradiente.**

### 2.2 Campos (`Input`)

- **Default:** BG `surface1`, 1px `outlineVariant`, raio `12`, padding `md`.
- **Foco:** borda `neon` + glow externo sutil (`surfaceTint`) — único glow do app. Transição 150ms.
- **Erro:** borda `error` (instantâneo). `invalid` = borda vermelha sem mensagem.
- Label em `eyebrow`/`tertiary` acima, gap `xs`. Toggle de senha: Phosphor `Eye/EyeSlash` duotone.

### 2.3 Cards

- **Neutro:** BG `surface1`, 1px `outlineVariant`, raio `card`. Padrão de listas/blocos. **Sem sombra.**
- **Elevado:** BG `surface2` + sombra sutil — insight/IA, "dado confiável".
- **Com foto:** `cardPhotoScrim` sobre a imagem; meta/CTA sobre base sólida.
- **Hero (`ScreenHero`):** imagem + `heroScrim` dissolvendo em `bgBase`; back em `CircularView` com scrim `overlay`.
- **Sombra só em** modal, sheet, dropdown e card elevado — **nunca** em card neutro.

### 2.4 Tags, chips & selos (`Tag`)

| Tom | Fundo | Texto |
|---|---|---|
| `neutral` | `surface2` | `textSecondary` |
| `active` | **`neon`** | `textInverse` (estado selecionado) |
| `success` | `success` | `textInverse` |
| `warning` | `warning` | `textInverse` (selo de **Atenção**) |
| dados (névoa) | `accentMutedSurface` | `accentMuted` |

Raio `tag` (4) para tag de dado; `pill` (100) para chip de filtro/seleção. Texto `eyebrow` (10 mono).

### 2.5 Dados (`KpiNumber` / `KpiCard`)

Número em **Share Tech Mono** (`dataBig 36` / `dataMed 18`), cor `neon` ou `primary`, unidade
opcional em `metaSmall`/`tertiary`. O **KPI card** compõe número + rótulo em card neutro (web
destaca com borda neon).

### 2.6 Navegação (`ActusTabBar`)

- **Aluno:** 4 abas — HOJE · TREINOS · DESAFIOS · PERFIL + **botão central neon sólido** (inicia o treino do dia; sem glow/halo/sombra).
- **Personal:** 5 abas — INÍCIO · ALUNOS · TREINOS · DESAFIOS · PERFIL.
- **Nutri:** 4 abas — INÍCIO · ALUNOS · DIETAS · PERFIL.
- Ícones **Phosphor duotone** (24px; 20px em ≥5 abas); rótulo `label`; aba ativa em `neon` com sublinhado neon (30×3px, raio 2, anima 200ms).

### 2.7 Controles compostos

- **Segmented control** (ex.: "Meus | Banco"): trilho `surface1` raio `pill`; ativo `neon`/`inverse`; inativo `textSecondary`.
- **Chips de filtro:** linha horizontal de pills; ativo `neon`, inativo `surface2`.
- **Quick action** (Dashboard): card neutro + ícone duotone em bolha `surface2` + rótulo `label`.
- **Toggle Sim/Não** (Par-Q): par de pills; selecionado `neon`/`inverse`.
- **Miniatura de exercício:** thumb raio `thumb` (8) com `veil` sobre a foto.

### 2.8 Estados de lista (`ListState`)

- **Loading:** varredura suave de opacidade — **não spinner.**
- **Empty:** ícone duotone + título + mensagem + CTA opcional.
- **Error:** discreto, com "Tentar de novo".

### 2.9 Feedback transitório (web — `Toast`)

`surface2`, borda 1px, raio `xl`, texto mono `xs`, sombra; fixo bottom-right; entra com `rise-in`
180ms; auto-dismiss 4s. Tons: `default` e `error`.

---

## 03 · Padrões de tela

### 3.1 Layout
**Uma intenção primária por tela.**
1. Header limpo (marca + nav). 2. Zona primária (hero card que responde ao objetivo).
3. CTA primário `neon` de alto contraste. 4. Dados secundários em `textSecondary` sobre `surface1`.

### 3.2 Arquétipo "Painel" (exceção consciente)
A landing do profissional (aba **Início**) é um dashboard multi-bloco (saudação + KPIs + ações
rápidas + recentes) e **relaxa** a regra "uma intenção por tela". É o único arquétipo de
visão-resumo; demais telas seguem foco único.

### 3.3 Dados vs. insight
Dado bruto em **mono**/tabelas estruturadas; insight processado/IA em **card elevado**
(`surface2`) com linguagem natural.

### 3.4 Formulários & wizards
Passos guiados com `WizardProgress` (rótulos mono `01 / CONVITE`). Validação inline; erro
roteado ao passo de origem.

---

## 04 · Ícones, imagens & assets

- **Ícones:** Phosphor (`phosphor-react-native` no mobile), weight **`duotone`** sempre.
  **Proibido:** Lucide · Heroicons · Tabler · Feather. O web hoje usa SVG inline — ao adicionar
  biblioteca, usar Phosphor para manter paridade.
- **Logo (`Logo`):** SVG, 3 variantes (`symbol` · `horizontal` · `vertical`), cores `neon` ou `dark` (`#141414`).
- **Imagens:** screenshots reais do produto e fotografia real de contexto. **Nunca** Unsplash
  genérico, unDraw/Storyset/Humaaans, isométrico pastel, blobs 3D "smooth plastic", avatar com
  iniciais em produção. Catálogo de exercícios em `app/assets/wger/` (atribuição em `ATTRIBUTION.md`).

---

## 05 · Movimento & gestos

- `AnimatedPage`: opacity 0→1 + translateY 12→0, `screenMs` (só mobile; web omite por velocidade).
- Micro: press scale 0.98 (`microMs`); tab underline desliza 200ms; toggle de senha instantâneo.
- Gestos: `HeroCarousel` (pan), `ImageLightbox` (pinch/zoom) via gesture-handler + Reanimated.
- Web: `useLenis` (smooth scroll) + GSAP ScrollTrigger na landing; `rise-in` 180ms em modal/toast.

---

## 06 · Paridade Web ↔ Mobile

O painel web é a mesma marca em outra stack. Regras de equivalência:

| Conceito | Mobile | Web (Tailwind v4) |
|---|---|---|
| Cor de ação | `theme.colors.neon` | `bg-neon` / `text-neon` / `border-neon` |
| Botão primário | pill, neon, Condensed UPPER | `rounded-full bg-neon text-text-inv font-display font-black uppercase` |
| Botão secundário | outline, raio 12 | `rounded-full border-outline` (atenção: web usa pill — **alinhar ao raio 12 do sistema**) |
| Card neutro | `surface1` + `outlineVariant` | `rounded-xl border-outline-v bg-surface-1` |
| Foco de input | borda neon + glow | `focus:border-neon` |
| Tipografia | `AppText variant=...` | classes `font-display`/`font-body`/`font-mono` + size |
| Header | `TopBar` 52px conceitual | header `h-[52px] bg-bg-lowest border-outline-v` |

> **Divergências conhecidas a corrigir no web:** botão secundário usa `rounded-full` (deveria ser
> raio 12 para distinção de shape); falta biblioteca de ícones (deveria ser Phosphor duotone).

---

## 07 · Landing (subsistema light)

A landing é editorial e **light** — referência visual reconstruída de `bevel.health`
(material em `www_bevel_health/`). Não usa a paleta dark do app; é o único contexto claro.

- **Fundo:** `#fff`. **Texto:** `#222326` / `rgba(34,35,38,0.65)` / `rgba(34,35,38,0.5)`.
- **Superfícies claras:** `rgba(255,255,255,0.7)`, `#f6f7f9`, `#f0f2f5`.
- **Tipografia:** display Barlow Condensed mantém a marca; corpo pode cair em system stack
  (`-apple-system, "SF Pro Display", Inter`). Tamanhos com `clamp()` responsivo.
- **Motion:** GSAP ScrollTrigger + Lenis (parallax de phones, stagger de texto, accordion, pin).
  Respeitar §08: **um** momento alto-impacto, não fade-up em tudo.
- **Sombras:** `drop-shadow` editorial nos mockups de phone; sombra suave de navbar ao scroll.
- **Estrutura:** composição editorial assimétrica — **não** a fórmula AI-slop de LP (ver §08).

A landing pode divergir visualmente do app, mas **nunca** das restrições anti-slop (§08) nem da voz (§09).

---

## 08 · Restrições anti-slop (obrigatórias)

Evitar o "AI slop aesthetic" (Tailwind + shadcn/ui + v0 genérico). Originalidade é requisito, não opção.

**Tipografia — nunca:** Inter/Roboto/Open Sans/Lato/Poppins/Geist/DM Sans/Manrope/Space
Grotesk/system-ui; fonte única sem pareamento; peso uniforme (só 400); salto < 2× entre tamanhos.

**Cores — nunca:** indigo/violet/blue/cyan como primária; gradiente purple→blue como cor
principal; glow neon/cyan/violet como atalho "tech"; gradiente decorativo em hero/nav/background
(ok só em **1** elemento de ação); glassmorphism (backdrop-blur) como recurso padrão; blur
radial atrás de hero; feedback herdado do Tailwind (lime/tomato) em vez de token explícito.

**Ícones & componentes — nunca:** Lucide/Heroicons/Tabler/Feather; estética out-of-the-box de
shadcn/Aceternity/Magic UI/21st.dev (Radix headless **estilizado do zero** é ok); efeitos
aurora/beams/meteors/sparkles/spotlight/text-generate/typewriter; botão pill roxo "Get Started →";
ghost idêntico ao primário em tamanho e shape.

**Cards/espaçamento/sombras — nunca:** mesmo `rounded-xl` em tudo; `shadow-sm ~0.1` em todo
card; padding uniforme sem hierarquia; sombra sem elevação semântica real.

**Layout — nunca a fórmula AI-slop de LP:** nav → hero centralizado + 2 CTAs → barra "Trusted
by" cinza → 3 feature cards idênticos → bento grid 4 quadrantes → zig-zag screenshot → stats 3-4
colunas → pricing 3 colunas com card central "Most Popular" → carrossel de testimonials → FAQ
accordion → CTA full-width = cópia do hero → footer 5 colunas. Preferir composições
assimétricas, editoriais, scroll-driven; variar densidade entre seções.

**Motion — nunca:** fade-in+slide-up em todos os elementos (whileInView default); marquee de
logos; hover-lift em todo card; backgrounds animados Aceternity; typewriter no headline.
**Sempre:** 1 momento orquestrado + motion motivado por ação do usuário.

**Imagens — nunca:** Unsplash genérico, unDraw/Storyset/Humaaans/Ouch, isométrico 3D pastel,
Lottie genérica (foguete/gráfico/engrenagem), blobs 3D "smooth plastic", avatar de iniciais
(ui-avatars/Dicebear) em produção. **Sempre:** screenshots reais, fotografia real, ilustração de domínio.

**Nota sobre produto:** convenções de UX legítimas (sidebar, tabela avatar+nome, ⌘K, empty
state) são ok mesmo que a IA as gere por padrão. O diferencial está nos **detalhes** —
tipografia do KPI, transição entre estados, microcopy do empty, ícones de domínio — não em
reinventar navegação consolidada. Não troque um clichê por outro (brutalist / "Linear-wannabe").

---

## 09 · Voz & copy

1. **Quiet Luxury:** composto, premium, sem gritar. Guiamos, não alardeamos.
2. **Inteligente & adaptativo:** feedback personalizado, orientado a dados.
3. **Motivação refinada:** *"Meta atingida. Postura mantida."* — nunca *"🎉 ARRASOU! 💪"*.

**Nunca** — headlines: "Transforme seu X" · "A plataforma tudo-em-um" · "Tudo que você precisa
para Y" · "Powered by AI" como proposta única. **Buzzwords proibidas (PT):** transforme ·
revolucione · desbloqueie · eleve · potencialize · otimize · simplifique · escale · impulsione ·
robusto · escalável · inovador · disruptivo · intuitivo · perfeito · sem esforço · de ponta ·
próxima geração · sob medida · completo. **CTAs proibidos:** "Comece Agora" · "Saiba Mais" ·
"Experimente Grátis" · "Agende uma Demo" · "Cadastre-se". **Sem** em-dash decorativo em série,
bullet com emoji, listas sempre de 3 itens, negrito aleatório no meio do parágrafo.

**Sempre** — headline específica e verificável, com substantivos concretos e números reais; voz
de fundador (1 usuário, 1 problema, 1 frase); CTA com verbo ligado ao outcome real (*"Ver minha
semana de treino"*, *"Iniciar treino"*); microcopy variando formato e densidade; frases curtas,
parágrafo de no máximo 3 linhas.

---

## ◆ A regra de ouro

**Elegância através de performance.** Todo componente deve parecer premium **e** renderizar com
eficiência absoluta. A estética é calma; a arquitetura por baixo é implacavelmente rápida.

---

### Procedência

- Tokens e componentes: `app/src/theme/tokens.ts`, `app/src/components/`, `web/src/index.css`, `web/src/components/ui/`.
- Consolida: `backend/design.md` (v2.0), `backend/SOMO_DESIGN_CONSTRAINTS.md`, `app/docs/decisoes-visuais-bloco-1.md`.
- Landing: `www_bevel_health/` (referência visual reconstruída).
