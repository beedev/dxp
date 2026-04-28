#!/usr/bin/env bash
# start-ucp-demo.sh — one-command UCP × ChatGPT demo bring-up.
#
# Tenant-aware: pass TENANT=ace (default) or TENANT=meijer to bring up
# the corresponding portal + persona + product catalog. ACE Hardware
# (DIY/tools) and Meijer (grocery + party planning) are co-existing
# starters — same UCP backend, swappable surface.
#
# Usage:
#   make demo-ucp                # ACE Hardware on :4500 + :8003
#   make demo-ucp TENANT=meijer  # Meijer Retail on :4501 + :8005
#
# Both flavors share the BFF on :4201 and a single cloudflared tunnel
# for the BFF. Each tenant gets its own portal cloudflared tunnel and
# its own conv-assistant uvicorn. Re-running with the OTHER tenant
# stops the previous tenant's portal + conv-assistant cleanly.
#
# Idempotent: re-running stops anything still on those ports and
# starts fresh. Stop everything later with: make demo-ucp-stop
#
# Logs land in .demo-logs/ in the repo root — tail any of them to
# debug. The cloudflared free quick tunnels can drop after several
# hours; if ChatGPT starts saying "service not responding," re-run
# this script and re-import the spec into ChatGPT (URL will change).

set -euo pipefail

# ── Tenant config ───────────────────────────────────────────────────

TENANT="${TENANT:-ace}"

case "$TENANT" in
  ace)
    PORTAL_PORT=4500
    CONV_PORT=8003
    PORTAL_PKG="@dxp/ace-hardware-portal"
    PORTAL_LABEL="ACE Hardware portal"
    CONFIG_ID="ace-hardware-retail"
    SAMPLE_QUERY="cordless drill"
    SAMPLE_PROMPT="Find me a cordless drill"
    ;;
  meijer)
    PORTAL_PORT=4501
    CONV_PORT=8005   # :8004 reserved by Docker on the dev machine
    PORTAL_PKG="@dxp/meijer-retail-portal"
    PORTAL_LABEL="Meijer Retail portal"
    CONFIG_ID="meijer-retail"
    SAMPLE_QUERY="cordless drill"  # vector search, doesn't matter
    SAMPLE_PROMPT="Plan a birthday party for 10 kids with healthy snacks"
    ;;
  *)
    echo "❌ Unknown TENANT: '$TENANT'. Use TENANT=ace or TENANT=meijer." >&2
    exit 1
    ;;
esac

# ── Paths ───────────────────────────────────────────────────────────

REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO/.demo-logs"
mkdir -p "$LOG_DIR"
cd "$REPO"

# ── Pre-flight ──────────────────────────────────────────────────────

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ Missing dependency: '$1'"
    case "$1" in
      cloudflared) echo "   Install: brew install cloudflared" ;;
      pnpm)        echo "   Install: brew install pnpm" ;;
    esac
    exit 1
  }
}
require cloudflared
require pnpm
require lsof
require curl

[[ -f .env ]] || { echo "❌ .env not found in $REPO"; exit 1; }

VENV="$HOME/.appregistry/venvs/ai-full"
if [[ ! -f "$VENV/bin/activate" ]]; then
  echo "❌ Conv-assistant venv not found at $VENV"
  echo "   Set it up first per apps/conversational-assistant/CLAUDE.md"
  exit 1
fi

# ── Cleanup ─────────────────────────────────────────────────────────

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  [[ -n "$pids" ]] && kill $pids 2>/dev/null || true
}

kill_cloudflared_for() {
  local target_port=$1
  local pids
  pids=$(pgrep -f "cloudflared.*localhost:$target_port" 2>/dev/null || true)
  [[ -n "$pids" ]] && kill $pids 2>/dev/null || true
}

echo "🧹 [TENANT=$TENANT] Cleaning up :4201, :$PORTAL_PORT, :$CONV_PORT..."
kill_cloudflared_for 4201
kill_cloudflared_for "$PORTAL_PORT"
# Also clear the OTHER tenant's portal + conv-assistant so we don't double-bind
case "$TENANT" in
  ace)    kill_cloudflared_for 4501; kill_port 4501; kill_port 8005 ;;
  meijer) kill_cloudflared_for 4500; kill_port 4500; kill_port 8003 ;;
esac
kill_port 4201
kill_port "$PORTAL_PORT"
kill_port "$CONV_PORT"
sleep 2

# ── Cloudflared tunnels ─────────────────────────────────────────────

start_tunnel() {
  local local_port=$1
  local label=$2
  local log="$LOG_DIR/cloudflared-$local_port.log"
  : > "$log"

  echo "🌩  Tunneling $label (localhost:$local_port)..." >&2
  nohup cloudflared tunnel --url "http://localhost:$local_port" >>"$log" 2>&1 &
  disown 2>/dev/null || true

  local url=""
  for _ in $(seq 1 60); do
    url=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$log" 2>/dev/null | head -1 || true)
    [[ -n "$url" ]] && break
    sleep 0.5
  done
  if [[ -z "$url" ]]; then
    echo "❌ Tunnel for :$local_port didn't print a URL within 30s. Tail $log" >&2
    return 1
  fi
  printf '   → %s\n' "$url" >&2
  printf '%s' "$url"
}

