# Bloco 1 — Decisões visuais (validadas pelo designer em 01/06/2026)

Mockups de alta fidelidade em `.superpowers/brainstorm/` (gitignored). Decisões finais:

| # | Tela | Escolha | Descrição |
|---|------|---------|-----------|
| 01 | **Splash** | A — Símbolo isolado | Só o símbolo "A" em neon `#CBFE00` centrado sobre `bgLowest #10252D`. Wordmark "ACTUS" em mono 10px no rodapé. Motion única: reveal opacity 0→1 + scale 0.96→1 (300ms) |
| 02 | **Escolha de perfil** | B — Split editorial (evoluído) | **Estado atual (pós-iteração, ver commits `aead6d2`..`70488ae`):** Hero ~58% da altura = foto (academia, `hero-couple.png`) no topo + bloco neon SÓLIDO na base com símbolo dark + manifesto "O sistema por trás do movimento" (44px). Base escura: eyebrow ACESSO + dois cards-irmãos (raio 12) — "Sou aluno / Recebi um convite do meu treinador" (fill neon) e "Sou professor / Gerencio meus alunos" (outline), cada um com chevron → + link "Já tenho conta · Entrar". Motion única: bloco do hero desliza de cima no load. **Histórico:** a decisão original B previa bloco neon no topo (sem foto) + botões pill com tag "COM CONVITE"; substituído pela versão hero+foto+cards. Resolução de espaço vazio em `2026-06-02-escolha-perfil-espaco-vazio-design.md` |
| 03 | **Login** | A — Funcional direto | Símbolo pequeno topo-esquerda, eyebrow ACESSO, título ENTRAR (44px), campos email/senha (label mono em cima), botão pill "Entrar", link "Recebi um convite · Criar conta". Erro `invalid_credentials`: banner sóbrio borda 4px + bordas vermelhas nos campos — SEM shake |
| 04 | **"Sou professor"** | B — Passos numerados | Eyebrow ACESSO DE PROFESSOR + título CREDENCIAMENTO ACTUS + 3 passos numerados em mono neon (01 fala com equipe / 02 validamos CREF-CRN / 03 acesso liberado) com divisores 1px. CTAs: pill "Entrar com meus dados" + outline "Falar com a equipe Actus" |
| 05 | **Wizard cadastro** | A — Barra segmentada | 3 traços de progresso 3px (neon = feito, surface2 = pendente) no topo + eyebrow "PASSO N / NOME" + título do passo. Passo 1: card do convidador [MOCK] com selo DEMONSTRAÇÃO + input mono do código + "✓ código recebido pelo link". Passo 2: nome, nascimento, gênero em chips pill, CPF opcional mono. Passo 3: email, telefone, senha |
| 06 | **Troca de senha** | B — Com confirmação | Eyebrow PRIMEIRO ACESSO + título DEFINA SUA SENHA + campos: senha provisória, nova senha (requisito "✓ 8+ CARACTERES" em mono neon quando atendido), confirmar nova senha. CTA pill "Salvar e entrar". Sem botão voltar (gate) |

## Linguagem visual consolidada

- **Marca discreta no funcional, atitude editorial nos momentos de marca** (splash mínimo, escolha de perfil com manifesto)
- Labels de campo: **eyebrow mono uppercase** acima do input
- Dados técnicos (código de convite, CPF, datas): **Share Tech Mono** dentro do input
- Erros: banner sóbrio radius 4 + borda no campo — nunca shake/alarme
- Chips de seleção (gênero): pill, ativa = neon com texto inverse
- CTAs com verbo de resultado: "Usar meu convite", "Salvar e entrar", "Entrar com meus dados"
