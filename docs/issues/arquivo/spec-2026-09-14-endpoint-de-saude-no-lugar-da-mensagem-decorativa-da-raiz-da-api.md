# Endpoint de saúde no lugar da mensagem decorativa da raiz da API

**Data**: 14/09/2026  
**Status**: `Issue criada`  
**Issue**: [#10](https://github.com/odiegovaca/express-api-starter/issues/10)  
**Tipo**: `improvement`

## O Que Será Feito

Hoje `GET /api/v1` responde com uma mensagem decorativa (`API - 👋🌎🌍🌏`). Ela não diz nada útil: um balanceador ou um monitor que aponte para essa rota recebe 200 com um texto que não distingue "a API está de pé" de "a API está de pé e funcionando". Quem opera o serviço precisa de uma resposta com conteúdo verificável.

Esta mudança troca essa rota por um endpoint de saúde em `GET /api/v1/health`, que responde com o estado do serviço e a versão em execução. A rota decorativa deixa de existir e passa a responder 404.

É uma quebra de contrato deliberada: quem hoje chama `GET /api/v1` esperando 200 precisa passar a chamar `GET /api/v1/health`.

## Requisitos

1. O sistema expõe `GET /api/v1/health`, que responde 200 com um corpo JSON.
2. O corpo traz o campo `status`, com o valor fixo `ok`.
3. O corpo traz o campo `version`, com a versão declarada no `package.json` do projeto.
4. O sistema deixa de responder a `GET /api/v1`: a rota passa a cair no tratamento de rota não encontrada, com 404.

## Fora de Escopo

- Checar dependências externas (não há nenhuma) ou reportar estado degradado. O `status` é fixo enquanto o processo responder.
- Endpoint de readiness separado do de liveness.
- Manter `GET /api/v1` como alias ou redirecionamento — a rota some.

## Regras de Negócio

- **RN06**: A versão reportada é lida do `package.json` em tempo de carga do módulo, não fixada no código — fixar faria a resposta mentir a cada release.
- **RN07**: O endpoint de saúde não exige autenticação nem parâmetro, e não expõe nada além de `status` e `version` — caminho de arquivo, variável de ambiente e versão de dependência ficam de fora.

## Validações

- O endpoint não recebe parâmetros. Query string enviada é ignorada, e não gera 400.

## Critérios de Aceitação

- [ ] Sistema responde 200 em `GET /api/v1/health` com `Content-Type` JSON.
- [ ] Resposta traz `status` igual a `ok`.
- [ ] Resposta traz `version` igual à versão do `package.json`.
- [ ] Sistema responde 404 em `GET /api/v1`.
- [ ] Resposta de `GET /api/v1/health` não contém caminho de arquivo nem nome de dependência.
- [ ] Testes cobrem a resposta de saúde, o 404 da rota removida e a ausência de dado sensível.
