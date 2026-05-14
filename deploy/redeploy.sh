#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Pulling latest code"
git pull

echo "==> Rebuilding and restarting containers"
docker compose up -d --build

echo "==> Container status"
docker compose ps

echo "==> Backend logs"
docker compose logs backend --tail=100
