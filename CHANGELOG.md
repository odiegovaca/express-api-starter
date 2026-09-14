# Changelog

## [2.1.0-rc.1] - Unreleased

### Adicionado

- Parâmetros `limit` e `offset` em `GET /api/v1/emojis`, para recortar a listagem. Informar só um dos dois é válido; sem nenhum dos dois, a coleção inteira é devolvida como antes.
- Cabeçalho `X-Total-Count` em toda resposta de `GET /api/v1/emojis`, com o total da coleção — é por ele que o cliente sabe se ainda há páginas adiante.
- Validação de `limit` (inteiro, 1 a 100) e `offset` (inteiro, ≥ 0), com resposta 400 nomeando o parâmetro recusado.
