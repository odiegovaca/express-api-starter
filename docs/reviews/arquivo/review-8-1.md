## Summary

**Data:** 2026-09-14-193153

**Estatísticas:** 1 critical, 1 high, 1 medium, 1 low

**Veredito:** REPROVADO

## Análise por Arquivo

### `src/api/emojis.js`

#### Problema 1 — HIGH

**Local:** `test/api.test.js:99`

```js
const POR_NOME = [...CATALOGO].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
```

**Explicação:** A RN04 da spec diz que a comparação de nomes ignora maiúsculas e acentos. A produção implementa isso com `Intl.Collator("pt-BR", { sensitivity: "base" })`; o teste calcula a expectativa com `String.prototype.localeCompare` **sem** `sensitivity`, que é sensível a acento e a caixa. São dois comparadores diferentes.

Hoje os dois concordam por acidente: o catálogo tem `sorriso`, `ruborizado` e `revirando`, todos minúsculos e sem acento — o caso que a RN04 existe para tratar não aparece em nenhum teste. O resultado é que **nenhum teste exercita a RN04**, e o critério de aceite "Testes cobrem a ordem crescente, a ordem decrescente..." está marcado sem estar cumprido. Trocar `sensitivity: "base"` por outra coisa, ou remover o `Collator` e usar comparação de string crua, não quebraria nenhum teste.

**Solução:** Acrescentar ao catálogo (ou a um caso de teste que injete a coleção) pelo menos um nome acentuado e um com maiúscula, e derivar a expectativa do teste do **mesmo** comparador da produção — ou, melhor, escrever a ordem esperada à mão (`["ácido", "banana", "Zebra"]`), que é o que prova a regra em vez de repeti-la.

#### Problema 2 — MEDIUM

**Local:** `test/api.test.js:123`

```js
it("keeps X-Total-Count as the post-filter total when sort is given", async () => {
  const res = await request(app).get("/api/v1/emojis?q=r&sort=-nome").expect(200);
  expect(res.headers["x-total-count"]).toBe("3");
});
```

**Explicação:** O teste se propõe a provar a RN05 (o total é o pós-filtro, e ordenar não o altera), mas `q=r` casa com os três emojis do catálogo (`sorriso`, `ruborizado`, `revirando`). O valor esperado, `3`, é igual ao total **sem** filtro. Se a implementação passasse a contar a coleção crua, o teste continuaria verde.

**Solução:** Usar um `q` que recorte de verdade — `q=ru` casa só com `ruborizado`, e a expectativa vira `1`, que só passa se o total for o pós-filtro.

#### Problema 3 — LOW

**Local:** `src/api/emojis.js:32`

```js
return MENSAGENS[campo] ?? `${campo}: valor invalido`;
```

**Explicação:** Com `sort` acrescentado ao `MENSAGENS`, os quatro campos do schema têm mensagem própria e o lado direito do `??` ficou inalcançável — é a única branch descoberta do arquivo (`emojis.js` em 92,3% de branches, linha 32). Não é defeito: o fallback é a rede de segurança para quando alguém acrescentar um campo ao schema e esquecer a mensagem.

**Solução:** Manter, e deixar a intenção explícita — um comentário de uma linha dizendo que a branch é deliberadamente inalcançável enquanto todo campo tiver mensagem evita que uma futura caçada a cobertura de branch a remova.

#### Problema 4 — CRITICAL

**Local:** `src/api/emojis.js:66`

```js
const ordenados = sort === undefined
  ? filtrados
  : filtrados.sort((a, b) => sort === "-nome"
      ? colacao.compare(b.name, a.name)
      : colacao.compare(a.name, b.name));
```

**Explicação:** `Array.prototype.sort` ordena **no lugar**. Quando `q` não é informado, `filtrados` **é** a própria constante `EMOJIS` do módulo — não uma cópia. Uma única requisição `GET /api/v1/emojis?sort=nome` reordena o catálogo compartilhado de forma permanente, para todas as requisições seguintes do processo, inclusive as que não pedem ordenação. O critério de aceite "Sistema devolve a ordem original do catálogo quando a requisição não traz `sort`" passa a ser falso a partir da primeira requisição ordenada, e o estado só volta ao normal com um restart.

Num catálogo em memória o estrago é a ordem; no mesmo padrão sobre uma coleção mutável carregada de banco ou cache, é corrupção de dados compartilhados entre requisições — daí a severidade.

**A suíte não pega isso, e vale entender por quê:** no bloco `GET /api/v1/emojis?sort`, o teste de ordem decrescente roda logo antes do teste de ordem original e, por coincidência do catálogo atual (`sorriso`, `ruborizado`, `revirando`), a ordem decrescente por nome **é** a ordem original. A mutação do teste anterior é desfeita pela do seguinte, e os 32 testes passam verdes sobre o código defeituoso.

**Solução:** Ordenar sobre uma cópia — `[...filtrados].sort(...)` — e fechar o buraco de teste com um caso que faça uma requisição ordenada e, **na sequência**, uma sem `sort`, afirmando a ordem original. Sem esse teste, a correção não fica travada.

## Recomendações

### Must Have (bloqueantes)

- Problema 1 — HIGH
- Problema 4 — CRITICAL

### Should Have

- Problema 2 — MEDIUM

### Nice to Have

- Problema 3 — LOW

## Pós-fix

**Correções aplicadas:** #1, #4
**Status pós-fix:** revisar
**Bloqueantes pendentes:** nenhum
