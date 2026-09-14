---
description: Implementar funcionalidade completa seguindo spec e padrões do projeto
agent: agent
tools: [read, edit, search, execute, todo]
argument-hint: "Caminho da spec ou descrição da funcionalidade"
---

# /code - Implementar Funcionalidade

## Processo

### 1 — Preparação

1. **Leia `.github/copilot-instructions.md` completamente**
2. Leia a spec em `docs/issues/spec-*.md` — liste as disponíveis se não especificada. Se o `Status` for `Rascunho`/`Em Revisão`, ou houver "Questões em Aberto" pendentes, avisar o usuário e confirmar antes de prosseguir — implementar spec incompleta gera requisito adivinhado
3. Confira a branch:

   ```bash
   .github/scripts/code-branch.sh [caminho-da-spec]
   ```

   Com `BRANCH_OK=nao`, criar `feature/{FEATURE_N}-nome-descritivo` antes de começar. Com `FEATURE_N` vazio, perguntar o número da issue ao usuário primeiro.

4. Procure no código existente por funcionalidade ou padrão análogo relacionado à spec — evita reimplementar algo que já existe ou divergir de um padrão já estabelecido
5. Monte `manage_todo_list` com todas as tarefas antes de começar

### 2 — Implementação

Cada fase segue os padrões de `copilot-instructions.md` e só termina com o código dela conforme a seção "Padrões Obrigatórios".

#### 2.1 — Dados em memória (se houver)

A coleção ou constante que a feature consulta, em `src/api/<area>.js`, junto do handler que a usa. Não há banco nem migration neste projeto: o dado nasce como estrutura JavaScript no módulo da rota.

#### 2.2 — Schema de validação e regra de negócio

O schema Zod da entrada (`z.object({...})`) e as funções puras que filtram, ordenam ou recortam a coleção. Toda query, corpo e parâmetro de rota passa por `safeParse` — nunca por leitura crua de `req.query`. A mensagem de recusa é indexada por campo (ver `MENSAGENS` em `src/api/emojis.js`), para que acrescentar um parâmetro não faça a mensagem de outro responder por ele.

#### 2.3 — Rota

O handler no `express.Router()` do módulo da área, registrado no router de `/api/v1` em `src/api/index.js`. Status correto por caso: 200 na leitura, 400 com o parâmetro nomeado na entrada inválida. Erro de validação responde direto no handler, sem `next(error)` — pelo `errorHandler` a resposta levaria a pilha junto.

#### 2.4 — Configuração

Variável de ambiente nova entra no schema de `src/env.js` (com default seguro) e no `.env.sample`; rota nova entra na seção `API` do `README.md`. Não há container de dependências.

#### 2.5 — Testes Básicos

Testes de integração HTTP em `test/<area>.test.js`, com `supertest` sobre o `app` importado de `../src/app.js`, cobrindo o caminho feliz de cada rota e cada recusa 400 que a spec prevê. Sem mock: não há dependência externa para dublar. Estrutura, nomes e localização seguem a seção Testing Conventions de `copilot-instructions.md`.

> Testes de borda, cobertura de branches e casos extras ficam para o `/test`.

### 3 — Validação Final

```bash
.github/scripts/validate.sh lint build test
```

Precisa terminar sem erro antes de prosseguir. `test` roda a suíte completa do projeto, não só os testes criados em 2.5.

## Próximos Passos

```markdown
✅ Implementação concluída. Próximos passos:

1. Revise as Changes da branch (git diff ou painel Source Control)
2. Se aprovado: git commit -m "feat: <descrição>"  ← checkpoint antes do review
3. /test    → completar cobertura até a meta do projeto (casos de borda e gaps)
4. /review  → revisão de qualidade antes do PR
5. /rc      → criar PR
```
