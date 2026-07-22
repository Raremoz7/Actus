# Actus Design System · v2.0

> **Versão definitiva** — reflete o visual **implementado** do app (fonte de verdade do
> código: `app/src/theme/tokens.ts` + os componentes em `app/src/components/`). Onde o
> v1.0 divergia do que foi construído, esta versão alinha à realidade do produto.
> Restrições anti-AI-slop obrigatórias: ver `SOMO_DESIGN_CONSTRAINTS.md`.
>
> **Regra de ouro de implementação:** nada de hex/valor solto em componente — sempre
> importar de `tokens.ts` (consumido via Unistyles 3 + o átomo `AppText`).

Estética: **Quiet Luxury, Dark Mode único**. Calmo, premium, orientado a dados. Inspiração
arquitetônica (curvas, profundidade por camadas de superfície), neon como única cor de ação.

---

## 01 · Fundações

### 1.1 Paleta de cores

**Fundos & superfícies** (escuro → claro, profundidade gradual):
| Token | Hex | Uso |
|---|---|---|
| `bgLowest` | `#10252D` | Fundo da tela (splash, base) |
| `bgBase` | `#1A343F` | Corpo de conteúdo |
| `surface1` | `#203F4B` | Cards padrão, inputs |
| `surface2` | `#294B58` | Card elevado, chip neutro, ícone-bolha |
| `surface3` | `#345867` | Camada intermediária |
| `surface4` | `#406575` | Borda de toggle/realce sutil |

**Marca & acento:**
| Token | Hex | Uso |
|---|---|---|
| `neon` | `#CBFE00` | **Única cor de ação** — CTA primário, estado ativo, foco, KPI |
| `secondary` | `#4DE082` | Sucesso/positivo discreto |
| `surfaceTint` | `#ABD600` | Glow de foco do input |
| `accentMuted` | `#7BA0BC` | **Azul-névoa** — dados/estrutura: eyebrows, abas/valores secundários, divisórias. **Nunca** como ação (isso é do neon) nem aviso (isso é do `info`) |
| `accentMutedSurface` | `rgba(123,160,188,0.16)` | Fill de chip/badge secundário |

**Texto & contornos:**
| Token | Valor | Uso |
|---|---|---|
| `textPrimary` | `#FFFFFF` | Texto principal |
| `textSecondary` | `rgba(255,255,255,0.70)` | Texto de apoio |
| `textTertiary` | `rgba(255,255,255,0.50)` | Meta/legenda |
| `textInverse` | `#141414` | Texto sobre neon/fundo claro |
| `onSurface` | `#E2E4CF` | Texto sobre superfícies tonais específicas |
| `outline` | `#8E9379` | Borda de botão secundário |
| `outlineVariant` | `#444933` | Borda de card/input/divisória |

**Semânticas / feedback:**
| Token | Hex | Uso |
|---|---|---|
| `success` | `#4ADE80` | Confirmação |
| `warning` | `#FBBF24` | **Atenção** (ex.: selo de Par-Q com "sim") |
| `error` | `#F87171` | Erro |
| `info` | `#60A5FA` | Aviso pontual informativo |
| `flame` | `#F97316` | **Exceção consciente ao neon:** só no símbolo de streak (chama) |

**Overlays:** `overlay` `rgba(16,37,45,0.7)` (scrim de modal/sheet) · `veil`
`rgba(16,37,45,0.28)` (véu sobre foto de exercício) · `shadow` `#000000`.

### 1.2 Gradientes (135°, via expo-linear-gradient)

- `brand`: `#CBFE00 → #A2CB00` — realces de marca.
- `streak`: `#F97316 → #EF4444` — sequência/chama.
- `heroScrim` + `heroScrimLocations [0,0.3,0.68,1]` — foto do hero do exercício dissolve na
  cor do corpo (`bgBase`) sem corte seco, garantindo leitura do título.
- `cardPhotoScrim` + `cardPhotoScrimLocations [0,0.48,0.86]` — foto discreta no topo do card,
  meta/CTA sobre base sólida (`surface1`).

### 1.3 Espaçamento, raio e tipografia

**Espaçamento (base 4pt):** `xs 4` · `sm 8` · `md 12` · `lg 16` · `xl 24` · `xxl 32`.

