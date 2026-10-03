#!/usr/bin/env bash
# Arma un tar.gz fechado del código de debodas-next para subirlo a Hostinger.
# Hostinger instala dependencias y corre `npm run build` en el servidor.
# No incluye node_modules, .next, .git ni archivos .env con secretos.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${1:-$(dirname "$ROOT")/debodas-next-${STAMP}.tar.gz}"

if [[ "$OUT" != /* ]]; then
  OUT="$(pwd)/$OUT"
fi

mkdir -p "$(dirname "$OUT")"

tar -czf "$OUT" \
  --exclude-vcs \
  -C "$ROOT" \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.next-e2e \
  --exclude=out \
  --exclude=build \
  --exclude=coverage \
  --exclude=.git \
  --exclude=.vercel \
  --exclude=.cursor \
  --exclude=backups \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=blob-report \
  --exclude=playwright/.cache \
  --exclude=playwright/.auth \
  --exclude=tsconfig.tsbuildinfo \
  --exclude=next-env.d.ts \
  --exclude=.DS_Store \
  --exclude=.env \
  --exclude=.env.local \
  --exclude=.env.development \
  --exclude=.env.production \
  --exclude=.env.test \
  --exclude='.env*.local' \
  --exclude=public/uploads \
  --exclude=docker/phpmyadmin/uploads \
  --exclude='*.tar.gz' \
  --exclude='*.zip' \
  .

BYTES="$(wc -c < "$OUT" | tr -d ' ')"
MB="$(awk -v b="$BYTES" 'BEGIN { printf "%.1f", b/1024/1024 }')"

echo "Listo: $OUT ($MB MB)"
echo "El paquete trae el código en la raíz (package.json arriba)."
echo "Las variables de entorno se cargan en hPanel, no van en el archivo."

if [[ "$BYTES" -gt 52428800 ]]; then
  echo "Aviso: supera 50 MB. El deploy por archivo de la API de Hostinger tiene ese tope."
  echo "El tar.gz igual quedó armado. Si hPanel lo rechaza, hay que achicar public/assets/img/themes."
fi
