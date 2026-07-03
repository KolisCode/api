#!/usr/bin/env bash
# Deploy de KolisKit API al droplet (https://api.koliscode.com).
# Sincroniza el código por rsync, compila en el servidor y recarga PM2.
# El repo es privado y el droplet no tiene credenciales de GitHub, por eso
# se despliega por rsync desde local (no por git pull).
set -euo pipefail

REMOTE_HOST="droplet"
REMOTE_PATH="/var/www/koliskit-api"
PM2_NAME="koliskit-api"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "[1/3] rsync del código → $REMOTE_HOST:$REMOTE_PATH ..."
rsync -az --delete \
  --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  --exclude '.env' --exclude 'src/generated' --exclude 'coverage' \
  --exclude '*.log' --exclude '.DS_Store' --exclude '.playwright-mcp' \
  "$SCRIPT_DIR/" "$REMOTE_HOST:$REMOTE_PATH/"

log "[2/3] install + prisma + build en el droplet ..."
ssh "$REMOTE_HOST" "
  set -e
  cd $REMOTE_PATH
  npm install --no-audit --no-fund
  npx prisma generate
  npx prisma migrate deploy
  npm run build
"

log "[3/3] recargar PM2 ..."
ssh "$REMOTE_HOST" "pm2 reload $PM2_NAME --update-env && pm2 save"

log "Deploy OK → https://api.koliscode.com"
