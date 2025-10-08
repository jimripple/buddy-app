#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is not installed. Install it from https://supabase.com/docs/guides/cli." >&2
  exit 1
fi

CONFIG_PATH="${SUPABASE_CONFIG:-supabase/config.toml}"
if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "Missing Supabase config at ${CONFIG_PATH}." >&2
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
DB_URL="${SUPABASE_DB_URL:-}"

if [[ -n "${DB_URL}" ]]; then
  echo "Applying migrations to database URL defined in SUPABASE_DB_URL..."
  supabase db push --config "${CONFIG_PATH}" --db-url "${DB_URL}"
elif [[ -n "${PROJECT_REF}" ]]; then
  echo "Applying migrations to remote project ${PROJECT_REF}..."
  supabase migration up --config "${CONFIG_PATH}" --project-ref "${PROJECT_REF}"
else
  echo "No SUPABASE_DB_URL or SUPABASE_PROJECT_REF provided. Running migrations against the local dev database..."
  supabase migration up --config "${CONFIG_PATH}"
fi
