# Copilot Instructions: express-api-starter

<!-- Onboarding do agente, lido no início de cada sessão. Rode /setup para preencher. -->

## Project Overview

Template inicial de API HTTP em JavaScript sobre Express 5, pensado para quem vai
começar um serviço novo e quer os middlewares de base (log, segurança, CORS, JSON)
e o tratamento de erro já montados. A linguagem é JavaScript em módulos ES nativos
do Node, sem etapa de transpilação.

---

## Architecture

### Core Stack

- **Language/Runtime**: JavaScript (ESM) sobre Node 26
- **Framework**: Express 5
- **Database**: nenhum
- **Auth**: nenhum
- **Observability**: `morgan` no formato `dev` para log de requisição HTTP; sem métrica e sem trace
- **Testing**: Vitest 4 como runner, `supertest` para exercitar o app HTTP; sem biblioteca de mock

### Module/Package Structure

```
src/          raiz da aplicação: app.js (montagem do Express), index.js (listen), env.js (variáveis validadas), middlewares.js (notFound e errorHandler)
src/api/      routers da API versionada: index.js monta /api/v1 e agrega os routers de recurso; um arquivo por recurso (emojis.js)
test/         testes de integração HTTP, um arquivo por alvo (api.test.js, app.test.js)
```

---

## Key Conventions

### Exception Handling

O projeto não define tipos de erro próprios: usa `Error` nativo e delega ao
`errorHandler` do Express, que é o único lugar que formata a resposta. Quem quer
sinalizar erro fixa o status na resposta e chama `next(error)`:

```js
export function notFound(req, res, next) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}
```

O `errorHandler` é registrado por último em `app.js` e devolve sempre
`{ message, stack }` — a `stack` vira `"🥞"` quando `NODE_ENV === "production"`.
Status: o que já estiver na resposta, ou 500 quando ainda for 200.

### Authentication Pattern

Não se aplica — o projeto não tem autenticação.

### Logging

Log de requisição por `morgan("dev")`, registrado em `app.js` antes dos demais
middlewares. Não há logger de aplicação: fora do `morgan`, o projeto só usa
`console.error` no bootstrap (`env.js`, `index.js`), e o ESLint trata
`no-console` como `warn` justamente para que isso não se espalhe pelo `src/api`.
Nunca logar corpo de requisição nem header de autorização.

### Environment Variables

- `NODE_ENV` — modo de execução (`development` | `production` | `test`); default `development`. Controla se a stack de erro vai na resposta.
- `PORT` — porta do servidor HTTP; default `3000`, convertida para número por `z.coerce.number()`.

Leitura: `import { env } from "./env.js"`. O `process.env` é lido em um único
lugar (`src/env.js`), validado por schema Zod na carga do módulo — o ESLint
proíbe `process.env` no resto do código (`node/no-process-env`), com
`eslint-disable-next-line` apenas nas duas linhas de `env.js`.

### Database / Repository Pattern

Não se aplica — o projeto não tem banco nem camada de persistência.

---

## Padrões Obrigatórios

Checklist derivado das seções acima — vale para toda implementação ou correção de código, não só a fase em que o padrão foi introduzido. Verificar antes de considerar qualquer fase/correção concluída:

- **Exception handling**: usar tipos do projeto, não exceções genéricas
- **Logging**: usar o logger do projeto, nunca escrita direta em stdout/stderr em produção
- **Variáveis de ambiente**: sempre via função/método helper do projeto, nunca lendo o ambiente direto
- **Segurança**: nunca logar tokens, senhas ou dados pessoais
- **ESM com extensão**: todo import relativo termina em `.js` (`./api/index.js`) — o Node ESM não resolve extensão sozinho e o erro só aparece em runtime
- **Ordem dos middlewares**: `notFound` e `errorHandler` ficam por último em `app.js`; um `app.use` registrado depois deles nunca é alcançado
- **Router por recurso**: recurso novo vira arquivo em `src/api/` e é montado no `src/api/index.js`, não direto no `app.js`
- **Estilo travado pelo lint**: aspas duplas, ponto e vírgula, indentação 2, arquivos em kebab-case e imports ordenados — `pnpm run lint` corrige, mas o commit sai errado se não rodar

---

## Arquivos Protegidos

`.github/prompts/*.md` e este arquivo (`copilot-instructions.md`) só podem ser alterados por `/setup` e `/lesson`. Nenhum outro comando deve editá-los, mesmo incidentalmente — mudanças aqui alteram o comportamento de todo o workflow, e precisam passar pela revisão deliberada que esses dois comandos representam.

Falha três vezes seguidas no mesmo erro, em qualquer comando, é sinal de parar e reportar ao usuário — não de tentar uma quarta vez.

---

## Development Commands

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm run dev

# Executar testes
pnpm test

# Cobertura de testes
pnpm test

# Lint / formatação
pnpm run lint

# Build
# nenhum — Node ESM roda direto da fonte, sem bundler nem transpilação
```

**Caminho do relatório de cobertura:** ver `COVERAGE_REPORT` em `.github/scripts/coverage.sh`

---

## Integration Points

Nenhuma — o projeto não chama serviço externo nem é chamado por um. As únicas
dependências de runtime são bibliotecas in-process (Express, helmet, cors,
morgan, zod).

---

## Common Pitfalls

<!-- Adicione aqui erros recorrentes via /lesson -->

- `import { z } from "zod/v4"` — o projeto usa o subcaminho `v4` do zod, não a raiz; copiar `from "zod"` de exemplo de fora compila e só quebra na validação
- Coberturas de `src/index.js` e do bloco `catch` de `env.js` chamam `process.exit`: teste que as exercite mata o processo do Vitest. `src/index.js` está excluído da cobertura por isso
- `@vitest/coverage-v8` precisa casar a versão *exata* do `vitest` — com o range `^` o pnpm resolve uma minor à frente e o runner morre em `BaseCoverageProvider` não exportado
- O `coverage-summary.json` indexa por caminho absoluto do SO; qualquer leitor que cruze com saída de `git diff` precisa converter para relativo com barra normal

---

## Testing Conventions

Teste de integração HTTP: monta o `app` real e exercita a rota por `supertest`,
sem mock — não há camada externa para simular. Um arquivo por alvo em `test/`,
nomeado `<alvo>.test.js`, com um `describe` por rota nomeado `"MÉTODO /caminho"`:

```js
import request from "supertest";
import { describe, it } from "vitest";

import app from "../src/app.js";

describe("GET /api/v1/emojis", () => {
  it("responds with a json message", () =>
    request(app)
      .get("/api/v1/emojis")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, ["😀", "😳", "🙄"]));
});
```

**Meta de cobertura:** ver `COVERAGE_TARGET` em `.github/scripts/coverage.sh` — é de lá que `/test` e `/status` a leem

---

## Release Workflow

- **Branches**: ver `.github/scripts/release-branches.sh`
- **Features**: `feature/{N}-nome-descritivo` a partir da branch de integração — `{N}` é o número da issue, e é por ele que `/review` e `/fix-review` acham o relatório da feature
- **Versionamento**: SemVer em `X.Y.Z`, com sufixo `-rc.N` durante o ciclo de desenvolvimento (cada `/rc` incrementa o `N`); o `/release` remove o sufixo e publica a versão estável
- **Arquivos de versão**: ver `VERSION_FILES` em `.github/scripts/bump-version.sh`
- **CHANGELOG no desenvolvimento**: uma única seção por ciclo, sempre consolidada — cada RC reescreve a do topo com o delta acumulado, header na versão RC atual e `Unreleased` no lugar da data; o `/release` troca esse header pela versão final
