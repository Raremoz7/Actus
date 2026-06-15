# Apresentação Actus × World Gym — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir uma apresentação de slides standalone (impress.js + GSAP, sem backend/build) com jornada espacial 3D, transições não-repetitivas e virada de tema Actus (dark+neon) → World Gym (vermelho/branco/grafite) → Actus, fiel ao design system Actus.

**Architecture:** Pasta `apresentacao/` na raiz, HTML/CSS/JS puro vendorizado (offline-first). `index.html` contém 9 steps do impress.js; `deck.js` engancha em `impress:stepenter`/`stepleave` para disparar reveals do GSAP e os *wipes* de tema; CSS dividido por responsabilidade (tokens, deck, screens, transitions). Telas do app são componentes HTML inline em frames de celular, estilizados por `screens.css`.

**Tech Stack:** impress.js 2.0, GSAP 3.12, HTML/CSS puro, fontes self-hosted (Barlow Condensed / Barlow / Share Tech Mono em woff2). Verificação visual via servidor estático + screenshots (Chrome DevTools / Playwright MCP).

**Nota de verificação:** Não há test runner — é artefato visual. Cada tarefa verifica servindo `apresentacao/` (`npx serve apresentacao -l 5050`) e inspecionando no navegador / screenshot via MCP. Commits na `branch/davi` (nunca dev/main); usar `/salvar` ao fim de blocos.

**Fontes de verdade:** `docs/superpowers/specs/2026-06-15-apresentacao-actus-worldgym-design.md` (spec) e `DESIGN_SYSTEM.md` (tokens). Mockups já validados em `.superpowers/brainstorm/2032-1781559954/_mockup_src/` (dir-a.html = Direção A aprovada; dir-wg.html/dir-wg.built.html = modo World Gym aprovado) — **reusar como base**.

---

## Mapa de arquivos

```
apresentacao/
  index.html              # 9 steps impress + telas do app inline
  css/
    tokens.css            # :root (Actus) + [data-theme="worldgym"] (WG)
    deck.css              # layout/tipografia/componentes dos slides (Direção A)
    screens.css           # frame de celular + telas do app
    transitions.css       # wipes de tema + classes de reveal (estado inicial)
  js/
    impress.min.js        # vendor (offline)
    gsap.min.js           # vendor (offline)
    deck.js               # init impress + hooks stepenter/leave → GSAP + wipes
  assets/
    fonts/*.woff2         # 3 famílias self-hosted
    logos/                # actus*.svg + world-gym.webp
    screens/              # imagens locais (foto de exercício etc.), se houver
  README.md
```

Responsabilidade por arquivo: `tokens.css` só variáveis; `deck.css` só slides; `screens.css` só os mockups de app; `transitions.css` só motion; `deck.js` só orquestração. Nenhum hex solto fora de `tokens.css`.

---

## Task 0: Scaffold + vendorizar libs e fontes

**Files:**
- Create: `apresentacao/` (árvore acima), `apresentacao/README.md`
- Create: `apresentacao/js/impress.min.js`, `apresentacao/js/gsap.min.js`
- Create: `apresentacao/assets/fonts/*.woff2`
- Copy:   `Logos/*` → `apresentacao/assets/logos/`

- [ ] **Step 1: Criar árvore de pastas**

```bash
mkdir -p apresentacao/css apresentacao/js apresentacao/assets/fonts apresentacao/assets/logos apresentacao/assets/screens
```

- [ ] **Step 2: Vendorizar impress.js e GSAP (offline)**

```bash
curl -L -o apresentacao/js/impress.min.js https://unpkg.com/impress.js@2.0.0/js/impress.js
curl -L -o apresentacao/js/gsap.min.js   https://unpkg.com/gsap@3.12.5/dist/gsap.min.js
```
Expected: dois arquivos não-vazios (`wc -c` > 10000 cada). Se unpkg falhar, fallback jsDelivr: `https://cdn.jsdelivr.net/npm/impress.js@2.0.0/js/impress.js` e `https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js`.

