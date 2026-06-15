# Apresentação Actus × World Gym — Spec de Design

> Data: 2026-06-15 · Branch: `branch/davi` · Autor: Davi (Somo)
> Objetivo da reunião que o deck apoia: **fechar um piloto com a World Gym.**

## 1. Objetivo do artefato

Uma página de "slides" **standalone** (sem backend, sem build) para apoiar uma apresentação **presencial**. Prioridade absoluta em **impacto visual**: transições **disruptivas e não-repetitivas** (jornada espacial 3D), com uma **virada de tema** para a identidade World Gym (vermelho/branco/grafite) nos slides do produto e da parceria, voltando ao Actus (dark + neon) no restante.

Não é a landing nem o produto — é um deck de palco. Roda num laptop, idealmente à prova de falha mesmo **sem internet**.

## 2. Decisões fechadas (validadas com mockups no companion)

| Tema | Decisão |
|---|---|
| **Motor** | **impress.js** (câmera 3D: zoom/rotação/pan numa tela infinita) + **GSAP** (animações dentro de cada step, disparadas por eventos do impress) |
| **Local / execução** | Pasta **`apresentacao/`** na raiz do repo. HTML/CSS/JS puro. Abre `index.html` direto (ou `npx serve apresentacao`). **Sem backend, sem build, sem bundler.** |
| **Telas do app** | **Recriadas em HTML fiel** ao design system (frames de celular), animáveis — não capturas. |
| **Direção visual** | **A — Editorial Quiet Luxury**: muito respiro, headline Barlow Condensed gigante, eyebrow mono, **um único acento neon**, hairlines `outlineVariant`, painel de superfície sutil. |
| **Modo World Gym** | Aplica-se aos **slides 6 e 7**. Fundo vermelho `#C8102E` + tipo branco + painel **grafite** (cinza). Acento neon some → branco. **Logo oficial da World Gym em branco** (recolorido via filtro CSS; arquivo tem alpha). |
| **Virada de tema** | *Wipe* vermelho cobre o slide ao entrar no bloco World Gym; *wipe* dark/neon na volta ao Actus. Reforça a câmera do impress no limite do tema. |
| **Fontes** | **Self-hosted** (woff2 locais + `@font-face`) para robustez offline. |

## 3. Identidade visual

### 3.1 Modo Actus (default — slides 1–5, 8, 9)
Tokens do design system (`DESIGN_SYSTEM.md` é a fonte de verdade):

- **Fundos/profundidade:** `#10252D` (lowest), `#1A343F` (base), `#203F4B` (surface1), `#294B58` (surface2).
- **Acento (única ação):** neon `#CBFE00`. Dados/estrutura: azul-névoa `#7BA0BC`.
- **Texto:** `#FFFFFF`, `rgba(255,255,255,.70)`, `rgba(255,255,255,.50)`. Sobre neon: `#141414`.
- **Hairlines:** `#444933` (outlineVariant).
- **Tipografia:** Barlow Condensed (800/900, UPPER) display; Share Tech Mono (eyebrows, dados, índices); Barlow (400/500/600) corpo. Salto ≥3× corpo↔headline.

### 3.2 Modo World Gym (slides 6 e 7)
- **Fundo:** vermelho `#C8102E` (com `#A20C24` para profundidade no rodapé/gradiente sutil).
- **Painel grafite (cinza):** `#26292B` / `#1C1F20` — traz o "cinza" e contrasta com o vermelho.
- **Texto:** branco `#FFFFFF` / `rgba(255,255,255,.72)` / `.50`. Hairlines em branco translúcido.
- **Acento:** branco (substitui o neon). **Sem neon** neste modo.
- **Logo World Gym:** `Logos/world gym logo.webp` recolorido para branco com `filter: brightness(0) invert(1)` (fundo transparente confirmado — VP8X com bit alpha). Eco discreto do **globo** da marca como textura no painel grafite.
- **Co-branding invertido:** WORLD GYM (logo) é primário; ACTUS aparece como "motor de produto".

A oposição Actus↔World Gym é **proposital** — é o pico de impacto do deck.

## 4. Arco narrativo — 9 slides

Estrutura aprovada (do material do Davi). Cada slide tem: conteúdo, modo de tema e o **movimento de câmera** (cada um distinto — nenhuma transição se repete).

| # | Slide | Modo | Movimento de câmera (impress) |
|---|---|---|---|
| 1 | **Capa** — "A próxima camada de operação, dados e receita da World Gym." + co-brand | Actus | Estado inicial (scale 1, rot 0) |
| 2 | **Hook** — "O aluno passa poucas horas na academia. E em todas as outras?" | Actus | **Mergulho** (zoom-in profundo num ponto) |
| 3 | **Contexto** — "O próximo crescimento não vem só da catraca." + 3 micro-atritos + card de insight | Actus | **Pan lateral** + leve rotação |
| 4 | **A virada (reframe)** — "Transformar força física em camada digital…" | Actus | **Rotação Z** (o espaço inclina) |
| 5 | **3 Pilares** — Distribuição · Inteligência · Receita transacional (substeps acendem em sequência) | Actus | **Zoom-out revela** os 3 cartões no espaço; pan entre eles |
| 6 | **A solução / produto** — "App World Gym, powered by Actus." + mockups de device | **World Gym** | *Wipe* vermelho + **rotação Y** (porta 3D) entrando no mundo vermelho |
| 7 | **Nós e vocês** — duas colunas (Actus traz / a parceria destrava) | **World Gym** | **Pan** dentro do mundo vermelho |
| 8 | **A visão (clímax)** — "A academia deixa de ser só onde o aluno treina…" | Actus | *Wipe* dark/neon + **zoom-out vasto** e assenta |
| 9 | **Próximos passos (CTA único)** — "Vamos desenhar o piloto?" + 3 compromissos | Actus | **Zoom-in** no CTA e assenta |

