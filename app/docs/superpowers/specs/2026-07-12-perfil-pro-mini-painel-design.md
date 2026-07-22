# Mini-painel do perfil do profissional — design

Data: 2026-07-12 · Papel: personal / nutri · Status: validado (mockups no companion)

## Problema

A aba PERFIL do profissional (`screens/personal/tabs/perfil.tsx`, idem nutri) hoje renderiza o `components/account/AccountScreen` genérico — o mesmo do aluno. Não mostra identidade profissional nem qualquer resumo do negócio, apesar de esses dados já existirem.

## Decisão

Substituir o `AccountScreen` genérico, na aba perfil do profissional, por um **mini-painel** — layout "Identidade primeiro".

### Layout (de cima para baixo)

1. **Header** — eyebrow "Profissional" / `h2` "Perfil".
2. **Card de identidade** (herói) — avatar (foto ou iniciais), nome, área de atuação, experiência, e chip com CREF + cidade/UF. Fonte: `api/professionalProfile.ts` (`GET /me/professional-profile`, já existe) — campos `area` (via `AREA_LABEL`), `experiencia_anos`, `cref`, `cidade_uf` + display name do `/me`.
3. **Linha de stats de negócio** (compacta) — 3 números: **Alunos · Convites · Desafios**. Vêm de listas que já existem (mesmas fontes que a aba Início usa: lista de alunos, de convites, de desafios do pro). Sem novo endpoint.
4. **Engajamento agregado** — linha marcada **"em breve"** até o `GET /professional/overview` existir (TEC-100). Quando existir, vira número real (adesão 7d, check-ins, inativos).
5. **Ações da conta** — lista: "Editar perfil profissional" (→ edição do professional-profile), "Notificações" (em breve), "Termos & privacidade", "Sair".

### Por que "Identidade primeiro" e não "Negócio primeiro"

Esta é a aba PERFIL — a identidade profissional é o herói. Os stats grandes de negócio (KPIs) já são trabalho da aba **Início**; repeti-los grandes aqui criaria dois dashboards. Aqui o negócio é um resumo compacto, subordinado à identidade.

## Estados

- **Perfil profissional incompleto** (sem CREF/área/cidade) — mostrar só o que existe; o card de identidade degrada graciosamente (nome sempre presente via `/me`). CTA "Complete seu perfil" quando faltar o essencial.
- **Contagens carregando** — skeleton nos 3 stats.
- **Engajamento** — sempre "em breve" nesta fase (bloqueado por TEC-100); não renderizar número falso.
- **Nutri vs personal** — mesmo layout; a linha de stats de "Desafios" pode não se aplicar ao nutri (nutri não cria desafios) → esconder o stat que não fizer sentido por papel, não mostrar zero fixo.

## Fora de escopo

- Implementar o engajamento agregado real (depende de TEC-100).
- Reescrever o `AccountScreen` do aluno (permanece como está).
- Edição do perfil profissional em si (tela já existe).

## Impacto técnico

- Novo: `components/account/ProAccountPanel.tsx` (ou similar) — o mini-painel.
- Alterado: `screens/personal/tabs/perfil.tsx` e `screens/nutri/tabs/perfil.tsx` passam a renderizar o painel do pro em vez do `AccountScreen` genérico.
- Reuso: `api/professionalProfile.ts` + `AREA_LABEL`, hooks de lista já existentes (alunos/convites/desafios), linhas de ação e "Sair" do `AccountScreen` (extrair os itens de conta compartilhados para um componente reusável se estiverem acoplados demais ao `AccountScreen`).
- Tokens do tema apenas. 1 momento de motion (reveal), padrão.