- [ ] **Step 3: Self-hostar as 3 famílias (woff2)**

Baixar o CSS com UA de navegador (devolve woff2), extrair URLs `fonts.gstatic.com`, baixar cada woff2 para `assets/fonts/`:

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
URL="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;800;900&family=Barlow:wght@400;500;600&family=Share+Tech+Mono&display=swap"
curl -s -H "User-Agent: $UA" "$URL" -o /tmp/gf.css
grep -oE "https://fonts.gstatic.com[^)]+\.woff2" /tmp/gf.css | sort -u | while read u; do
  curl -s -L "$u" -o "apresentacao/assets/fonts/$(basename "$u")"; done
ls -la apresentacao/assets/fonts/
```
Expected: vários `.woff2` (latin) baixados. Guardar o trecho `@font-face` gerado (de `/tmp/gf.css`, com `src` reescrito para `./fonts/...`) para `tokens.css` na Task 1.

- [ ] **Step 4: Copiar logos**

```bash
cp Logos/*.svg apresentacao/assets/logos/ 2>/dev/null
cp "Logos/world gym logo.webp" "apresentacao/assets/logos/world-gym.webp"
ls apresentacao/assets/logos/
```

- [ ] **Step 5: README**

Conteúdo de `apresentacao/README.md`:
```markdown
# Apresentação Actus × World Gym
Deck standalone (impress.js + GSAP). Sem backend/build.

## Rodar
- Mais simples: abrir `index.html` no navegador (Chrome/Edge).
- Recomendado: `npx serve apresentacao -l 5050` e abrir http://localhost:5050
- Tela cheia: F11. Navegar: setas / espaço / clique.

Offline-first: libs e fontes vendorizadas em `js/` e `assets/fonts/`.
```

- [ ] **Step 6: Verificar e commitar**

```bash
ls -R apresentacao | head -40
git add apresentacao && git commit -m "chore(apresentacao): scaffold + vendor impress/gsap/fontes/logos"
```

---

## Task 1: tokens.css — modos Actus e World Gym

**Files:**
- Create: `apresentacao/css/tokens.css`

- [ ] **Step 1: Escrever `@font-face` (da Task 0 Step 3) + variáveis**

```css
/* === FONTES (self-hosted) === */
/* colar os blocos @font-face gerados, com src: url('./fonts/<arquivo>.woff2') format('woff2') */
/* famílias: 'Barlow Condensed' (600,800,900), 'Barlow' (400,500,600), 'Share Tech Mono' (400) */

:root{
  /* Actus — superfícies */
  --bg-lowest:#10252D; --bg-base:#1A343F;
  --surface1:#203F4B; --surface2:#294B58; --surface3:#345867; --surface4:#406575;
  /* acento / dados */
  --neon:#CBFE00; --success:#4DE082; --fog:#7BA0BC; --fog-fill:rgba(123,160,188,0.16);
  /* texto */
  --txt:#fff; --txt-70:rgba(255,255,255,.70); --txt-50:rgba(255,255,255,.50);
  --on-neon:#141414;
  /* contornos */
  --hair:#444933; --outline:#8E9379;
  /* fontes */
  --disp:'Barlow Condensed',sans-serif; --body:'Barlow',sans-serif; --mono:'Share Tech Mono',monospace;
  /* papéis semânticos (trocam no modo WG) */
  --slide-bg:var(--bg-lowest); --slide-bg-2:var(--bg-base);
  --accent:var(--neon); --accent-on:var(--on-neon);
  --panel:var(--surface1); --panel-2:var(--bg-base);
  --ink:var(--txt); --ink-70:var(--txt-70); --ink-50:var(--txt-50);
  --rule:var(--hair); --tick:var(--neon);
}