**Raio (geometria fluida):** `tag 4` · `thumb 8` (miniatura de exercício) · `card 12` ·
`input 12` · `modal 24` · `pill 100` (botões, chips, avatares, toggles).

**Famílias:**
- **Barlow Condensed** (display): `800 ExtraBold`, `900 Black` — títulos e rótulos, **caixa alta**.
- **Barlow** (corpo): `400/500/600/700` — texto corrido.
- **Share Tech Mono** (dados): `400` — números, eyebrows, metadados.
- Proibido: Inter / Roboto / Poppins.

**Escala tipográfica** (variantes do átomo `AppText` — família · tamanho · caixa):
| Variante | Família | px | Caixa | Uso |
|---|---|---|---|---|
| `d1` | Condensed Black | 72 | UPPER | Display hero |
| `h1` | Condensed Black | 48 | UPPER | Título de tela grande |
| `h2` | Condensed ExtraBold | 32 | UPPER | Título de tela |
| `h3` | Condensed ExtraBold | 22 | UPPER | Título de card |
| `h4` | Condensed ExtraBold | 18 | UPPER | Item de lista (denso) |
| `label` | Condensed ExtraBold | 14 (tracking 18%) | UPPER | Rótulos, abas |
| `dataBig` | Mono | 36 (tracking 8%) | — | KPI grande |
| `dataMed` | Mono | 18 (tracking 12%) | — | KPI médio |
| `metaSmall` | Mono | 11 (tracking 15%) | — | Meta/legenda |
| `eyebrow` | Mono | 10 (tracking 30%) | UPPER | Sobre-título |
| `bodyLg/Md/Sm` | Barlow | 18 / 15 / 13 | — | Corpo |

Fora da escala (números-herói): `timerHero 88`, `inputHero 40`.

