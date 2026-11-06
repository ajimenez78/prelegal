#!/usr/bin/env bash
# Stop and remove the Prelegal container (the database is discarded with it)
set -euo pipefail
docker rm -f prelegal
echo "Prelegal stopped"
