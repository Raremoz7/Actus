// Root HTML do Expo Router no WEB (não roda no nativo).
// Renderizado estaticamente uma vez por página: é o único lugar para estilar
// <html>/<body>. Sem isso, o body branco vaza abaixo da árvore flex:1 do app.
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { darkTheme } from '@/theme';

// bgLowest — exceção legítima a hex hardcoded (estilo inline do <body> web).
const BODY_BG = darkTheme.colors.bgLowest;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: bodyStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Altura cheia + fundo escuro no root do documento.
const bodyStyle = `
html, body, #root {
  height: 100%;
  margin: 0;
  background-color: ${BODY_BG};
}
`;