/* World Gym — só re-mapeia os papéis semânticos */
[data-theme="worldgym"]{
  --red:#C8102E; --red-deep:#A20C24; --graphite:#26292B; --graphite-2:#1C1F20;
  --slide-bg:var(--red); --slide-bg-2:var(--red-deep);
  --accent:#fff; --accent-on:var(--red);
  --panel:var(--graphite); --panel-2:var(--graphite-2);
  --ink:#fff; --ink-70:rgba(255,255,255,.72); --ink-50:rgba(255,255,255,.50);
  --rule:rgba(255,255,255,.20); --tick:#fff;
}
```

- [ ] **Step 2: Verificar** — abrir um HTML de teste que usa `var(--accent)`; confirmar troca ao setar `data-theme="worldgym"` no elemento. Commit: `feat(apresentacao): tokens Actus + World Gym`.

---

## Task 2: index.html — esqueleto impress + deck.js mínimo (1 step renderiza)

**Files:**
- Create: `apresentacao/index.html`
- Create: `apresentacao/js/deck.js`
- Create: `apresentacao/css/deck.css` (mínimo, expandido na Task 3)

- [ ] **Step 1: index.html base**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Actus × World Gym</title>
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/deck.css">
<link rel="stylesheet" href="css/screens.css">
<link rel="stylesheet" href="css/transitions.css">
</head>
<body class="actus">
  <div id="impress" data-transition-duration="900"
       data-width="1920" data-height="1080" data-max-scale="3" data-min-scale="0">

    <!-- STEP 1 · CAPA -->
    <div id="capa" class="step slide" data-x="0" data-y="0" data-scale="1">
      <!-- conteúdo na Task 4 -->
      <h1 class="headline">A PRÓXIMA CAMADA</h1>
    </div>

  </div>

  <div class="theme-wipe" aria-hidden="true"></div>
  <div class="nav-hint mono">← → para navegar</div>
  <div class="fallback">Use um navegador moderno (Chrome/Edge) em tela cheia.</div>

  <script src="js/impress.min.js"></script>
  <script src="js/gsap.min.js"></script>
  <script src="js/deck.js"></script>
</body>
</html>
```

- [ ] **Step 2: deck.js — init + hooks base**

```js
(function(){
  var root = document.getElementById('impress');
  var api = impress();   // inicializa
  api.init();

  // troca de tema por step (data-theme no step define o body)
  function applyTheme(step){
    var t = step.getAttribute('data-theme') || 'actus';
    document.body.classList.toggle('actus', t==='actus');
    document.body.setAttribute('data-theme', t);
  }

  root.addEventListener('impress:stepenter', function(e){
    var step = e.target;
    applyTheme(step);
    // GSAP reveals por slide entram na Task 7 (via step.dataset.reveal)
    step.classList.add('is-active');
  });
  root.addEventListener('impress:stepleave', function(e){
    e.target.classList.remove('is-active');
  });
})();
```

- [ ] **Step 3: deck.css mínimo**

```css
*{margin:0;padding:0;box-sizing:border-box;}
html,body{height:100%;background:var(--slide-bg);font-family:var(--body);color:var(--ink);}
.fallback{display:none;}
.impress-not-supported .fallback{display:flex;position:fixed;inset:0;align-items:center;justify-content:center;background:var(--bg-lowest);color:#fff;font-family:var(--mono);}
.step.slide{width:1920px;height:1080px;background:var(--slide-bg);}
.headline{font-family:var(--disp);font-weight:900;text-transform:uppercase;color:var(--ink);font-size:120px;}
.nav-hint{position:fixed;right:24px;bottom:20px;color:var(--ink-50);font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;z-index:50;}
.mono{font-family:var(--mono);}
```

- [ ] **Step 4: Verificar** — `npx serve apresentacao -l 5050`; abrir, confirmar que o slide 1 renderiza centralizado em dark com a headline neon-less (branca) e a dica de navegação. Screenshot via MCP. Commit: `feat(apresentacao): esqueleto impress + deck.js base`.

---

## Task 3: deck.css completo — layout e componentes da Direção A

**Files:**
- Modify: `apresentacao/css/deck.css`

