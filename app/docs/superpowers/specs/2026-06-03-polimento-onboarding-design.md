# Polimento visual do onboarding (Bloco 1) — Design

**Data:** 2026-06-03
**Autor:** Davi (designer) + Claude
**Escopo:** Elevar as telas funcionais do onboarding ao nível editorial já estabelecido pela `escolha-perfil`. **Apenas visual/UI** — não toca contrato de API, schemas, auth store nem roteamento de erro (isso é trabalho paralelo de finalização do Bloco 1, em outra sessão).

> ⚠️ **Coordenação:** outra sessão está finalizando o Bloco 1 (contrato/funcional) na mesma `branch/davi`. Este trabalho deve se limitar a JSX de apresentação e `StyleSheet` das telas, evitando editar lógica de formulário, mutations, store e arquivos de `src/api/`, `src/store/`, `src/features/*/hooks` ou `errors`. Em caso de sobreposição num mesmo arquivo de tela, preservar a lógica existente e mexer só na camada visual.

## Decisão de direção (validada no companion, 2026-06-03)

A `escolha-perfil` evoluiu para um tratamento editorial forte (foto full-bleed + bloco neon + manifesto). Para dar coesão, as telas funcionais adotam a mesma energia:

| Decisão | Escolha |
|---|---|
| Direção geral | **Editorial pleno** — faixa-hero no topo das telas funcionais |
| Tratamento de foto | **Foto + fade** — foto natural com degradê (`transparent → bgBase`) na base. Sem duotone, sem grade pesado. Coerente com a escolha-perfil atual |
| "Manifesto" | É o **próprio título editorial da tela** (ENTRAR, CREDENCIAMENTO ACTUS, DEFINA SUA SENHA…). **Nunca** frase de marketing inventada (constraint anti-slop) |
| Hero das telas de propósito único | Faixa ~150–170px: foto + símbolo (topo-esquerda) + eyebrow + título sobre o fade |
| Wizard (3 passos) | Hero **compacto** (~115px) com foto **distinta em cada passo** + barra de progresso segmentada logo abaixo, dentro do corpo |
| Splash | **Intocado** — símbolo isolado neon, momento de marca puro |
| escolha-perfil | **Referência já pronta**, não mexer |

## Telas no escopo

### 1. Login (`app/(auth)/login.tsx`)
- **Hero** (~150px): foto + símbolo no canto + eyebrow `ACESSO` + título `ENTRAR` (display 900) sobre o fade, no rodapé do hero.
- Corpo: campos E-mail / Senha (label eyebrow mono em cima — já existe via `Input label`), botão pill `Entrar`, link `Recebi um convite · Criar conta`.
- Preservar: `KeyboardAvoidingView`, banner de erro sóbrio (borda error radius 4, **sem shake**), marcação dos dois campos em `invalid_credentials`. A lógica de mutation/erro fica como está.
- **Motion única:** o reveal de entrada vira o reveal do hero (opacity + translateY sutil, 300ms). Não somar uma segunda animação.
- **Teclado:** com o hero no topo, garantir que o conteúdo do corpo não fique encoberto — envolver o corpo em scroll quando necessário (não o hero).

### 2. Sou professor (`app/(auth)/professor-info.tsx`)
- **Hero** (~170px, título em 2 linhas): eyebrow `ACESSO DE PROFESSOR` + título `CREDENCIAMENTO ACTUS`.
- Corpo: 3 passos numerados em mono neon (`01` fala com a equipe / `02` validamos CREF-CRN / `03` acesso liberado) com divisores 1px; CTAs pill `Entrar com meus dados` + outline `Falar com a equipe Actus`.

### 3. Troca de senha (`app/(auth)/trocar-senha.tsx`)
- **Hero** (~150px): eyebrow `PRIMEIRO ACESSO` + título `DEFINA SUA SENHA` (2 linhas).
- Corpo: senha provisória, nova senha (requisito `✓ 8+ CARACTERES` em mono neon quando atendido), confirmar nova senha; CTA pill `Salvar e entrar`.
- Preservar: gate sem botão voltar (gesture bloqueado), `setAccessTokenOnly`, mensagem `invalid_credentials` → "A senha atual não confere." A lógica fica como está.

### 4. Wizard de cadastro (`app/(auth)/cadastro/passo-{1,2,3}-*.tsx`)
- **Hero compacto** (~115px) em **cada** passo: foto distinta + símbolo + eyebrow `PASSO 0N / NOME` + título do passo sobre o fade.
- Logo abaixo do hero, **no corpo**: a barra de progresso segmentada (3 traços 3px — neon = feito, surface2 = pendente).
- Passo 1 (Convite): card do convidador [MOCK] com selo `DEMONSTRAÇÃO` + input mono do código + `✓ código recebido pelo link`.
- Passo 2 (Você): nome, nascimento, gênero em chips pill, CPF opcional mono. **É o passo mais denso** — hero precisa ser compacto para o form respirar; usar `ScrollView` no corpo.
- Passo 3 (Acesso): email, telefone, senha (requisito 8+).
- Preservar: FormProvider único, `cadastroDraftStore`, roteamento de erros do register entre passos, formatação de data com componentes **locais**. **Nada disso muda** — só a moldura visual do topo.

## Componente compartilhado

Criar um átomo `ScreenHero` em `src/components/ui/` para não duplicar a faixa-hero em 4+ telas:

```
<ScreenHero
  photo={require(...)}        // asset estático
  eyebrow="ACESSO"
  title="Entrar"              // título editorial; aceita 2 linhas
  compact={false}            // true → ~115px (wizard); false → ~150-170px
/>
```

- Composto por: `Image` (cover) + overlay de fade via `expo-linear-gradient` (`transparent → bgBase`) + `Logo variant="symbol"` no canto + bloco eyebrow/título no rodapé.
- **Tudo via tokens** (cores, spacing, type scale, fontFamily). Sem hex hardcoded.
- **Sem sombra** (constraint: sombra só em modal/sheet/dropdown).
- Isola Unistyles atrás do wrapper, como os demais átomos.
- O reveal de entrada (motion única da tela) pode ser orquestrado pela tela, não pelo hero, para a tela manter o controle do seu único momento de motion.

## Dependência de assets (bloqueante para o resultado final, não para começar)

A direção exige **6 fotos novas** (família: academia, real, rebaixada, mesma pegada da `hero-couple.png`):

| Foto | Tela |
|---|---|
| 1 | Login |
| 2 | Sou professor |
| 3 | Troca de senha |
| 4 | Wizard passo 1 (Convite) |
| 5 | Wizard passo 2 (Você) |
| 6 | Wizard passo 3 (Acesso) |

- Davi (designer) fornece as fotos curadas, ou começamos com placeholders temporários (Unsplash, mesma família) marcados `// [ASSET TEMPORÁRIO]` para não bloquear a implementação. Substituição é troca de `require`.
- Assets em `assets/images/` (mesmo diretório de `hero-couple.png`), otimizados para mobile.

## Fora de escopo

- Qualquer mudança de contrato de API, schema Zod, store, roteamento de erro (sessão paralela).
- Splash e escolha-perfil (já decididas).
- Blocos 2–6.

## Verificação

- `npm run typecheck` + `npm run lint` sem erro/any.
- Cada tela mantém **um único** momento de motion (o reveal/hero).
- Nenhum hex hardcoded — tudo via `theme`.
- Teclado não encobre campos no login e nos passos 2–3 do wizard.
- Bug de fuso intacto: data do passo 2 continua formatada com componentes locais.
- Validação visual de Davi no dev build, tela por tela, na ordem: login → professor → troca de senha → wizard (1, 2, 3).
