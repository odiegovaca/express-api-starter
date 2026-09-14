#!/usr/bin/env bash
# validate.sh <ação> [ação...]
#
# Roda os comandos de teste/lint/build do stack, na ordem pedida, parando na
# primeira falha. Corpo de cada função preenchido por /setup.
#
# Falha três vezes seguidas no mesmo erro é sinal de parar e reportar, não de
# tentar de novo — vale para todo comando que chama este script.
set -euo pipefail

# Contrato com o coverage.sh: precisa GERAR o relatório de COVERAGE_REPORT — sem isso
# nada falha, a cobertura só congela (se ela sai de outra fase, é essa fase que vai aqui).
run_test() {
  pnpm test
}

run_lint() {
  pnpm lint
}

run_build() {
  # JavaScript ESM roda direto no Node: nao ha etapa de transpilacao.
  echo "Sem etapa de build neste projeto."
}

if [ "$#" -eq 0 ]; then
  echo "Uso: validate.sh <test|lint|build> [test|lint|build...]" >&2
  exit 1
fi

for ACTION in "$@"; do
  case "$ACTION" in
    test)  run_test ;;
    lint)  run_lint ;;
    build) run_build ;;
    *) echo "Ação inválida: $ACTION (use test, lint ou build)" >&2; exit 1 ;;
  esac
done
