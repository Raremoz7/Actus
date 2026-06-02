# Tela de escolha de perfil — resolver espaço vazio inferior

Data: 2026-06-02
Arquivo afetado: `app/(auth)/escolha-perfil.tsx` (único)

## Problema

A tela de entrada (`escolha-perfil`) tem um grande espaço vazio na parte inferior. O conteúdo da base escura (eyebrow "Acesso", botão "Sou aluno", botão "Sou professor", link "Entrar") fica ancorado no topo via `paddingTop`, deixando o restante da área `flex: 1` sem uso e sem intenção.

## Decisão

Combinar duas abordagens, mantendo o hero (bloco neon) **inalterado**:

- **A — botões maiores:** as duas escolhas viram cards mais altos com uma linha de descrição.
- **B — distribuição no eixo:** espaçadores flexíveis acima e abaixo do bloco de escolhas empurram o link "Entrar" para o rodapé; o espaço vazio vira respiro intencional.

## Especificação

### Hero (bloco neon)
Sem alterações. Mantém logo, manifesto, animação de entrada (slide + fade no load).

### As duas escolhas — agora um par

Ambos os botões passam a compartilhar o mesmo formato (são tratados como cards-irmãos, não como primário+secundário):

- **Raio:** `radius.input` (12px) nos dois. Sai o `radius.pill` (100) do "Sou aluno".
- **Layout interno:** coluna com título + descrição à esquerda, `CaretRight` (Phosphor duotone) à direita como affordance de toque, alinhado verticalmente ao centro.
- **Altura:** maior que a atual via `paddingVertical` ampliado (alvo ~+50% vs. atual), aumentando também a área de toque.
- **Sou aluno:** fill `colors.neon`, textos em `inverse`/escuro.
  - Título: "Sou aluno" (`variant="label"`)
  - Descrição: "Recebi um convite do meu treinador" (substitui a tag mono "COM CONVITE →")
- **Sou professor:** outline (`borderWidth: 1`, `borderColor: colors.outline`), fundo transparente.
  - Título: "Sou professor" (`variant="label"`)
  - Descrição: "Gerencio meus alunos"

> Copy das descrições é ponto de ajuste do designer; não bloqueia implementação.

### Distribuição vertical (base escura)

Dentro do `baseInner`:
- Espaçador flexível (`flex: 1`) **acima** do bloco "eyebrow Acesso + 2 botões".
- Espaçador flexível (`flex: 1`) **abaixo** dos botões, antes do link "Entrar".
- O link "Já tenho conta · Entrar" fica próximo ao rodapé (respeitando safe area `bottom`).
- Remover o `paddingTop` que ancorava tudo no topo.

### Mantido
- Animação de entrada do bloco neon.
- `scale` 0.98 no `onPressIn`/`onPressOut` dos dois botões (`motion.microMs`).
- Haptics (`ImpactFeedbackStyle.Light`) na navegação.
- Acessibilidade: `accessibilityRole="button"` e labels descritivos em cada escolha; link "Entrar" como `link`.
- Navegação inalterada: aluno → `/(auth)/cadastro`, professor → `/(auth)/professor-info`, entrar → `/(auth)/login`.

## Regras de design respeitadas
- Todos os valores via tokens do theme (`radius.input`, `colors.*`, `spacing.*`, tipografia). Nenhum hex hardcoded.
- Ícones Phosphor duotone.
- Copy quiet luxury: específica, sem buzzword, sem emoji.
- Um único momento de motion por tela (entrada do bloco neon); micro-press não conta como momento principal.

## Fora de escopo
- Alterar o hero/manifesto.
- Mudar fluxos de navegação ou telas de destino.
- Qualquer alteração em outras telas do bloco de cadastro.