**Motion:** transição de tela `300ms`, micro-interação `150ms`, easing
`cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 02 · Componentes

### 2.1 Botões (`Button`)
- **Primary:** BG `neon`, texto `textInverse`, **Barlow Condensed 800 UPPER**, radius `pill`,
  padding 16. Press: scale `0.98` + haptic. **Loading = opacidade sobre o próprio fill neon**
  (sem spinner, sem gradiente).
- **Secondary:** transparente, 1px `outline`, texto `textPrimary`, radius `12` (shape distinto do primário).
- **Ghost:** sem borda, texto `textSecondary`.

### 2.2 Campos (`Input`)
- Default: BG `surface1`, 1px `outlineVariant`, radius `12`.
- Foco: borda `neon` + glow externo sutil (`surfaceTint`) — **único glow do app**.
- Toggle de senha: Phosphor `Eye/EyeSlash` duotone.

### 2.3 Cards
- **Neutro:** BG `surface1`, 1px `outlineVariant`, radius `card`. Padrão de listas e blocos.
- **Elevado:** BG `surface2` + sombra sutil — insight/IA, "dado confiável".
- **Com foto:** `cardPhotoScrim` sobre a imagem; meta/CTA sobre base sólida.
- **Hero (`ScreenHero`):** imagem + `heroScrim` dissolvendo em `bgBase`.
- **Sombra só em** modal, sheet, dropdown e card elevado — nunca em card neutro.

### 2.4 Tags, Chips & Selos (`Tag` / badges)
Tons (token de fundo · texto):
- **`neutral`:** `surface2` · `textSecondary`.
- **`active`:** **`neon`** · `textInverse` (estado selecionado — supersede o "Primary Container" do v1.0).
- **`success`:** `success` · `textInverse`.
- **`warning`:** `warning` · `textInverse` — **selo de Atenção** (ex.: Par-Q com "sim").
- Secundário de dados (névoa): `accentMutedSurface` · `accentMuted`.
- Radius `tag` (4) para tags de dado; `pill` (100) para chips de filtro/seleção.

### 2.5 Dados (`KpiNumber`)
Número em **Share Tech Mono** (`dataBig 36` / `dataMed 18`), cor `neon` ou `primary`, unidade
opcional em `metaSmall`/`tertiary`. Compõe o **KPI card** (número + rótulo em card neutro).

### 2.6 Navegação (`ActusTabBar`)
- **Aluno:** 4 abas (HOJE · TREINOS · DESAFIOS · PERFIL) + **botão central neon sólido** que inicia o treino do dia (sem glow/halo/sombra).
- **Personal:** 5 abas (INÍCIO · ALUNOS · TREINOS · DESAFIOS · PERFIL).
- **Nutri:** 4 abas (INÍCIO · ALUNOS · DIETAS · PERFIL).
- Ícones **Phosphor duotone**; rótulo `label` (Condensed 800 UPPER). Aba ativa em `neon`.

### 2.7 Controles compostos (padrões reutilizáveis do produto)
- **Segmented control** (ex.: "Meus | Banco"): trilho `surface1` radius `pill`, segmento ativo `neon`/`textInverse`, inativo `textSecondary`.
- **Chips de filtro** (ex.: objetivo do Banco): linha horizontal de pills; ativo `neon`, inativo `surface2`.
- **Quick action** (Dashboard): card neutro com ícone duotone em bolha `surface2` + rótulo `label`.
- **Toggle Sim/Não** (Par-Q): par de pills; selecionado `neon`/`inverse`.
- **Miniatura/Card de exercício:** thumb radius `thumb` (8) com `veil` sobre a foto.

### 2.8 Estados de lista (`ListState`)
- **Loading:** varredura suave de opacidade (não spinner).
- **Empty:** ícone duotone + título + mensagem + CTA opcional.
- **Error:** discreto, com "Tentar de novo".

---

## 03 · Padrões

### 3.1 Layout de tela
**Regra geral: uma intenção primária por tela.**
1. Header limpo (marca + nav).
2. Zona primária (hero card que responde ao objetivo principal).
3. CTA primário em `neon`, alto contraste.
4. Dados secundários em `textSecondary` sobre `surface1`.

### 3.2 Arquétipo "Painel" (exceção consciente)
A landing do profissional (aba **Início**) é um **dashboard multi-bloco** — saudação + KPIs +
ações rápidas + recentes — e **relaxa intencionalmente** a regra "uma intenção por tela". É o
único arquétipo de visão-resumo; demais telas seguem o foco único.

### 3.3 Dados vs. Insight
Dado bruto em **mono**/tabelas estruturadas; insight processado/IA em **card elevado**
(`surface2`) com linguagem natural.

### 3.4 Formulários & wizards
Cadastro e builders usam passos guiados com `WizardProgress` (rótulos mono `01 / CONVITE`).
Validação inline; erros roteados ao passo de origem.

---

## 04 · Voz & Movimento

### 4.1 Voz & tom
1. **Quiet Luxury:** composto, premium, sem gritar. Guiamos, não alardeamos.
2. **Inteligente & adaptativo:** feedback personalizado, orientado a dados.
3. **Motivação refinada:** *"Meta atingida. Postura mantida."* — nunca *"🎉 ARRASOU! 💪"*.
4. Copy específica, sem buzzword, sem "Comece agora"/"Saiba mais", **sem emoji em bullet**.

### 4.2 Movimento
- **Um único momento de motion por tela** (regra operacional). Geralmente o **reveal de entrada**
  (opacity, às vezes + translateY 12px, `300ms`).
- Micro-interações `150ms` (press de botão, toggle) — nunca abruptas.
- **Reveal generativo:** conteúdo de IA surge suave de baixo para cima.
- Ícones sempre **Phosphor duotone** — nunca Lucide/Heroicons.

---

### ◆ A REGRA DE OURO

**Elegância através de performance.** Todo componente deve parecer premium **e** renderizar com
eficiência absoluta. A estética é calma; a arquitetura por baixo é implacavelmente rápida.

---

> **Changelog v2.0** (vs v1.0): paleta completa (surfaces 1–4, `accentMuted`/azul-névoa,
> `flame`, `info`, overlays e scrims); gradientes hero/card; escala tipográfica completa com
> mapeamento por variante do `AppText`; raio `thumb`; tom de tag **`warning`/Atenção**;
> chip ativo oficializado em **neon** (era "Primary Container"); navegação real por papel
> (aba **Início** no personal/nutri); arquétipo **Painel**; controles compostos
> (segmented, chips de filtro, quick action, toggle Sim/Não). Doc em pt-BR.