Reusar a linguagem do mockup aprovado `dir-a.html`: grid de slide com 3 zonas (top/center/bottom), eyebrow mono com `tick` neon, headline Barlow Condensed gigante (`clamp` baseado em 1920×1080 → usar px/`vh` do palco), índice mono, painel de superfície lateral opcional, lockup de co-branding, slogan com `border-top` hairline.

- [ ] **Step 1: Portar os estilos de `dir-a.html`** para classes reutilizáveis em `deck.css`, trocando hex por `var(--*)` de `tokens.css`. Componentes: `.slide-frame` (grid 3 linhas, padding de palco ~ 50px 92px), `.eyebrow`+`.tick`, `.s-index`, `.headline` (+ `.headline .accent{color:var(--accent)}`), `.subhead`, `.s-panel` (painel `--panel` à direita 30%), `.lockup`/`.mark`/`.sep`, `.slogan`+`.dot`, `.insight-card` (surface2 elevado), `.pillar-card` (surface1, hairline). Cantoneiras/régua NÃO (são da Direção B/C).

- [ ] **Step 2: Tamanhos do palco** — como o stage é 1920×1080 fixo, usar px (não vw). Headline d1 ~120–160px; h2 ~64px; eyebrow mono 16px/0.34em; body 22–26px; índice 16px. Manter salto ≥3×.

- [ ] **Step 3: Verificar** — atualizar slide 1 (capa) para usar `.slide-frame` e confirmar visual idêntico ao `dir-a.html` aprovado (eyebrow, headline com palavras em `--accent`, lockup, slogan). Screenshot. Commit: `feat(apresentacao): deck.css Direção A`.

---

## Task 4: index.html — os 9 slides (conteúdo)

**Files:**
- Modify: `apresentacao/index.html`

Cada step recebe coordenadas 3D (movimento da §4 do spec) e conteúdo. **Coordenadas (1920×1080 stage):**

| # | id | data-* (posição/rotação/escala) |
|---|---|---|
| 1 | capa | `data-x=0 data-y=0 data-scale=1` |
| 2 | hook | `data-x=0 data-y=0 data-z=-2600 data-scale=1` (mergulho/zoom-in) |
| 3 | contexto | `data-x=3200 data-y=200 data-rotate=-6 data-scale=1` (pan + leve rot) |
| 4 | virada | `data-x=3200 data-y=-2400 data-rotate=90 data-scale=1.4` (rotação Z) |
| 5 | pilares | `data-x=0 data-y=-2400 data-rotate=0 data-scale=2.6` (zoom-out revela 3 cartões) |
| 6 | produto | `data-x=-3400 data-y=-1200 data-rotate-y=70 data-scale=1.1` (porta 3D, WG) |
| 7 | nos-voces | `data-x=-3400 data-y=900 data-rotate-y=70 data-scale=1.1` (pan no mundo WG) |
| 8 | visao | `data-x=600 data-y=4200 data-rotate=0 data-scale=5` (zoom-out vasto, volta Actus) |
| 9 | cta | `data-x=600 data-y=4200 data-z=-1200 data-scale=1` (zoom-in no CTA) |

Slides 6 e 7 recebem `data-theme="worldgym"`. Demais sem (default actus).

- [ ] **Step 1: Slide 1 — Capa** (já iniciado). Conteúdo final = espelho de `dir-a.html`: eyebrow "CONVERSA INICIAL — WORLD GYM"; headline "A PRÓXIMA CAMADA DE / OPERAÇÃO, DADOS / E RECEITA da World Gym." (palavras OPERAÇÃO/DADOS/RECEITA em `.accent`); datestamp 15.06.2026; lockup ACTUS × WORLD GYM (logos reais via `<img src=assets/logos/...>`); slogan "Profissionais e alunos. No mesmo ritmo.".

- [ ] **Step 2: Slide 2 — Hook.** eyebrow "O CONTEXTO"; headline única grande: "O aluno passa poucas horas por semana na academia. E em todas as outras?" (sem dado numérico citado como fato). `data-reveal="hook"`.

