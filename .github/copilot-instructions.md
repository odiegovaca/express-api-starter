# Copilot Instructions: express-api-starter

<!-- Onboarding do agente, lido no início de cada sessão. Rode /setup para preencher. -->

## Project Overview

Template inicial de API HTTP em JavaScript sobre Express 5, para quem vai começar um serviço novo e quer os middlewares de base (log de requisição, cabeçalhos de segurança, CORS, corpo JSON) e o tratamento de erro já montados. A única rota de domínio é um catálogo de emojis em memória, servida como exemplo de listagem com filtro e paginação. A linguagem é JavaScript em módulos ES nativos do Node, sem etapa de transpilação.

---

## Architecture

### Core Stack

- **Language/Runtime**: JavaScript (ESM) sobre Node 26
- **Framework**: Express 5
- **Database**: nenhum — o catálogo é uma constante em memória (`EMOJIS` em `src/api/emojis.js`)
- **Auth**: nenhum
- **Observability**: log de requisição HTTP via `morgan("dev")` em `src/app.js`; nenhuma métrica e nenhum trace
- **Testing**: Vitest como runner, `supertest` para exercitar o app HTTP; nenhuma biblioteca de mock — os testes chamam o app de verdade

### Module/Package Structure

```
src/          ponto de entrada (index.js), montagem do app (app.js), leitura
              validada do ambiente (env.js) e os middlewares de 404/erro
              (middlewares.js)
src/api/      as rotas expostas — index.js monta o router de /api/v1 e
              emojis.js implementa o catálogo
test/         testes de integração HTTP, um arquivo por área (app, api)
docs/issues/  specs de feature geradas pelo /spec
docs/reviews/ relatórios de revisão gerados pelo /review
```

---

## Key Conventions

### Exception Handling

O projeto usa `Error` nativo e o funil de erro do Express: quem não encontra rota cria o erro e passa adiante, e um único `errorHandler` transforma qualquer erro em resposta JSON. O status vem do que já foi marcado na resposta, com 500 como padrão:

```js
export function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: env.NODE_ENV === "development" ? err.stack : "🥞",
  });
}
```

O formato da resposta de erro é sempre `{ "message": string, "stack": string }` — a pilha só é real em `development`; em qualquer outro ambiente vai o literal `"🥞"`.

**Exceção deliberada:** erro de validação de query responde direto no handler, sem passar pelo `errorHandler`, porque ali a pilha vazaria caminho absoluto e versão de dependência num 400 público (ver `src/api/emojis.js`).

### Authentication Pattern

Não se aplica — o projeto não tem autenticação.

### Logging

Não há logger de aplicação. O único log é o de requisição, montado uma vez em `src/app.js`:

```js
app.use(morgan("dev"));
```

Erro de bootstrap sai por `console.error` em `src/env.js`, antes de o app subir. Nunca logar valor de variável de ambiente, nem o conteúdo de `process.env`: o `env.js` só nomeia a variável que faltou, não o que ela continha.

### Environment Variables

- `NODE_ENV` — decide se a resposta de erro carrega a pilha. Valores aceitos: `development`, `production`, `test`. Ausente equivale a `production` (default seguro).
- `PORT` — porta do servidor HTTP. Default `3000`, convertida para número pelo schema.

Ambas são lidas **exclusivamente** por `src/env.js`, que valida com Zod e exporta o objeto `env`. No resto do código, importar `env` — nunca ler `process.env` direto (as duas únicas leituras diretas existem em `env.js` e estão marcadas com `eslint-disable-next-line node/no-process-env`).

### Database / Repository Pattern

Não se aplica — não há banco. O catálogo é a constante `EMOJIS` em `src/api/emojis.js`, filtrada e recortada em memória no próprio handler.

---

## Padrões Obrigatórios

Checklist derivado das seções acima — vale para toda implementação ou correção de código, não só a fase em que o padrão foi introduzido. Verificar antes de considerar qualquer fase/correção concluída:

- **Exception handling**: usar tipos do projeto, não exceções genéricas
- **Logging**: usar o logger do projeto, nunca escrita direta em stdout/stderr em produção
- **Variáveis de ambiente**: sempre via função/método helper do projeto, nunca lendo o ambiente direto
- **Segurança**: nunca logar tokens, senhas ou dados pessoais
- **Validação de entrada**: toda query, corpo ou parâmetro de rota passa por um schema Zod com `safeParse`, e a resposta 400 nomeia o parâmetro recusado — nunca ler `req.query` cru
- **ESM explícito**: todo import relativo leva a extensão `.js`; sem ela o Node não resolve o módulo
- **Ordem dos middlewares**: `notFound` e `errorHandler` são sempre os últimos `app.use` — registrar rota depois deles a torna inalcançável

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
pnpm dev

# Executar testes
pnpm test

# Cobertura de testes
pnpm test

# Lint / formatação
pnpm lint

# Build
# não há etapa de build: JavaScript ESM roda direto no Node
```

**Caminho do relatório de cobertura:** ver `COVERAGE_REPORT` em `.github/scripts/coverage.sh`

---

## Integration Points

Nenhuma — o projeto não chama nenhum sistema externo e não é chamado por nenhum cliente conhecido.

---

## Common Pitfalls

<!-- Adicione aqui erros recorrentes via /lesson -->

- `NODE_ENV` ausente equivale a `production`, não a `development`: rodar local sem o `.env` faz a resposta de erro sair sem pilha, e parece bug de teste.
- O `errorHandler` deriva o status de `res.statusCode`: responder um erro sem ter marcado o status antes vira 500, mesmo quando a intenção era 400.
- `pnpm lint` roda `eslint --fix`, que **altera arquivos**. Rodar lint no meio de uma revisão de diff mistura correção automática com a mudança da feature.

---

## Testing Conventions

Os testes ficam em `test/`, um arquivo por área, nomeados `<area>.test.js`. São testes de integração HTTP: importam o `app` montado e o exercitam com `supertest`, sem mock — não há dependência externa para dublar.

```js
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

describe("GET /api/v1/emojis", () => {
  it("cuts the collection with limit", () =>
    request(app)
      .get("/api/v1/emojis?limit=2")
      .expect(200, CATALOGO.slice(0, 2)));
});
```

A ordem, o conjunto ou o valor que um teste espera é escrito à mão, nunca derivado chamando a mesma função (ou uma parecida com a) que a produção usa. Derivar repete a regra em vez de prová-la, e passa verde quando teste e produção divergem.

**Meta de cobertura:** ver `COVERAGE_TARGET` em `.github/scripts/coverage.sh` — é de lá que `/test` e `/status` a leem

---

## Release Workflow

- **Branches**: ver `.github/scripts/release-branches.sh`
- **Features**: `feature/{N}-nome-descritivo` a partir da branch de integração — `{N}` é o número da issue, e é por ele que `/review` e `/fix-review` acham o relatório da feature
- **Versionamento**: SemVer no campo `version` do `package.json`; o sufixo de pré-lançamento `-rc.N` é usado do primeiro `/rc` do ciclo até o `/release`, que o remove
- **Arquivos de versão**: ver `VERSION_FILES` em `.github/scripts/bump-version.sh`
- **CHANGELOG no desenvolvimento**: uma única seção por ciclo, sempre consolidada — cada RC reescreve a do topo com o delta acumulado, header na versão RC atual e `Unreleased` no lugar da data; o `/release` troca esse header pela versão final
