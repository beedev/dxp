#!/usr/bin/env bash
# dev.sh — Start the full DXP dev stack
#
# Services started:
#   :8080  Keycloak IDP       (Docker)
#   :8090  HAPI FHIR          (Docker)
#   :4201  BFF                (NestJS watch)
#   :4300  Payer Portal       (Vite)
#   :4400  API Playground     (Vite)
#   :4500  Storybook          (UI components)
#
# Usage:
#   ./dev.sh           — start everything
#   ./dev.sh --no-infra  — skip Docker (infra already running)
#   ./dev.sh --no-storybook — skip Storybook

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NO_INFRA=false
NO_STORYBOOK=false

for arg in "$@"; do
  case $arg in
    --no-infra)    NO_INFRA=true ;;
    --no-storybook) NO_STORYBOOK=true ;;
  esac
done

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[dev]${RESET} $*"; }
ok()   { echo -e "${GREEN}[dev]${RESET} $*"; }
warn() { echo -e "${YELLOW}[dev]${RESET} $*"; }
die()  { echo -e "${RED}[dev] ERROR:${RESET} $*"; exit 1; }

# ── Cleanup on exit ──────────────────────────────────────────────────────────
PIDS=()

cleanup() {
  echo ""
  log "Shutting down dev processes..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  ok "All processes stopped."
}
trap cleanup INT TERM EXIT

# ── 1. Docker infra (Keycloak + HAPI FHIR) ──────────────────────────────────
if [ "$NO_INFRA" = false ]; then
  log "Starting Docker infrastructure (Keycloak + HAPI FHIR)..."
  createdb hapi_fhir 2>/dev/null || true
  docker compose -f "$REPO_ROOT/docker-compose.yml" up -d 2>/dev/null || \
  docker compose up -d 2>/dev/null || \
  warn "Docker compose failed — is Docker running? Continuing without infra."
fi

# ── 2. BFF ───────────────────────────────────────────────────────────────────
log "Starting BFF on :4201..."
(
  cd "$REPO_ROOT/apps/bff"
  export DEV_AUTH_BYPASS=true
  export DEV_MEMBER_ID="${DEV_MEMBER_ID:-7de24de3-a6ee-464e-88ad-004799281205}"
  # Load .env if present
  [ -f "$REPO_ROOT/.env" ] && export $(grep -v '^#' "$REPO_ROOT/.env" | xargs) 2>/dev/null || true
  pnpm start:dev 2>&1 | sed 's/^/  \x1b[2m[bff]\x1b[0m /'
) &
PIDS+=($!)

# ── 3. Payer Portal ──────────────────────────────────────────────────────────
log "Starting Payer Portal on :4300..."
(
  cd "$REPO_ROOT/starters/payer-portal"
  pnpm dev 2>&1 | sed 's/^/  \x1b[36m[portal]\x1b[0m /'
) &
PIDS+=($!)

# ── 4. API Playground ────────────────────────────────────────────────────────
log "Starting API Playground on :4400..."
(
  cd "$REPO_ROOT/apps/playground"
  pnpm dev 2>&1 | sed 's/^/  \x1b[35m[playground]\x1b[0m /'
) &
PIDS+=($!)

# ── 5. Storybook ─────────────────────────────────────────────────────────────
if [ "$NO_STORYBOOK" = false ]; then
  log "Starting Storybook on :4500..."
  (
    cd "$REPO_ROOT/packages/ui"
    pnpm storybook 2>&1 | sed 's/^/  \x1b[33m[storybook]\x1b[0m /'
  ) &
  PIDS+=($!)
fi

# ── 6. Wait for BFF to be ready, then print URLs ─────────────────────────────
log "Waiting for BFF to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:4201/api/v1/health > /dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  DXP Dev Stack${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${GREEN}Payer Portal${RESET}    http://localhost:4300"
echo -e "  ${GREEN}API Playground${RESET}  http://localhost:4400"
echo -e "  ${GREEN}Storybook${RESET}       http://localhost:4500"
echo -e "  ${GREEN}BFF API Docs${RESET}    http://localhost:4201/api/docs"
echo -e "  ${GREEN}Keycloak IDP${RESET}    http://localhost:8080  (admin/admin)"
echo -e "  ${GREEN}HAPI FHIR${RESET}       http://localhost:8090/fhir"
echo ""
echo -e "  ${CYAN}make status${RESET}  — health check all services"
echo -e "  ${CYAN}make fhir-seed${RESET} — reseed FHIR data"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop everything."
echo ""

# ── Keep alive ───────────────────────────────────────────────────────────────
wait
