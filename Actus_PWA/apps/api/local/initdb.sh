#!/bin/bash
# Bootstrap automático do banco local (Postgres puro, Docker).
# Rodado pelo entrypoint do postgres SOMENTE quando o data dir está vazio (primeiro boot do volume).
# Aplica o shim de compatibilidade Supabase e, em seguida, todas as migrations em ordem.
set -e

echo "[initdb] aplicando shim de compatibilidade Supabase..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /local/00_shim.sql

echo "[initdb] aplicando migrations..."
for f in $(ls /local/migrations/*.sql | sort); do
  echo "[initdb]   -> $(basename "$f")"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "[initdb] aplicando seed de exercícios (catálogo PT-BR)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /local/seed-exercises.sql

echo "[initdb] aplicando seed de ecossistema de teste..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /local/seed-ecosystem.sql

echo "[initdb] schema Actus + seed aplicados com sucesso."