BFF_URL=$(start_tunnel 4201 "BFF")
PORTAL_URL=$(start_tunnel "$PORTAL_PORT" "$PORTAL_LABEL")

# ── Patch .env ──────────────────────────────────────────────────────

NEW_PAY_TEMPLATE="UCP_PAYMENT_URL_TEMPLATE=$PORTAL_URL/customer/pay?session={session_id}"
NEW_PRODUCTS_BACKEND="PRODUCTS_BACKEND_URL=http://localhost:$CONV_PORT"

echo "📝 Updating .env"
echo "   UCP_PAYMENT_URL_TEMPLATE → $PORTAL_URL/customer/pay?session={session_id}"
echo "   PRODUCTS_BACKEND_URL     → http://localhost:$CONV_PORT"

upsert_env() {
  local key=$1 line=$2
  if grep -q "^$key=" .env; then
    sed -i.bak "s|^$key=.*|$line|" .env
    rm -f .env.bak
  else
    printf '\n# Auto-set by start-ucp-demo.sh\n%s\n' "$line" >> .env
  fi
}
upsert_env UCP_PAYMENT_URL_TEMPLATE "$NEW_PAY_TEMPLATE"
upsert_env PRODUCTS_BACKEND_URL "$NEW_PRODUCTS_BACKEND"

# ── Re-ingest catalog so the products table matches the active tenant ──

echo "🌱 Re-ingesting catalog for $CONFIG_ID (~30s, mostly embeddings)..."
(
  cd "$REPO/apps/conversational-assistant" && \
  source "$VENV/bin/activate" && \
  python -m src.db.ingest "$CONFIG_ID"
) >"$LOG_DIR/ingest.log" 2>&1 || {
  echo "   ⚠️  Ingest failed — see $LOG_DIR/ingest.log. Continuing anyway."
}

# ── Services ────────────────────────────────────────────────────────

echo "🚀 Starting BFF (NestJS) on :4201..."
nohup bash -c "cd '$REPO' && pnpm --filter @dxp/bff start:dev" \
  >"$LOG_DIR/bff.log" 2>&1 &
disown 2>/dev/null || true

echo "🚀 Starting conv-assistant ($CONFIG_ID) on :$CONV_PORT..."
nohup bash -c "
  cd '$REPO/apps/conversational-assistant' && \
  source '$VENV/bin/activate' && \
  AGENTIC_CONFIG_ID=$CONFIG_ID \
    uvicorn src.main:app --host 0.0.0.0 --port $CONV_PORT --reload
" >"$LOG_DIR/conv-assistant.log" 2>&1 &
disown 2>/dev/null || true

echo "🚀 Starting $PORTAL_LABEL on :$PORTAL_PORT..."
nohup bash -c "cd '$REPO' && pnpm --filter $PORTAL_PKG dev" \
  >"$LOG_DIR/$TENANT-portal.log" 2>&1 &
disown 2>/dev/null || true

# ── Wait for readiness ──────────────────────────────────────────────

wait_for() {
  local url=$1 name=$2 timeout=${3:-90}
  for _ in $(seq 1 "$timeout"); do
    if curl -sf -m 1 "$url" >/dev/null 2>&1; then
      printf '   ✅ %s\n' "$name"
      return 0
    fi
    sleep 1
  done
  printf '   ⚠️  %s not ready after %ss — see %s/\n' "$name" "$timeout" "$LOG_DIR"
  return 1
}

echo "⏳ Waiting for services..."
wait_for "http://localhost:4201/api/v1/ucp/openapi.json"  "BFF"            120 || true
wait_for "http://localhost:$CONV_PORT/health"              "conv-assistant" 90  || true
wait_for "http://localhost:$PORTAL_PORT/"                  "$PORTAL_LABEL"  90  || true

# ── Verify the loop ─────────────────────────────────────────────────

echo "🔎 Verifying end-to-end..."
SAMPLE=$(curl -s -m 10 "$BFF_URL/api/v1/products/search?q=$(echo "$SAMPLE_QUERY" | tr ' ' '+')&limit=1" 2>/dev/null \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); p=(d.get("products") or [{}])[0]; print(p.get("name","(none)"))' 2>/dev/null \
  || echo "(verify failed — see $LOG_DIR/bff.log)")
echo "   Catalog probe: $SAMPLE"

# ── Banner ──────────────────────────────────────────────────────────

cat <<BANNER

────────────────────────────────────────────────────────────────────
✅ UCP demo ready · TENANT=$TENANT

   BFF tunnel    : $BFF_URL
   Portal tunnel : $PORTAL_URL

   Local URLs:
     Portal           : http://localhost:$PORTAL_PORT/customer
     AI Assistant     : http://localhost:$PORTAL_PORT/customer/ai-assistant
     Conv-assistant   : http://localhost:$CONV_PORT/health
     BFF OpenAPI      : http://localhost:4201/api/v1/ucp/openapi.json

   ChatGPT setup:
     My GPTs → your GPT → Configure → Actions → Refresh from URL:

       $BFF_URL/api/v1/ucp/openapi.json

     Then in a fresh chat, ask: "$SAMPLE_PROMPT"

   Logs : $LOG_DIR/
   Stop : make demo-ucp-stop
   Swap : make demo-ucp TENANT=$([ "$TENANT" = ace ] && echo meijer || echo ace)
────────────────────────────────────────────────────────────────────
BANNER
