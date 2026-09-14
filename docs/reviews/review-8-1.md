## Summary

**Data:** 2026-09-14-193153

**Estatísticas:** 0 critical, 1 high, 1 medium, 1 low

**Veredito:** APROVADO COM RESSALVAS

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

## Recomendações

### Must Have (bloqueantes)

- Problema 1 — HIGH

### Should Have

- Problema 2 — MEDIUM

### Nice to Have

- Problema 3 — LOW
