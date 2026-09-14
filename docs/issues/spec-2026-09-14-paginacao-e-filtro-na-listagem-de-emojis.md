# Paginação e filtro na listagem de emojis

**Data**: 14/09/2026  
**Status**: `Issue criada`  
**Issue**: [#1](https://github.com/odiegovaca/express-api-starter/issues/1)  
**Tipo**: `feature`

## O Que Será Feito

Hoje a rota que lista emojis devolve sempre a coleção inteira, de uma vez. Enquanto
a coleção tem três itens isso não incomoda, mas o template existe para ser o ponto
de partida de APIs reais — e a primeira coisa que quem usa o template precisa
escrever é justamente a paginação, do zero, sem um exemplo no próprio código.

Esta funcionalidade faz a listagem aceitar um recorte: quantos itens devolver e a
partir de qual posição. Quem não pedir recorte nenhum continua recebendo a coleção
inteira, exatamente como hoje — nada que já funciona muda de comportamento.

Junto do recorte, a resposta passa a informar quantos itens existem no total, para
que quem consome saiba se ainda há páginas adiante sem ter que adivinhar.

## Requisitos

1. O sistema aceita o parâmetro `limit` na listagem de emojis, indicando quantos itens devolver.
2. O sistema aceita o parâmetro `offset` na listagem de emojis, indicando quantos itens pular antes de começar.
3. O sistema devolve a coleção inteira quando nenhum dos dois parâmetros é informado.
4. O sistema informa o total de itens da coleção no cabeçalho `X-Total-Count` de toda resposta da listagem.
5. O sistema rejeita valor inválido em `limit` ou `offset` com erro de entrada, sem devolver lista parcial.
6. O sistema devolve lista vazia, e não erro, quando o `offset` passa do fim da coleção.

## Fora de Escopo

- Ordenação da coleção — a ordem continua sendo a de declaração.
- Paginação por cursor. Esta funcionalidade usa apenas `limit`/`offset`.
- Filtro por conteúdo do emoji. Buscar item específico fica para outra funcionalidade.
- Paginação em qualquer outra rota. Só a listagem de emojis muda.

## Regras de Negócio

- **RN01**: `limit` e `offset` são independentes — informar só um deles é válido. Sem `limit`, a listagem vai do `offset` até o fim; sem `offset`, começa do primeiro item. Exigir os dois juntos obrigaria quem só quer "os 2 primeiros" a informar um `offset=0` redundante.
- **RN02**: `X-Total-Count` conta a coleção inteira, nunca o recorte devolvido. É esse número que diz a quem consome se ainda há páginas — se contasse o recorte, a última página seria indistinguível de uma coleção que acabou.
- **RN03**: Recorte que começa além do fim da coleção é pergunta válida com resposta vazia, não erro. Quem pagina até o fim chega nesse ponto naturalmente, e um erro ali obrigaria a tratar o fim da lista como falha.

## Validações

- `limit`: opcional; número inteiro; mínimo 1; máximo 100.
- `offset`: opcional; número inteiro; mínimo 0.
- Valor não numérico, fracionário ou fora dos limites em qualquer um dos dois: resposta 400.
- A mensagem de erro nomeia o parâmetro recusado e o que se esperava dele.

## Critérios de Aceitação

- [ ] Sistema devolve os 3 emojis quando a listagem é chamada sem parâmetro algum.
- [ ] Sistema devolve os 2 primeiros emojis quando `limit=2` é informado.
- [ ] Sistema devolve o 2º e o 3º emojis quando `offset=1` é informado.
- [ ] Sistema devolve apenas o 2º emoji quando `limit=1` e `offset=1` são informados juntos.
- [ ] Sistema devolve lista vazia com status 200 quando `offset=99` é informado.
- [ ] Sistema devolve `X-Total-Count: 3` em todas as respostas acima, inclusive na vazia.
- [ ] Validação rejeita `limit=0` com status 400 e mensagem que nomeia `limit`.
- [ ] Validação rejeita `limit=abc` com status 400 e mensagem que nomeia `limit`.
- [ ] Validação rejeita `limit=101` com status 400 e mensagem que nomeia `limit`.
- [ ] Validação rejeita `offset=-1` com status 400 e mensagem que nomeia `offset`.
- [ ] Testes cobrem o recorte completo, o recorte vazio e cada entrada inválida acima.