- [ ] **Step 3: Slide 3 — Contexto.** headline "O PRÓXIMO CRESCIMENTO NÃO VEM SÓ DA CATRACA."; 3 `.pillar-card` (micro-atritos): "Operação de treino ainda manual" · "Dados do aluno espalhados" · "Pouca inteligência no momento certo"; `.insight-card` à direita: "Quando a academia vira plataforma, a relação com o aluno continua além do treino." `data-reveal="stagger"`.

- [ ] **Step 4: Slide 4 — A virada.** Tela quase vazia, frase única centralizada: "Transformar força física em camada digital: menos fricção, mais dados, novas receitas além da mensalidade." `data-reveal="line"`.

- [ ] **Step 5: Slide 5 — 3 Pilares.** Título "A TESE ACTUS PARA A WORLD GYM"; 3 `.pillar-card` grandes lado a lado (substeps `.substep`): **Distribuição** / **Inteligência** / **Receita transacional**, cada um com 1 frase + linha "No produto:". `data-reveal="pillars"` (acendem em sequência via substeps).

- [ ] **Step 6: Slide 6 — Produto (WG).** `data-theme="worldgym"`. eyebrow "A SOLUÇÃO — POWERED BY ACTUS"; headline branca "App World Gym."; subhead "Nasce no personal. Escala para a academia."; à direita, **frames de celular** com telas do app (Task 5) — incluindo 1 tela re-skin WG. lockup logo WG branco × ACTUS. `data-reveal="devices"`.

- [ ] **Step 7: Slide 7 — Nós e vocês (WG).** `data-theme="worldgym"`. Título "CADA UM TRAZ O QUE O OUTRO NÃO TEM."; duas colunas: "Actus traz" (4 itens) / "World Gym + Actus destrava" (4 itens, coluna em destaque). `data-reveal="columns"`.

- [ ] **Step 8: Slide 8 — Visão.** Volta Actus. Tela quase vazia, tipografia grande: "A academia deixa de ser só onde o aluno treina — passa a ser a plataforma que acompanha, entende e monetiza a jornada fitness."; atribuição mono "TESE DE PARCERIA · ACTUS + WORLD GYM". `data-reveal="line"`.

- [ ] **Step 9: Slide 9 — CTA.** headline "VAMOS DESENHAR O PILOTO?"; 3 compromissos (`.pillar-card` ou lista): "Workshop de 60 min" · "Escopo do piloto" · "Modelo comercial inicial"; rodapé com `[apresentador]` / `[contato]` (placeholder). `data-reveal="stagger"`.

- [ ] **Step 10: Verificar** — navegar pelos 9 slides; confirmar que cada transição é um movimento diferente e que 6/7 ficam vermelhos. Screenshot dos 9. Commit: `feat(apresentacao): 9 slides + jornada espacial`.

---

## Task 5: Telas do app (frames de celular) + screens.css

**Files:**
- Create: `apresentacao/css/screens.css`
- Modify: `apresentacao/index.html` (blocos das telas, usados no slide 6 e 5)

Cada tela é um componente HTML dentro de `.phone` (frame de celular ~ 360×780 escalado). Fiéis ao app (abas, tipografia, neon). Telas: `screen-hoje`, `screen-sessao`, `screen-dashboard`, `screen-dieta`, `screen-parq`. Variante `screen-hoje--wg` (re-skin vermelho).

- [ ] **Step 1: `.phone` frame** — moldura arredondada (raio 40px), notch, status bar fake (hora 9:41, mono), área de conteúdo `--bg-base`, tab bar inferior com 4–5 abas (aba ativa `--accent`). `screens.css` usa só `var(--*)`.

- [ ] **Step 2: Tela "Hoje" (aluno)** — saudação "Bom treino, [Nome]"; fita da semana (7 dias, hoje destacado neon); card do treino do dia (nome, próximo exercício, botão neon "Iniciar"); mini-card dieta; chip de desafio; chama/streak. Marcação de exemplo realista (não lorem).

