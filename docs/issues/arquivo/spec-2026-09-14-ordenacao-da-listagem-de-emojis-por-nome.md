# Ordenação da listagem de emojis por nome

**Data**: 14/09/2026  
**Status**: `Issue criada`  
**Issue**: [#8](https://github.com/odiegovaca/express-api-starter/issues/8)  
**Tipo**: `feature`

## O Que Será Feito

Hoje a listagem de emojis devolve os itens sempre na ordem em que foram escritos no catálogo. Quem consome a API não tem como pedir outra ordem, e a ordem atual não significa nada para quem lê — é só a ordem de digitação.

Esta funcionalidade acrescenta um parâmetro que permite pedir a listagem ordenada pelo nome do emoji, em ordem crescente ou decrescente. A ordenação acontece depois do filtro por nome e antes do recorte de página, para que a primeira página seja de fato a primeira em ordem alfabética, e não a primeira em ordem de digitação que por acaso passou pelo filtro.

Sem o parâmetro, nada muda: a listagem continua saindo na ordem do catálogo. Isso mantém compatível quem já consome a rota hoje.

## Requisitos

1. O sistema aceita o parâmetro `sort` em `GET /api/v1/emojis`, com os valores `nome` e `-nome`.
2. O sistema ordena o resultado pelo campo `name` em ordem crescente quando `sort` é `nome`.
3. O sistema ordena o resultado pelo campo `name` em ordem decrescente quando `sort` é `-nome`.
4. O sistema devolve a ordem original do catálogo quando `sort` não é informado.
5. O sistema aplica a ordenação depois do filtro de `q` e antes do recorte de `limit` e `offset`.
6. O sistema recusa qualquer outro valor de `sort` com o código 400 e uma mensagem que nomeia o parâmetro.

## Fora de Escopo

- Ordenar por qualquer campo que não seja `name` (por exemplo, pelo próprio caractere).
- Ordenar por mais de um campo ao mesmo tempo.
- Tornar alguma ordem o padrão — sem o parâmetro, a ordem segue sendo a do catálogo.

## Regras de Negócio

- **RN03**: A ordenação é aplicada depois do filtro de `q` e antes do recorte de `limit`/`offset` — ordenar depois do recorte ordenaria só a página, e a segunda página traria nomes menores que a primeira.
- **RN04**: A comparação de nomes ignora maiúsculas e acentos, na ordem do português. "ácido" vem antes de "banana", e não depois de "zebra" — comparar pelo código do caractere jogaria todo nome acentuado para o fim da lista.
- **RN05**: A ordenação não altera o valor do cabeçalho `X-Total-Count`, que continua sendo o total depois do filtro — mudar a ordem não muda quantos itens existem.

## Validações

- Campo `sort`: opcional; quando informado, aceita exatamente `nome` ou `-nome`, sem espaços em volta. Qualquer outro valor é recusado.

## Critérios de Aceitação

- [ ] Sistema devolve os emojis em ordem alfabética crescente de `name` quando a requisição traz `sort=nome`.
- [ ] Sistema devolve os emojis em ordem alfabética decrescente de `name` quando a requisição traz `sort=-nome`.
- [ ] Sistema devolve a ordem original do catálogo quando a requisição não traz `sort`.
- [ ] Sistema ordena antes de recortar: com `sort=nome&limit=1`, a resposta traz o primeiro nome em ordem alfabética de todo o resultado filtrado, não o primeiro do catálogo.
- [ ] Sistema combina filtro e ordenação: com `q` e `sort=nome`, só os itens que passam no filtro aparecem, e em ordem alfabética.
- [ ] Validação rejeita `sort=char` com o código 400 e a mensagem "sort: informe nome ou -nome".
- [ ] Cabeçalho `X-Total-Count` continua trazendo o total pós-filtro quando `sort` é informado.
- [ ] Testes cobrem a ordem crescente, a ordem decrescente, a ausência do parâmetro, a combinação com `limit` e a recusa de valor inválido.
