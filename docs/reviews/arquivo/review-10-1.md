## Summary

**Data:** 2026-09-14-194423

**Estatísticas:** 0 critical, 0 high, 1 medium, 1 low

**Veredito:** APROVADO

## Análise por Arquivo

### `src/api/health.js`

#### Problema 1 — MEDIUM

**Local:** `src/api/health.js:9`

```js
const { version } = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
);
```

**Explicação:** A leitura acontece no corpo do módulo, e `src/api/index.js` importa esse módulo, que `src/app.js` importa, que `src/index.js` importa. Qualquer falha aqui — arquivo ausente, permissão, JSON inválido — lança durante o carregamento do grafo de módulos e **derruba o processo inteiro na subida**, não só o `/health`. Um endpoint cuja razão de existir é dizer se o serviço está de pé é justamente o que não deve poder impedir o serviço de subir.

Vale também para o caminho relativo `../../package.json`: ele é correto hoje, mas amarra o arquivo à profundidade em que está. Mover `health.js` uma pasta quebra o boot, e o erro aponta para um `readFileSync`, não para o import que o disparou.

**Solução:** Ler dentro de um `try`/`catch`, guardando `version` como `"desconhecida"` no fracasso, para o endpoint continuar respondendo `status: "ok"` mesmo sem conseguir dizer a versão. O contrato da RN06 (versão lida, não fixada) continua valendo; o que muda é que a falha vira uma resposta degradada em vez de um processo morto.

### `test/api.test.js`

#### Problema 2 — LOW

**Local:** `test/api.test.js` — bloco `leaks neither file path nor dependency name`

```js
expect(corpo).not.toContain("node_modules");
expect(corpo).not.toContain("express");
```

**Explicação:** As duas primeiras asserções procuram substrings que nunca estiveram no corpo, e a terceira — `expect(Object.keys(res.body).sort()).toEqual(["status", "version"])` — já prova a RN07 inteira, de forma exata: nenhuma chave além dessas duas pode aparecer. As duas primeiras são redundantes e dão a impressão de cobrir mais do que cobrem; a de `"express"` ainda é frágil, porque basta a versão ou o status um dia conterem essa palavra para o teste falhar por motivo errado.

**Solução:** Manter só a asserção das chaves exatas, que é a que prende a regra, e deixar o comentário explicando que é ela quem cobre a RN07.

## Recomendações

### Must Have (bloqueantes)

- Nenhum.

### Should Have

- Problema 1 — MEDIUM

### Nice to Have

- Problema 2 — LOW

## Pós-fix

**Correções aplicadas:** #1, #2
**Status pós-fix:** liberado
**Bloqueantes pendentes:** nenhum
