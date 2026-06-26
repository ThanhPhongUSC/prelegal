#!/usr/bin/env bash
# Build and run the Prelegal container, serving the app at http://localhost:8000
set -euo pipefail

cd "$(dirname "$0")/.."

docker build -t prelegal:latest .
docker rm -f prelegal >/dev/null 2>&1 || true

# Pass the OpenRouter key (and any other vars) into the container if present.
env_args=()
[ -f .env ] && env_args+=(--env-file .env)
docker run -d --name prelegal -p 8000:8000 "${env_args[@]}" prelegal:latest

echo "Prelegal is running at http://localhost:8000"