- [ ] **Step 3: Demais telas** — `screen-sessao` (stepper exercício, timer-herói 88px mono, séries com check), `screen-dashboard` (KPIs em mono, ações rápidas em bolha surface2, bloco engajamento), `screen-dieta` (refeições + barras de macros + totalizador), `screen-parq` (lista 7 perguntas, selo status apto/atenção `warning`).

- [ ] **Step 4: Variante WG** — `screen-hoje--wg`: mesma estrutura, mas dentro de `[data-theme="worldgym"]` os tokens já trocam o acento p/ vermelho/branco; ajustar o que for hardcoded. Usado no slide 6 para "o app com a marca de vocês".

- [ ] **Step 5: Verificar** — renderizar as telas numa página de teste e no slide 6; confirmar fidelidade ao design system (fontes, neon, abas). Screenshot. Commit: `feat(apresentacao): telas do app em frames de celular`.

---

## Task 6: transitions.css + deck.js — reveals GSAP e wipes de tema

**Files:**
- Modify: `apresentacao/css/transitions.css`, `apresentacao/js/deck.js`

- [ ] **Step 1: Estados iniciais (transitions.css)** — classes que escondem elementos antes do reveal (sem depender de JS para o fallback): `.slide .reveal-up{opacity:0;transform:translateY(28px)}`; quando `prefers-reduced-motion`, forçar visível. `.theme-wipe` full-screen fixo, `transform:scaleX(0)`, origem variável, `z-index:40`, cor `--accent`/vermelho.

```css
@media (prefers-reduced-motion: reduce){
  .slide .reveal-up{opacity:1!important;transform:none!important;}
}
.theme-wipe{position:fixed;inset:0;z-index:40;pointer-events:none;transform-origin:left center;transform:scaleX(0);background:#C8102E;}
```

- [ ] **Step 2: Reveals por slide (deck.js)** — no `impress:stepenter`, um `switch(step.dataset.reveal)` dispara timelines GSAP:
  - `line`/`hook`: headline sobe linha a linha (stagger 0.08).
  - `stagger`: `.pillar-card` e `.insight-card` entram com `y:28→0, opacity` stagger 0.12.
  - `pillars`: cada `.substep` acende (já há mecânica de substep do impress; combinar com GSAP highlight).
  - `devices`: `.phone` entram com `y/opacity` + leve `rotateY`.
  - `columns`: colunas entram da esquerda/direita; coluna direita com realce.
  Limpar/resetar no `impress:stepleave` (set inicial) para reexecutar ao voltar.

```js
function reveal(step){
  var k = step.dataset.reveal, q = step.querySelectorAll.bind(step);
  var tl = gsap.timeline();
  if(k==='line'||k==='hook') tl.from(q('.headline .hl-line span,.headline'),{y:'110%',opacity:0,stagger:.08,duration:.7,ease:'power3.out'});
  if(k==='stagger') tl.from(q('.pillar-card,.insight-card'),{y:28,opacity:0,stagger:.12,duration:.6,ease:'power2.out'});
  if(k==='devices') tl.from(q('.phone'),{y:40,opacity:0,rotateY:8,stagger:.15,duration:.7,ease:'power3.out'});
  if(k==='columns'){tl.from(q('.col-left>*'),{x:-30,opacity:0,stagger:.1,duration:.5});tl.from(q('.col-right>*'),{x:30,opacity:0,stagger:.1,duration:.5},'<');}
  return tl;
}
```

- [ ] **Step 3: Wipes de tema (deck.js)** — detectar mudança de tema entre o step anterior e o atual; se entrar em `worldgym`, animar `.theme-wipe` (vermelho) `scaleX 0→1` cobrindo, trocar o tema no meio, depois `scaleX 1→0` saindo pelo outro lado; se voltar p/ `actus`, wipe escuro com filete neon. Guardar `prevTheme`.

