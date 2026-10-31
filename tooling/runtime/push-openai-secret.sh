#!/usr/bin/env bash
# Uploads OPENAI_API_KEY from the repo-root .env to the deployed Worker as a secret. The key is piped, never printed or logged.
# Usage: CLOUDFLARE_ACCOUNT_ID=<id> tooling/runtime/push-openai-secret.sh [path/to/.env]
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="${1:-$root/.env}"
[ -f "$env_file" ] || { echo "No .env at $env_file" >&2; exit 1; }
key="$(grep -E '^OPENAI_API_KEY=' "$env_file" | head -n1 | cut -d= -f2- | tr -d '[:space:]"' || true)"
[ -n "$key" ] || { echo "OPENAI_API_KEY is empty in $env_file. Fill it in first." >&2; exit 1; }
printf '%s' "$key" | node "$root/apps/api/node_modules/wrangler/bin/wrangler.js" secret put OPENAI_API_KEY --config "$root/apps/api/wrangler.jsonc" --env-file /dev/null
echo "OPENAI_API_KEY uploaded. Image review stays advisory and only runs when OPENAI_IMAGE_REVIEW_ENABLED is true and the model is set."
