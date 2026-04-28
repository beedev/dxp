#!/usr/bin/env bash
# start-ucp-demo.sh — one-command UCP × ChatGPT demo bring-up.
#
# Starts cloudflared tunnels for the BFF (4201) and the ACE Hardware
# portal (4500), patches UCP_PAYMENT_URL_TEMPLATE in .env so the BFF
# embeds the public portal URL in `payment_url`, then starts the BFF,
# the conv-assistant on :8003 (ACE persona), and the portal vite. At
# the end it prints the BFF tunnel URL — paste it into ChatGPT's
# Custom GPT as the OpenAPI source.
#
# Idempotent: re-running stops anything still on those ports and
# starts fresh. Stop everything later with:
#
#   lsof -ti :4201 :4500 :8003 | xargs kill
#   pkill -f cloudflared
#
# Logs land in .demo-logs/ in the repo root — tail any of them to
# debug. The cloudflared free quick tunnels can drop after several
# hours; if ChatGPT starts saying "service not responding," re-run
# this script and re-import the spec into ChatGPT (URL will change).

set -euo pipefail

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

echo "🧹 Cleaning up existing services on :4201, :4500, :8003..."
kill_cloudflared_for 4201
kill_cloudflared_for 4500
kill_port 4201
kill_port 4500
kill_port 8003
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
PORTAL_URL=$(start_tunnel 4500 "ACE portal")

# ── Patch .env ──────────────────────────────────────────────────────

NEW_TEMPLATE="UCP_PAYMENT_URL_TEMPLATE=$PORTAL_URL/customer/pay?session={session_id}"
echo "📝 Updating UCP_PAYMENT_URL_TEMPLATE → $PORTAL_URL/customer/pay?session={session_id}"
if grep -q '^UCP_PAYMENT_URL_TEMPLATE=' .env; then
  # `sed -i ''` form is portable across BSD (macOS) and GNU sed when given
  # an explicit empty backup arg.
  sed -i.bak "s|^UCP_PAYMENT_URL_TEMPLATE=.*|$NEW_TEMPLATE|" .env
  rm -f .env.bak
else
  printf '\n# Auto-set by start-ucp-demo.sh\n%s\n' "$NEW_TEMPLATE" >> .env
fi

# ── Services ────────────────────────────────────────────────────────

echo "🚀 Starting BFF (NestJS) on :4201..."
nohup bash -c "cd '$REPO' && pnpm --filter @dxp/bff start:dev" \
  >"$LOG_DIR/bff.log" 2>&1 &
disown 2>/dev/null || true

echo "🚀 Starting conv-assistant (ACE persona) on :8003..."
nohup bash -c "
  cd '$REPO/apps/conversational-assistant' && \
  source '$VENV/bin/activate' && \
  AGENTIC_CONFIG_ID=ace-hardware-retail \
    uvicorn src.main:app --host 0.0.0.0 --port 8003 --reload
" >"$LOG_DIR/conv-assistant.log" 2>&1 &
disown 2>/dev/null || true

echo "🚀 Starting ACE Hardware portal on :4500..."
nohup bash -c "cd '$REPO' && pnpm --filter @dxp/ace-hardware-portal dev" \
  >"$LOG_DIR/ace-portal.log" 2>&1 &
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
wait_for "http://localhost:8003/health"                    "conv-assistant" 90  || true
wait_for "http://localhost:4500/"                          "ACE portal"     90  || true

# ── Verify the loop ─────────────────────────────────────────────────

echo "🔎 Verifying end-to-end..."
SAMPLE=$(curl -s -m 10 "$BFF_URL/api/v1/products/search?q=cordless+drill&limit=1" 2>/dev/null \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); p=(d.get("products") or [{}])[0]; print(p.get("name","(none)"))' 2>/dev/null \
  || echo "(verify failed — see $LOG_DIR/bff.log)")
echo "   Catalog probe: $SAMPLE"

# ── Banner ──────────────────────────────────────────────────────────

cat <<BANNER

────────────────────────────────────────────────────────────────────
✅ UCP demo ready

   BFF tunnel    : $BFF_URL
   Portal tunnel : $PORTAL_URL

   ChatGPT setup:
     My GPTs → your GPT → Configure → Actions → Refresh from URL:

       $BFF_URL/api/v1/ucp/openapi.json

     Then start a fresh chat: "Find me a cordless drill"

   Logs : $LOG_DIR/
   Stop : make demo-ucp-stop
────────────────────────────────────────────────────────────────────
BANNER
