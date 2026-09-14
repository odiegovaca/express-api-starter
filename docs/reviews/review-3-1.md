## Summary

**Data:** 2026-09-14-002418

**Estatísticas:** 0 critical, 1 high, 1 medium, 2 low

**Veredito:** APROVADO COM RESSALVAS

## Análise por Arquivo

#### Problema 1 — HIGH

**Local:** `src/app.js:17`

```js
app.use("/api/v1", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
```

**Explicação:** Remover o `GET /` sem mais nada faz a raiz do serviço cair no
`notFound`, e o `errorHandler` de `middlewares.js` só esconde a pilha quando
`NODE_ENV === "production"` — que é justamente o valor que `src/env.js` **não**
assume por padrão. O resultado é que o endereço mais acessado de qualquer serviço
(raiz, sonda de uptime, crawler, health check de load balancer) passa a devolver:

```
GET /  →  404, 1570 bytes
{"message":"🔍 - Not Found - /","stack":"Error: 🔍 - Not Found - /\n
  at notFound (file:///C:/Projetos/dev/express-api-starter/src/middlewares.js:5:17)\n
  at Layer.handleRequest (C:\...\node_modules\.pnpm\router@2.2.0_supports-color@7.2.0\...
```

A feature #1 tomou o cuidado de não vazar pilha no 400 de validação. Esta feature
reabre o mesmo vazamento pela porta da frente, e num endereço bem mais exposto —
antes da mudança a raiz respondia 200 e nunca chegava ao `errorHandler`.

O critério de aceite "Sistema responde 404 em `GET /`" foi cumprido ao pé da letra,
e é por isso que a suíte passa: o teste confere o status, não o corpo.

**Solução:** Fazer o `errorHandler` omitir a pilha por padrão, incluindo-a só
quando explicitamente em desenvolvimento — o inverso do default atual:

```js
stack: env.NODE_ENV === "development" ? err.stack : undefined,
```

E acrescentar ao teste da raiz uma asserção de que o corpo **não** traz `stack`,
para a regressão não voltar em silêncio.

#### Problema 2 — MEDIUM

**Local:** `src/api/emojis.js:52`

```js
const filtrados = q === undefined
  ? EMOJIS
  : EMOJIS.filter(emoji => emoji.name.includes(q.toLowerCase()));
```

**Explicação:** A busca é case-insensitive só porque todos os nomes do catálogo
estão em minúsculas hoje — o `toLowerCase()` é aplicado ao termo, nunca ao nome.
O Requisito 1 pede "nome curto em português, sem acento e sem espaço", e não diz
nada sobre caixa. Um nome futuro escrito como `Piscadela` deixaria de ser
encontrado por `q=piscadela`, violando o Requisito 4 sem que nenhum teste falhe.

A regra está codificada numa convenção implícita dos dados em vez de no código que
a implementa.

**Solução:** Normalizar os dois lados — `emoji.name.toLowerCase().includes(q.toLowerCase())` —
ou, melhor, normalizar uma vez na construção do catálogo e documentar a invariante.

#### Problema 3 — LOW

**Local:** `test/api.test.js:76`

```js
it.each(["", "?limit=2", "?offset=1", "?limit=1&offset=1", "?offset=99"])(
  "reports the full collection size in X-Total-Count for %s",
```

**Explicação:** O nome do teste ficou desatualizado. Depois do Requisito 6, o
cabeçalho não é mais "the full collection size": é o total **após o filtro**. Os
casos listados não usam `q`, então o valor 3 continua certo e o teste passa — mas
o nome agora descreve uma regra que o sistema não segue mais. Quem ler o arquivo
para entender a semântica do cabeçalho vai entender errado.

**Solução:** Renomear para algo como `reports the filtered total in X-Total-Count`,
já que o caso sem `q` é só o filtro vazio.

#### Problema 4 — LOW

**Local:** `README.md:1`

```markdown
# Express API Starter
A JavaScript Express v5 starter template with sensible defaults.
```

**Explicação:** O README não menciona nenhuma rota, então não ficou factualmente
errado com a remoção do `GET /`. Mas esta é a segunda feature seguida a mudar o
contrato público da listagem (`limit`/`offset`, agora `q` e a forma do item) e a
primeira a remover um endpoint, e o template segue sem uma seção que diga o que a
API expõe. Para um repositório cujo propósito é ser copiado, a superfície pública
não documentada é a lacuna mais cara.

**Solução:** Seção "API" no README com as três rotas atuais e seus parâmetros.
Fora do escopo desta feature — vale abrir como item próprio.

## Recomendações

### Must Have (bloqueantes)

- Problema 1 — HIGH

### Should Have

- Problema 2 — MEDIUM

### Nice to Have

- Problema 3 — LOW
- Problema 4 — LOW

## Pós-fix

**Correções aplicadas:** #1, #2, #3
**Status pós-fix:** revisar

**Dispensadas:**

- #4 (LOW) — documentar a API inteira excede o escopo desta feature; vira item proprio
