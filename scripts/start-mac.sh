#!/usr/bin/env bash
# Build and start Prelegal in Docker at http://localhost:8000
set -eo pipefail
cd "$(dirname "$0")/.."

ENV_ARGS=()
if [ -f .env ]; then ENV_ARGS=(--env-file .env); fi

docker build -t prelegal .
docker rm -f prelegal >/dev/null 2>&1 || true
docker run -d --name prelegal -p 8000:8000 "${ENV_ARGS[@]}" prelegal
echo "Prelegal is running at http://localhost:8000"
