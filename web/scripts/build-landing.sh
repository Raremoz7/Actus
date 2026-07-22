#!/usr/bin/env bash
# Build isolado da landing page para GitHub Pages.
# Uso:   bash scripts/build-landing.sh
#        ACTUS_BASE=/ bash scripts/build-landing.sh   (domínio próprio)
set -euo pipefail

BASE="${ACTUS_BASE:-/Actus-site/}"
cd "$(dirname "$0")/.."

ACTUS_BASE="$BASE" npx vite build --config vite.landing.config.ts

cd dist-landing
PFX="${BASE%/}"  # remove a barra final: /Actus-site (ou vazio se base for /)

# Vite prefixa o HTML, mas não os literais de asset dentro do JS — prefixamos aqui.
if [ -n "$PFX" ]; then
  sed -i "s#/landing/#${PFX}/landing/#g; s#/actus-logo.svg#${PFX}/actus-logo.svg#g" assets/*.js
fi

# entry + fallback de SPA + desliga Jekyll
mv -f landing.html index.html
cp -f index.html 404.html
touch .nojekyll

# remove assets que não são da landing
rm -rf exercises wger og.jpg

echo "OK -> dist-landing (base ${BASE})"
du -sh . | sed 's/\t.*/  total/'
