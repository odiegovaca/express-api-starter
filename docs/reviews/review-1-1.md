## Summary

**Data:** 2026-09-14-000658

**Estatísticas:** 1 critical, 0 high, 1 medium, 3 low

**Veredito:** REPROVADO

## Análise por Arquivo


#### Problema 1 — CRITICAL

**Local:** `src/api/emojis.js:28`

```js
res.status(400);
next(new Error(parsed.error.issues.map(describeIssue).join("; ")));
```

**Explicação:** O erro de validação é entregue ao `errorHandler` de
`src/middlewares.js`, que só oculta a pilha quando `env.NODE_ENV === "production"`.
O schema de `src/env.js` faz `NODE_ENV` cair em `"development"` por omissão — ou
seja, um deploy que simplesmente não define a variável responde a **toda entrada
inválida** com a pilha completa. Resposta real medida nesta branch:

```
GET /api/v1/emojis?limit=0  →  400, 1611 bytes
{"message":"limit: ...","stack":"Error: ...\n    at file:///C:/Projetos/dev/
express-api-starter/src/api/emojis.js:28:10\n    at Layer.handleRequest
(C:\Projetos\dev\express-api-starter\node_modules\.pnpm\router@2.2.0_...
```

Vazam o caminho absoluto do servidor, a estrutura de diretórios, o gerenciador de
pacotes e a **versão exata das dependências** (`router@2.2.0`) — insumo direto para
escolher exploit conhecido. É OWASP A05 (Security Misconfiguration) / exposição de
dado sensível, e esta é a primeira rota da API a expor um erro de validação
acionável por qualquer cliente anônimo, sem autenticação: antes desta feature só
o 404 genérico chegava ao `errorHandler`.

**Solução:** Não trafegar erro de validação pelo `errorHandler`. Responder direto
no handler com o corpo já formatado, sem `Error` e sem pilha:

```js
if (!parsed.success) {
  res.status(400).json({ message: parsed.error.issues.map(describeIssue).join("; ") });
  return;
}
```

Independentemente disso, o `errorHandler` deveria omitir a pilha por padrão e só
incluí-la quando explicitamente em desenvolvimento — o default seguro é o inverso
do atual.

#### Problema 2 — MEDIUM

**Local:** `src/api/emojis.js:37`

```js
res.set("X-Total-Count", String(EMOJIS.length));
res.json(recorte);
```

**Explicação:** O Requisito 4 da spec diz que o total vai "no cabeçalho
`X-Total-Count` de **toda resposta da listagem**", e a RN02 justifica o cabeçalho
como o sinal de que há páginas adiante. Mas o `res.set` está **depois** do
`return` do ramo de erro: as respostas 400 saem sem o cabeçalho. Os critérios de
aceite só cobrem os casos 200, então o teste não pega a lacuna — a spec e o código
divergem sem ninguém notar.

**Solução:** Ou mover o `res.set` para antes da validação, ou corrigir o
Requisito 4 para dizer "de toda resposta bem-sucedida". As duas são defensáveis;
o que não pode é a spec dizer uma coisa e o código fazer outra.

#### Problema 3 — LOW

**Local:** `src/api/emojis.js:14-20`

```js
function describeIssue(issue) {
  const campo = issue.path[0];
  if (campo === "limit") {
    return "limit: informe um numero inteiro entre 1 e 100";
  }
  return "offset: informe um numero inteiro maior ou igual a 0";
}
```

**Explicação:** O `else` implícito assume que todo issue que não é `limit` é
`offset`. Hoje o schema só tem esses dois campos, então está correto — mas um
terceiro parâmetro adicionado depois sairia com a mensagem de `offset`, errada e
difícil de rastrear. O acoplamento entre o schema e esta função é invisível.

**Solução:** Tabela explícita indexada pelo campo, com fallback genérico:

```js
const MENSAGENS = {
  limit: "limit: informe um numero inteiro entre 1 e 100",
  offset: "offset: informe um numero inteiro maior ou igual a 0",
};
const describeIssue = issue => MENSAGENS[issue.path[0]] ?? `${issue.path[0]}: valor invalido`;
```

#### Problema 4 — LOW

**Local:** `test/api.test.js:60`

```js
it("reports the full collection size in X-Total-Count", async () => {
  for (const query of ["", "?limit=2", ...]) {
```

**Explicação:** Cinco asserções dentro de um `for` num único `it`. A primeira que
falhar interrompe o laço e esconde as outras quatro, e o nome do teste não diz
qual recorte quebrou. O próprio arquivo já usa `it.each` logo abaixo, para o caso
das entradas inválidas — o padrão existe e não foi seguido aqui.

**Solução:** Trocar o laço por `it.each` com os cinco recortes, como no bloco
seguinte.


#### Problema 5 — LOW

**Local:** `.github/copilot-instructions.md:118`

```markdown
# Executar testes
pnpm test

# Cobertura de testes
pnpm test
```

**Explicação:** As duas entradas da seção Development Commands trazem o mesmo
comando. É verdade — desde que o `--coverage` entrou no script `test`, rodar os
testes e gerar a cobertura viraram o mesmo ato — mas listar o mesmo comando duas
vezes sugere que existe um comando de cobertura separado que alguém esqueceu de
preencher.

**Solução:** Fundir as duas linhas numa só, deixando explícito que o comando de
teste já emite o relatório.

## Recomendações

### Must Have (bloqueantes)

- Problema 1 — CRITICAL

### Should Have

- Problema 2 — MEDIUM

### Nice to Have

- Problema 3 — LOW
- Problema 4 — LOW
- Problema 5 — LOW

## Pós-fix

**Correções aplicadas:** #1, #2, #3, #4
**Status pós-fix:** revisar

**Dispensadas:**

- #5 (LOW) — arquivo protegido (.github/copilot-instructions.md:118) — só /setup e /lesson podem alterá-lo
