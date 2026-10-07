#!/usr/bin/env bash
# Replica el typecheck que Hostinger corre en `npm run build` (next build → Running TypeScript).
# No hace el webpack completo: eso pide env/DB y tarda minutos; los dos errores del
# último deploy (next.config + Prisma JSON) los atrapa tsc.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Diagnóstico Hostinger: prisma generate + tsc --noEmit"

run_in_docker() {
  echo "Usando container debodas_next_app"
  docker exec -i debodas_next_app npm run typecheck
}

run_compose_ephemeral() {
  echo "Container app no está arriba; docker compose run --no-deps"
  docker compose -f "$ROOT/docker-compose.yml" run --rm --no-deps app npm run typecheck
}

if command -v docker >/dev/null 2>&1; then
  if docker inspect -f '{{.State.Running}}' debodas_next_app 2>/dev/null | grep -qx true; then
    run_in_docker
    echo "Diagnóstico OK. Hostinger no debería cortar el build por TypeScript."
    exit 0
  fi
fi

if [[ -x "$ROOT/node_modules/.bin/tsc" ]]; then
  echo "Usando TypeScript local"
  npm run typecheck
  echo "Diagnóstico OK. Hostinger no debería cortar el build por TypeScript."
  exit 0
fi

if command -v docker >/dev/null 2>&1 && [[ -f "$ROOT/docker-compose.yml" ]]; then
  run_compose_ephemeral
  echo "Diagnóstico OK. Hostinger no debería cortar el build por TypeScript."
  exit 0
fi

echo "No hay TypeScript local ni Docker." >&2
echo "Levantá el stack (docker compose up -d) o corré npm install en debodas-next." >&2
exit 1
