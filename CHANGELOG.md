# Changelog

## [2.1.0-rc.3] - Unreleased

### Adicionado

- Rota `GET /api/v1/health`, que responde 200 sem tocar no catalogo (RC que ficou para a proxima release).

- Parâmetro `q` em `GET /api/v1/emojis`, que filtra o catálogo por trecho do nome, sem diferenciar maiúsculas de minúsculas. O filtro é aplicado antes do recorte.
- Parâmetros `limit` e `offset` em `GET /api/v1/emojis`, para recortar a listagem. Informar só um dos dois é válido; sem nenhum dos dois, a coleção inteira é devolvida.
- Cabeçalho `X-Total-Count` em toda resposta de `GET /api/v1/emojis`, com o total **após** o filtro de `q` — é por ele que o cliente sabe se ainda há páginas adiante.
- Validação de `q` (1 a 50 caracteres), `limit` (inteiro, 1 a 100) e `offset` (inteiro, ≥ 0), com resposta 400 nomeando o parâmetro recusado.

### Modificado

- **Incompatível:** cada item de `GET /api/v1/emojis` passa a ser um objeto `{ "char": "😀", "name": "sorriso" }` em vez do caractere solto. Quem consome uma lista de textos precisa passar a ler o campo `char`.
- `NODE_ENV` ausente passa a equivaler a `production`, e não mais a `development`. Quem depende do comportamento de desenvolvimento precisa declarar a variável explicitamente.

### Removido

- **Incompatível:** endpoint `GET /`, que devolvia uma mensagem decorativa. A raiz agora responde 404; `GET /api/v1` continua respondendo por "a API está de pé".

### Segurança

- As respostas de erro deixam de trazer a pilha de execução, a menos que `NODE_ENV` seja explicitamente `development`. Antes, qualquer ambiente sem a variável definida devolvia caminho absoluto do servidor e versão exata das dependências em toda resposta 404 e 400.
