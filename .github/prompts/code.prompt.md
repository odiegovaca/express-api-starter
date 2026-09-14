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

#### 2.1 — Dados em Memória (se houver)

O projeto não tem banco: o estado de um recurso mora em módulo próprio sob `src/api/`,
exportado como estrutura JS. Quando a feature precisar de dados, definir aqui a forma
do registro e a origem (constante, arquivo estático ou memória de processo), antes de
qualquer rota tocá-la.

#### 2.2 — Schema e Lógica de Negócio

Schema Zod para toda entrada que vem do cliente (body, query, params) — é o zod que
valida campo, não `if` manual. A transformação/derivação fica em função pura,
separada do handler. Erro esperado vira `Error` com o status fixado na resposta antes
do `next(error)`, conforme Exception Handling de `copilot-instructions.md`.

#### 2.3 — Rota

Router Express do recurso em `src/api/<recurso>.js`, montado no `src/api/index.js`
sob `/api/v1` — nunca direto no `app.js`. Status correto por operação
(200 leitura, 201 criação, 400 entrada inválida, 404 inexistente).

#### 2.4 — Configuração

Variável de ambiente nova entra no schema de `src/env.js` e no `.env.sample`;
dependência nova entra no `package.json`. Ajustar o `README.md` quando a rota
for parte da superfície pública do template.

#### 2.5 — Testes Básicos

Testes de integração HTTP em `test/<alvo>.test.js` com `supertest` sobre o `app`
real — sem mock, porque não há dependência externa a simular. Cobrir o happy path de
cada rota nova e os erros que a spec prevê (entrada inválida, recurso inexistente).
Estrutura, nomes e localização seguem a seção Testing Conventions de
`copilot-instructions.md`.

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
