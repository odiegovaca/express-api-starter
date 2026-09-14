# Changelog

## [4.0.0] - 14/09/2026

### Adicionado

- Parâmetro `sort` em `GET /api/v1/emojis`, com os valores `nome` e `-nome`, que devolve a listagem ordenada pelo nome do emoji em ordem crescente ou decrescente. Sem o parâmetro, a ordem continua sendo a do catálogo. A ordenação entra depois do filtro de `q` e antes do recorte de `limit`/`offset`, ignora maiúsculas e acentos na ordem do português, e não altera o `X-Total-Count`.
- Validação de `sort`, com resposta 400 e a mensagem `sort: informe nome ou -nome` para qualquer outro valor.
- Endpoint `GET /api/v1/health`, que responde 200 com `status` (`ok`) e `version` (a versão do `package.json`). É o caminho para balanceador e monitor apontarem.

### Removido

- **Incompatível:** endpoint `GET /api/v1`, que devolvia a mensagem decorativa `API - 👋🌎🌍🌏`. A rota agora responde 404. Quem a usava como sinal de vida precisa passar a chamar `GET /api/v1/health`.

## [3.0.0] - 14/09/2026

### Adicionado

- Parâmetro `q` em `GET /api/v1/emojis`, que filtra o catálogo por trecho do nome, sem diferenciar maiúsculas de minúsculas. O filtro é aplicado antes do recorte.
- Parâmetros `limit` e `offset` em `GET /api/v1/emojis`, para recortar a listagem. Informar só um dos dois é válido; sem nenhum dos dois, a coleção inteira é devolvida.
- Cabeçalho `X-Total-Count` em toda resposta de `GET /api/v1/emojis`, com o total **após** o filtro de `q` — é por ele que o cliente sabe se ainda há páginas adiante.
- Validação de `q` (1 a 50 caracteres), `limit` (inteiro, 1 a 100) e `offset` (inteiro, ≥ 0), com resposta 400 nomeando o parâmetro recusado.
- Seção `API` no `README.md`, listando as rotas expostas e seus parâmetros.

### Modificado

- **Incompatível:** cada item de `GET /api/v1/emojis` passa a ser um objeto `{ "char": "😀", "name": "sorriso" }` em vez do caractere solto. Quem consome uma lista de textos precisa passar a ler o campo `char`.
- `NODE_ENV` ausente passa a equivaler a `production`, e não mais a `development`. Quem depende do comportamento de desenvolvimento precisa declarar a variável explicitamente.

### Removido

- **Incompatível:** endpoint `GET /`, que devolvia uma mensagem decorativa. A raiz agora responde 404; `GET /api/v1` continua respondendo por "a API está de pé".

### Segurança

- As respostas de erro deixam de trazer a pilha de execução, a menos que `NODE_ENV` seja explicitamente `development`. Antes, qualquer ambiente sem a variável definida devolvia caminho absoluto do servidor e versão exata das dependências em toda resposta 404 e 400.
