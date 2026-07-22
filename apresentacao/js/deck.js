/* ============================================================================
   deck.js — orquestração do deck (vanilla puro, SEM dependências de animação).

   Os reveals são feitos por CSS (classe .is-revealed no .step) — robusto contra
   extensões de navegador e sem depender de lib externa. Este script só:
     1) inicializa o impress.js (DEPOIS de registrar os listeners — senão o
        stepenter do primeiro slide é perdido e a capa fica sem título);
     2) em 'impress:stepenter' adiciona .is-revealed ao step (CSS anima);
        em 'impress:stepleave' remove (para reanimar ao voltar);
     3) na fronteira de TEMA dispara o wipe (.theme-wipe) e revela atrás dele;
     4) esconde a dica de navegação após a 1ª navegação (ou 6s).

   Tema é POR-SLIDE (atributo data-theme no .slide) — as custom properties
   re-escopam sozinhas; o wipe é só cosmético.
   ============================================================================ */
(function () {
  'use strict';

  var root = document.getElementById('impress');
  if (!root) return;

  /* [TEMPORÁRIO] só ← e → navegam. O impress navega no KEYUP (e usa keydown
     p/ preventDefault), então bloqueamos keydown E keyup das demais teclas
     (espaço, PageUp/Down, ↑ ↓, Home/End, Tab) na fase de captura, antes do
     impress. Para reativar tudo, remova este bloco. */
  (function () {
    function gate(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        e.stopImmediatePropagation();
      }
    }
    document.addEventListener('keydown', gate, true);
    document.addEventListener('keyup', gate, true);
    document.addEventListener('keypress', gate, true);
  })();

  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ?still — modo de verificação: sem animação, estado final (CSS body.is-still) */
  var still = /[?&]still\b/.test(window.location.search);
  if (still) { document.body.classList.add('is-still'); reduceMotion = true; }

  var wipeEl  = document.querySelector('.theme-wipe');
  var navHint = document.querySelector('.nav-hint');
  var prevTheme = 'actus';
  var sawStepEnter = false;
  var navHidden = false;

  function reveal(step)   { step.classList.add('is-revealed'); }
  function unreveal(step) { step.classList.remove('is-revealed'); }

  function hideNavHint() {
    if (navHidden || !navHint) return;
    navHidden = true;
    navHint.classList.add('is-hidden');
  }

  /* ----- wipe de tema: barra que varre a tela (CSS @keyframes) ----------------
     cobre ~no meio da animação → chama onCover (revela o conteúdo atrás). */
  function themeWipe(toTheme, onCover) {
    if (reduceMotion || !wipeEl) { if (onCover) onCover(); return; }
    /* segura o slide novo ESCONDIDO até o wipe cobrir a tela (CSS body.th-wipe) */
    document.body.classList.add('th-wipe');
    wipeEl.style.background = (toTheme === 'worldgym') ? '#C8102E' : '#10252D';
    wipeEl.classList.remove('is-wiping');
    void wipeEl.offsetWidth;                 /* reflow: reinicia a animação */
    wipeEl.classList.add('is-wiping');
    /* no auge do wipe (tela coberta): troca fundo + revela conteúdo e libera o slide */
    setTimeout(function () {
      if (onCover) onCover();
      document.body.classList.remove('th-wipe');
    }, 450);
    wipeEl.addEventListener('animationend', function ae() {
      wipeEl.classList.remove('is-wiping');
      document.body.classList.remove('th-wipe');   /* segurança */
      wipeEl.removeEventListener('animationend', ae);
    });
  }

  /* pinta o palco inteiro (html+body) com a cor do tema → vermelho de fora a
     fora nas telas World Gym, sem borda escura. */
  function setStageBg(theme) {
    var active = document.querySelector('.step.active');
    var c;
    if (active && active.id === 'nos-voces') {
      c = 'linear-gradient(90deg, #1A343F 50%, #C8102E 50%)';  /* split bleed */
    } else {
      c = (theme === 'worldgym') ? '#C8102E' : '#10252D';
    }
    document.documentElement.style.background = c;
    document.body.style.background = c;
  }

  function handleEnter(step) {
    var toTheme = step.dataset.theme || 'actus';
    if (reduceMotion) { setStageBg(toTheme); prevTheme = toTheme; return; }
    if (toTheme !== prevTheme) {
      /* troca de tema: o wipe vermelho É a transição; troca cor e revela atrás dele */
      themeWipe(toTheme, function () { setStageBg(toTheme); reveal(step); });
    } else {
      setStageBg(toTheme);
      reveal(step);
    }
    prevTheme = toTheme;
  }

  /* monta as telas do app (clones) nos pontos .phone-mount — sem duplicar markup */
  (function mountScreens() {
    var mounts = document.querySelectorAll('.phone-mount[data-screen]');
    for (var i = 0; i < mounts.length; i++) {
      if (mounts[i].childNodes.length) continue;
      var src = document.getElementById(mounts[i].getAttribute('data-screen'));
      if (!src) continue;
      var clone = src.cloneNode(true);
      clone.removeAttribute('id');
      mounts[i].appendChild(clone);
    }
  })();

  /* ----- listeners ANTES do init ----- */
  root.addEventListener('impress:stepenter', function (e) {
    sawStepEnter = true;
    handleEnter(e.target);
  });
  root.addEventListener('impress:stepleave', function (e) {
    unreveal(e.target);
    hideNavHint();
  });

  /* ----- init do impress (com guarda) ----- */
  var impressOk = false;
  try {
    if (typeof window.impress === 'function') { window.impress().init(); impressOk = true; }
  } catch (err) { /* sem impress → .impress-not-supported mostra o .fallback */ }

  if (!impressOk) {
    /* degradação: sem impress, mostra todo o conteúdo (empilhado) */
    var steps = root.querySelectorAll('.step');
    for (var i = 0; i < steps.length; i++) steps[i].classList.add('is-revealed');
  }

  /* rede de segurança: se nenhum stepenter chegou (timing do 1º slide), revela
     o slide ativo manualmente. */
  if (!reduceMotion && impressOk) {
    setTimeout(function () {
      if (!sawStepEnter) {
        var active = root.querySelector('.step.active') || root.querySelector('.step');
        if (active) handleEnter(active);
      }
    }, 80);
  }

  setTimeout(hideNavHint, 6000);
})();
