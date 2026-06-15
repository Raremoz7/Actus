/* ============================================================================
   deck.js — orquestração do deck (vanilla, sem framework).

   Responsabilidades:
     1) inicializar o impress.js;
     2) em cada 'impress:stepenter', disparar o reveal GSAP correspondente ao
        atributo data-reveal do .slide; em 'impress:stepleave', resetar o slide
        para o estado inicial (para reexecutar ao voltar);
     3) na fronteira de TEMA (data-theme do step muda), tocar o cosmético wipe
        da barra .theme-wipe — vermelho ao entrar no World Gym, escuro ao voltar
        para o Actus — e só então rodar os reveals (atrás da barra);
     4) esconder a dica de navegação após a 1ª navegação (ou 6s).

   IMPORTANTE: o tema é POR-SLIDE (atributo data-theme no .slide). deck.js NÃO
   mexe no <body>: as custom properties re-escopam sozinhas dentro do step. A
   barra de wipe é puramente cosmética.

   Guardas: se impress/gsap estiverem ausentes, nada quebra (degradação suave —
   o CSS de transitions.css já deixa o conteúdo visível como fallback).
   ============================================================================ */
(function () {
  'use strict';

  var root = document.getElementById('impress');
  if (!root) return;

  var hasGSAP = (typeof window.gsap !== 'undefined');
  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ?still — modo de verificação: pula animações/wipes e mostra o estado final
     (CSS body.is-still revela o conteúdo). Útil para screenshots. */
  var still = /[?&]still\b/.test(window.location.search);
  if (still) { document.body.classList.add('is-still'); reduceMotion = true; }

  var wipeEl = document.querySelector('.theme-wipe');
  var navHint = document.querySelector('.nav-hint');

  /* ------------------------------------------------------------------------
     Inicialização do impress (com guarda)
     ------------------------------------------------------------------------ */
  try {
    if (typeof window.impress === 'function') {
      var api = window.impress();
      api.init();
    }
  } catch (err) {
    /* impress indisponível → .impress-not-supported mostra o .fallback (CSS) */
  }

  /* ========================================================================
     REVEALS — por data-reveal do step
     line/hook ...... headline sobe linha-a-linha (clip + stagger)
     stagger ........ .pillar-card + .insight-card sobem com fade
     pillars ........ idem cartões + realce sequencial (pulso de escala)
     devices ........ .phone entram com y/opacity + leve rotateY
     columns ........ .col-left vem da esquerda, .col-right da direita
     ======================================================================== */
  function runReveal(step) {
    if (!hasGSAP || reduceMotion) return;
    var k = step.dataset.reveal;
    var tl = gsap.timeline();

    if (k === 'line' || k === 'hook') {
      var lines = step.querySelectorAll('.hl-line > span');
      if (lines.length) {
        tl.fromTo(lines,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.72, ease: 'power3.out', stagger: 0.08 });
      }

    } else if (k === 'stagger') {
      var cards = step.querySelectorAll('.pillar-card, .insight-card');
      if (cards.length) {
        tl.fromTo(cards,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.12 });
      }

    } else if (k === 'pillars') {
      var pillars = step.querySelectorAll('.pillar-card');
      if (pillars.length) {
        /* entrada sequencial — cada cartão "acende" em sequência */
        tl.fromTo(pillars,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.18 });
        /* realce sequencial: pulso de escala discreto em cada cartão */
        tl.fromTo(pillars,
          { scale: 1 },
          {
            scale: 1.02, duration: 0.18, ease: 'power1.inOut',
            stagger: 0.18, yoyo: true, repeat: 1,
            transformOrigin: 'center center'
          }, '<0.12');
      }

    } else if (k === 'devices') {
      var phones = step.querySelectorAll('.phone');
      if (phones.length) {
        tl.fromTo(phones,
          { opacity: 0, y: 40, rotationY: 8 },
          {
            opacity: 1, y: 0, rotationY: 0, duration: 0.72,
            ease: 'power3.out', stagger: 0.15, transformPerspective: 800
          });
      }

    } else if (k === 'columns') {
      var left = step.querySelectorAll('.col-left > *');
      var right = step.querySelectorAll('.col-right > *');
      if (left.length) {
        tl.fromTo(left,
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1 }, 0);
      }
      if (right.length) {
        tl.fromTo(right,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1 }, 0);
      }
    }

    return tl;
  }

  /* Reseta um step para o estado inicial (espelha transitions.css), de modo
     que o reveal reexecute ao voltar e nada "vaze" visível durante a câmera. */
  function resetReveal(step) {
    if (!hasGSAP || reduceMotion) return;
    gsap.set(step.querySelectorAll('.hl-line > span'), { yPercent: 110 });
    gsap.set(step.querySelectorAll('.pillar-card, .insight-card'), { opacity: 0, y: 28, scale: 1 });
    gsap.set(step.querySelectorAll('.phone'), { opacity: 0, y: 40, rotationY: 8 });
    gsap.set(step.querySelectorAll('.col-left > *'), { opacity: 0, x: -30 });
    gsap.set(step.querySelectorAll('.col-right > *'), { opacity: 0, x: 30 });
  }

  /* ========================================================================
     WIPE DE TEMA — barra que cobre a tela na fronteira Actus <-> World Gym
     cobre (scaleX 0→1, origem esquerda) → chama onCover → sai (1→0, origem
     direita, pelo outro lado). Cor vermelha ao entrar no WG; escura ao voltar.
     ======================================================================== */
  function themeWipe(toTheme, onCover) {
    if (!hasGSAP || reduceMotion || !wipeEl) {
      if (onCover) onCover();
      return;
    }
    wipeEl.style.background = (toTheme === 'worldgym') ? '#C8102E' : '#10252D';
    gsap.killTweensOf(wipeEl);

    var fired = false;
    gsap.timeline()
      .set(wipeEl, { transformOrigin: 'left center', scaleX: 0 })
      .to(wipeEl, {
        scaleX: 1, duration: 0.42, ease: 'power3.in',
        onComplete: function () {
          if (!fired) { fired = true; if (onCover) onCover(); }
        }
      })
      .set(wipeEl, { transformOrigin: 'right center' })
      .to(wipeEl, { scaleX: 0, duration: 0.52, ease: 'power3.out' });
  }

  /* ========================================================================
     Dica de navegação — some após a 1ª navegação (ou 6s)
     ======================================================================== */
  var navHidden = false;
  function hideNavHint() {
    if (navHidden || !navHint) return;
    navHidden = true;
    if (hasGSAP && !reduceMotion) {
      gsap.to(navHint, {
        opacity: 0, duration: 0.6, ease: 'power1.out',
        onComplete: function () { navHint.style.display = 'none'; }
      });
    } else {
      navHint.style.opacity = '0';
    }
  }
  setTimeout(hideNavHint, 6000);

  /* ========================================================================
     Eventos do impress
     ======================================================================== */
  var prevTheme = 'actus';

  root.addEventListener('impress:stepenter', function (e) {
    var step = e.target;
    var toTheme = step.dataset.theme || 'actus';

    if (reduceMotion) {
      prevTheme = toTheme;       /* CSS já exibe tudo; sem wipe/reveal */
      return;
    }

    if (toTheme !== prevTheme) {
      /* fronteira de tema → cobre com a barra e revela atrás dela */
      themeWipe(toTheme, function () { runReveal(step); });
    } else {
      runReveal(step);
    }

    prevTheme = toTheme;
  });

  root.addEventListener('impress:stepleave', function (e) {
    resetReveal(e.target);       /* deixa o slide pronto para reexecutar */
    hideNavHint();               /* 1ª navegação → some a dica */
  });

})();
