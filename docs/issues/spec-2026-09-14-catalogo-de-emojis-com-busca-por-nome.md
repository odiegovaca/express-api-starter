# Catálogo de emojis com busca por nome

**Data**: 14/09/2026  
**Status**: `Issue criada`  
**Issue**: [#3](https://github.com/odiegovaca/express-api-starter/issues/3)  
**Tipo**: `improvement`

## O Que Será Feito

A listagem de emojis hoje devolve só os caracteres. Quem consome não tem como
procurar um emoji específico sem baixar a coleção inteira e comparar caractere a
caractere — o que só funciona enquanto a coleção couber numa tela.

Esta funcionalidade dá nome a cada emoji e abre uma busca por esse nome. Cada item
da listagem passa a ser um objeto com o caractere e o nome, em vez do caractere
solto, e um novo parâmetro filtra a coleção por trecho do nome.

Junto disso, o endpoint raiz da aplicação sai do ar. Ele devolve uma mensagem
decorativa que não faz parte da API e duplica o papel de `GET /api/v1`, que já
responde por "a API está de pé". Manter dois endereços para a mesma pergunta
confunde quem parte deste template.

**Esta é uma mudança incompatível:** quem consome a listagem hoje recebe uma lista
de textos e passará a receber uma lista de objetos; quem chama a raiz passará a
receber 404.

## Requisitos

1. O sistema dá a cada emoji da coleção um nome curto em português, sem acento e sem espaço.
2. O sistema devolve cada item da listagem como objeto com os campos `char` e `name`.
3. O sistema aceita o parâmetro `q` na listagem, filtrando os itens cujo nome contenha o trecho informado.
4. O sistema ignora diferença entre maiúsculas e minúsculas ao comparar o trecho de `q`.
5. O sistema aplica o filtro de `q` antes do recorte de `limit` e `offset`.
6. O sistema informa em `X-Total-Count` o total **após** o filtro de `q`.
7. O sistema deixa de responder na raiz (`GET /`), que passa a cair no tratamento de rota não encontrada.

## Fora de Escopo

- Busca por caractere do emoji ou por categoria. Só o nome.
- Busca aproximada, por similaridade ou por sinônimo. O filtro é por trecho literal.
- Nomes em outros idiomas.
- Qualquer mudança no `GET /api/v1`, que continua respondendo como hoje.

## Regras de Negócio

- **RN01**: O filtro de `q` vem antes do recorte, e não depois. Filtrar depois de paginar devolveria páginas de tamanhos imprevisíveis e esconderia resultados que estavam fora da primeira página.
- **RN02**: `X-Total-Count` conta o resultado do filtro, não a coleção inteira. O cabeçalho existe para dizer quantas páginas o cliente ainda tem pela frente **nesta busca**; a contagem da coleção crua não responde a isso.
- **RN03**: `q` que não casa com nada é busca válida com resultado vazio, não erro — mesma regra do `offset` além do fim.
- **RN04**: A raiz é removida em vez de redirecionada. Redirecionar manteria vivo um endereço que a API não quer ter, e um 404 explícito informa a quebra melhor do que um 301 silencioso.

## Validações

- `q`: opcional; texto; mínimo 1 caractere; máximo 50.
- `q` vazio (`?q=`): resposta 400, porque filtro sem conteúdo é quase sempre erro de montagem da URL.
- As validações de `limit` e `offset` continuam como estão.

## Critérios de Aceitação

- [ ] Sistema devolve `[{ "char": "😀", "name": "sorriso" }, ...]` na listagem sem parâmetros.
- [ ] Sistema devolve só o item de nome `revirando` quando `q=revir` é informado.
- [ ] Sistema devolve o mesmo resultado para `q=REVIR` e `q=revir`.
- [ ] Sistema devolve lista vazia com status 200 quando `q=zzz` é informado.
- [ ] Sistema aplica `q` antes de `limit`: `q=or&limit=1` devolve só `sorriso`, e `X-Total-Count` traz `2` (o total filtrado), não `3`.
- [ ] Validação rejeita `q=` (vazio) com status 400 e mensagem que nomeia `q`.
- [ ] Sistema responde 404 em `GET /`.
- [ ] `GET /api/v1` continua respondendo 200 com a mensagem de hoje.
- [ ] Testes cobrem a nova forma do item, o filtro, a combinação com recorte, a entrada inválida e o 404 da raiz.
