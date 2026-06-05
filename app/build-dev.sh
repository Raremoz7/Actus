#!/usr/bin/env bash
# Build de desenvolvimento Android via EAS (APK para testar no aparelho)
cd "$(dirname "$0")"
npx eas-cli build --platform android --profile development
