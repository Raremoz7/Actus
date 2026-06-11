// Blindagem do DOM contra extensões de navegador (gerenciadores de senha como o
// Bitwarden, Google Tradutor, etc.).
//
// PROBLEMA: essas extensões injetam nós (overlay de autofill) DENTRO da árvore que
// o React controla. Quando o React desmonta uma tela (ex.: o router.replace('/')
// após o login), ele tenta remover um nó que a extensão moveu — e o DOM lança
// `NotFoundError: Failed to execute 'removeChild' on 'Node'`. Como não há
// ErrorBoundary que isole isso, a árvore inteira cai e a tela fica branca.
//
// SOLUÇÃO: tornar removeChild/insertBefore tolerantes — se o nó não pertence mais
// ao pai esperado (sinal de que uma extensão mexeu nele), vira no-op em vez de
// lançar. É a mitigação recomendada pelo próprio time do React para o crash
// equivalente do Google Tradutor. Ref: facebook/react#11538.
//
// Roda como side-effect no entrypoint (index.ts), ANTES do react-dom montar.

if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined') {
        console.warn('[domGuard] removeChild ignorado: nó já não pertence a este pai (provável extensão de navegador).', child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined') {
        console.warn('[domGuard] insertBefore ignorado: nó de referência não pertence a este pai (provável extensão de navegador).', referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

export {};