```js
var prevTheme='actus';
function themeWipe(toTheme, done){
  var w=document.querySelector('.theme-wipe');
  w.style.background = toTheme==='worldgym' ? '#C8102E' : '#10252D';
  w.style.transformOrigin = toTheme==='worldgym' ? 'left center' : 'right center';
  gsap.timeline({onComplete:done})
    .set(w,{scaleX:0})
    .to(w,{scaleX:1,duration:.45,ease:'power4.in'})
    .add(function(){ /* trocar data-theme aqui */ })
    .to(w,{scaleX:0,duration:.5,ease:'power4.out',transformOrigin:toTheme==='worldgym'?'right center':'left center'});
}
```
Integrar no `stepenter`: se `toTheme!==prevTheme` rodar `themeWipe` e só então `reveal(step)`; senão `reveal(step)` direto. Atualizar `prevTheme`.

- [ ] **Step 4: Verificar** — navegar 5→6 (deve ter wipe vermelho) e 7→8 (wipe escuro); confirmar reveals em cada slide; testar `prefers-reduced-motion` (DevTools) → conteúdo visível sem animação. Screenshots dos momentos. Commit: `feat(apresentacao): reveals GSAP + wipes de tema`.

---

## Task 7: Robustez, navegação e finalização

**Files:**
- Modify: `apresentacao/index.html`, `apresentacao/css/deck.css`, `apresentacao/README.md`

- [ ] **Step 1: Fallback impress** — confirmar `.impress-not-supported` mostra `.fallback`; nav-hint some após 1ª navegação (GSAP fade) ou após 6s.
- [ ] **Step 2: Offline check** — servir sem rede (DevTools offline) e confirmar que fontes/libs carregam de local (nenhum request a CDN/Google). Corrigir qualquer `@import` remoto remanescente.
- [ ] **Step 3: Co-branding/contato** — inserir e-mail/nome reais se o Davi fornecer; senão manter placeholders visíveis `[apresentador]`/`[contato]`.
- [ ] **Step 4: Verificar tudo** — run-through dos 9 slides em tela cheia; checar legibilidade, contraste, que nenhuma transição se repete, e a virada WG↔Actus. Commit: `feat(apresentacao): robustez offline + navegação`.

---

## Task 8: Verificação final visual (screenshots dos 9 slides)

**Files:** nenhum (verificação)

- [ ] **Step 1:** `npx serve apresentacao -l 5050`; via Chrome DevTools / Playwright MCP, abrir em 1920×1080, navegar slide a slide e capturar screenshot de cada um (1–9) + um frame do wipe.
- [ ] **Step 2:** Revisar as 9 imagens contra o spec (§4 modos/conteúdo, §6 transições). Listar defeitos visuais; corrigir inline.
- [ ] **Step 3:** `/salvar` (commit + push na `branch/davi`).

---

## Self-Review (cobertura do spec)

- §2 decisões → Tasks 0–7 (motor T2/T6, local T0, telas T5, direção A T3, WG T1/T6, fontes T0). ✓
- §3 identidade (Actus + WG) → tokens T1, deck T3, screens T5. ✓
- §4 arco 9 slides + câmera → T4 (coordenadas) + T6 (transições). ✓
- §5 telas do app → T5. ✓
- §6 transições (impress + GSAP + wipes + reduced-motion) → T6. ✓
- §7 estrutura de arquivos → T0/T2. ✓
- §8 navegação → T2/T7. ✓
- §9 robustez offline → T0 (vendor) + T7 (verificação). ✓
- §10 fora de escopo → respeitado (sem CMS/PDF/i18n/responsivo fino). ✓
- §11 placeholders de conteúdo → T4 Step 9 / T7 Step 3. ✓

Sem placeholders de plano não resolvidos. Nomes de classe/atributos consistentes entre T2/T4/T6 (`.slide`, `.headline`, `.pillar-card`, `.insight-card`, `.phone`, `data-reveal`, `data-theme`, `.theme-wipe`).