Princípios herdados do material: uma ideia por slide; o slide carrega a imagem, o apresentador o texto; sem agenda/divisórias numeradas.

## 5. Telas do app recriadas (HTML fiel, em frames de celular)

Reconstruídas com os tokens reais (não capturas, não stock). Animáveis (entram com GSAP nos slides). Conjunto inicial de **alto impacto**, usado nos slides 5 e 6:

1. **Aluno — "Hoje"**: saudação, fita da semana com dia atual, card do treino do dia, dieta vigente, desafios ativos.
2. **Aluno — Sessão guiada**: stepper de exercício (foto/gif, séries, timer-herói, check-in).
3. **Personal — Início/Dashboard**: KPIs (alunos, treinos, desafios), ações rápidas, bloco de engajamento (adesão, check-ins, inativos).
4. **Nutri — Construtor de dieta**: refeições + macros (proteína/carbo/gordura/kcal), totalizador do dia.
5. **Par-Q**: status apto/atenção/revisão (selo de Atenção em `warning`).
6. **Desafio — ranking** (opcional, se sobrar fôlego): pódio/lista com progresso.

**Variante World Gym (slide 6):** 1–2 telas-herói re-skin em vermelho ("o app com a marca de vocês"), para reforçar "App World Gym, powered by Actus". As demais permanecem no neon Actus.

## 6. Transições — a coreografia (o coração do "uau")

- **impress.js** posiciona cada step em coordenadas 3D distintas (x/y/z/rotação/escala) → cada navegação é um movimento diferente (mergulho, pan, rotação Z, rotação Y, zoom-out vasto…). **Não-repetição** vem da variedade espacial planejada na tabela §4.
- **GSAP** anima o conteúdo **dentro** do step no evento `impress:stepenter` (reveal generativo de baixo p/ cima, stagger de linhas da headline, acender de cartões em sequência), e limpa no `impress:stepleave`.
- **Wipe de tema:** overlay full-screen. Ao entrar no slide 6, um wipe **vermelho** varre a tela e revela o mundo World Gym; ao sair do slide 7 para o 8, um wipe **dark + filete neon** varre de volta. Sincronizado com o movimento de câmera no limite do tema.
- **`prefers-reduced-motion`:** fallback sem animação (conteúdo visível, sem transform/keyframes) — boa prática e segurança de palco.

## 7. Estrutura de arquivos

```
apresentacao/
  index.html              # deck impress.js (os 9 steps)
  css/
    tokens.css            # variáveis: modo Actus + modo World Gym
    deck.css              # layout dos slides, tipografia, componentes
    screens.css           # estilos dos frames de celular + telas do app
    transitions.css       # wipes de tema, classes de reveal
  js/
    impress.min.js         # lib (vendorizada)
    gsap.min.js            # lib (vendorizada)
    deck.js               # hooks de stepenter/stepleave → GSAP, wipes
  assets/
    fonts/                # Barlow Condensed, Barlow, Share Tech Mono (woff2)
    logos/                # actus (svg) + world gym (webp, e versão branca)
    screens/              # imagens de exercício/foto se necessárias (locais)
  README.md               # como rodar (abrir index.html ou npx serve)
```

Telas do app: **componentes HTML** inline no `index.html` (ou parciais incluídos manualmente — sem build, então inline). Cada frame de celular é um bloco reutilizável estilizado por `screens.css`.

## 8. Navegação & uso no palco

- Setas / Space / PgUp-PgDn (padrão impress.js) + clique. Dica de navegação discreta no canto.
- `Esc`/overview opcional (impress tint/overview plugin) — fora de escopo no v1.
- Tela cheia (F11). Otimizado para 16:9 (1920×1080). Não há responsividade mobile fina.

## 9. Robustez (à prova de palco)

- **Offline-first:** fontes e libs (impress, gsap) **vendorizadas** localmente; nenhuma dependência de CDN em runtime.
- **Sem backend, sem rede.** Abre por `file://` ou `npx serve`.
- Imagens (foto de exercício etc.) locais em `assets/`.
- Fallback `reduced-motion` e fallback do impress para navegador sem suporte (mensagem simples).

## 10. Fora de escopo (YAGNI)

- Responsividade mobile fina (é deck de palco em tela grande).
- Editor/CMS de slides, exportação PDF, modo apresentador com notas (pode virar v2).
- i18n (só PT-BR).
- Integração com backend/produto.
- Overview/impressionist plugins extras.

## 11. Pendências de conteúdo (placeholders no v1)

- Nome do apresentador e e-mail/contato no slide 9 (CTA) → placeholder `[apresentador]` / `[contato]`.
- Texto fino do hook (número retórico, se usado) — ilustrativo, não citar como dado.
- Logo Actus: usar SVGs de `Logos/` (Gegola pendente conforme `app/AGENTS.md`).
