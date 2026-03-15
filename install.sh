#!/usr/bin/env bash
set -euo pipefail

# ─── colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

step()  { echo -e "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()    { echo -e "  ${GREEN}✓ $*${RESET}"; }
warn()  { echo -e "  ${YELLOW}⚠ $*${RESET}"; }
fail()  { echo -e "\n${RED}✗ $*${RESET}" >&2; exit 1; }

# ─── config ─────────────────────────────────────────────────────────────────
IMAGE=synthwave
CONTAINER=synthwave
PORT=3000
VOLUME=synthwave_data
BASE_URL="http://localhost:${PORT}"
WAIT_SECS=30

# ─── 1. prerequisites ────────────────────────────────────────────────────────
step "Checking prerequisites"

command -v docker &>/dev/null || fail "Docker is not installed or not in PATH"
docker info &>/dev/null       || fail "Docker daemon is not running"
ok "Docker is available"

command -v npm &>/dev/null || fail "npm is not in PATH (needed to run unit tests)"
ok "npm is available"

# ─── 2. unit tests ───────────────────────────────────────────────────────────
step "Running unit tests"
if npm test -- --passWithNoTests --forceExit 2>&1 | tee /tmp/synthwave-jest.log | \
   grep -E "(PASS|FAIL|Tests:|Test Suites:)" ; then
  ok "Unit tests passed"
else
  fail "Unit tests failed — see /tmp/synthwave-jest.log"
fi

# ─── 3. docker build ─────────────────────────────────────────────────────────
step "Building Docker image  ($IMAGE)"
docker build -t "$IMAGE" . || fail "Docker build failed"
ok "Image built"

# ─── 4. stop & remove old container ─────────────────────────────────────────
step "Stopping any existing container"
if docker ps -q --filter "name=^${CONTAINER}$" | grep -q .; then
  docker stop "$CONTAINER" >/dev/null
  ok "Stopped running container"
fi
if docker ps -aq --filter "name=^${CONTAINER}$" | grep -q .; then
  docker rm "$CONTAINER" >/dev/null
  ok "Removed old container"
fi

# ─── 5. create data volume (idempotent) ──────────────────────────────────────
step "Ensuring data volume  ($VOLUME)"
docker volume create "$VOLUME" >/dev/null
ok "Volume ready"

# ─── 6. start container ──────────────────────────────────────────────────────
step "Starting container"
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p "${PORT}:3000" \
  -v "${VOLUME}:/app/data" \
  "$IMAGE" >/dev/null
ok "Container started  (name=$CONTAINER, port=$PORT)"

# ─── 7. wait for app to be ready ─────────────────────────────────────────────
step "Waiting for app to respond  (up to ${WAIT_SECS}s)"
ELAPSED=0
until curl -sf "${BASE_URL}" -o /dev/null 2>/dev/null; do
  sleep 1
  ELAPSED=$(( ELAPSED + 1 ))
  if [ "$ELAPSED" -ge "$WAIT_SECS" ]; then
    docker logs "$CONTAINER" >&2
    fail "App did not respond within ${WAIT_SECS}s"
  fi
  printf "."
done
echo ""
ok "App is responding"

# ─── 8. smoke tests ──────────────────────────────────────────────────────────
step "Running smoke tests"
FAILURES=0

smoke_get() {
  local label="$1" url="$2" expect_status="${3:-200}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "$expect_status" ]; then
    ok "GET $url → $status"
  else
    warn "GET $url → $status (expected $expect_status)"
    FAILURES=$(( FAILURES + 1 ))
  fi
}

smoke_json() {
  local label="$1" url="$2" key="$3"
  local body
  body=$(curl -s "$url")
  if echo "$body" | grep -q "\"${key}\""; then
    ok "GET $url contains key \"$key\""
  else
    warn "GET $url missing key \"$key\" — body: $body"
    FAILURES=$(( FAILURES + 1 ))
  fi
}

smoke_post_status() {
  local label="$1" url="$2" data="$3" expect_status="$4"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST -H "Content-Type: application/json" -d "$data" "$url")
  if [ "$status" = "$expect_status" ]; then
    ok "POST $url → $status"
  else
    warn "POST $url → $status (expected $expect_status)"
    FAILURES=$(( FAILURES + 1 ))
  fi
}

# homepage
smoke_get  "homepage"              "${BASE_URL}/"                        200

# admin page
smoke_get  "admin page"            "${BASE_URL}/admin"                   200

# admin settings API — GET returns hasApiKey + modelOptions
smoke_json "admin settings GET"    "${BASE_URL}/api/admin/settings"      "hasApiKey"
smoke_json "admin settings models" "${BASE_URL}/api/admin/settings"      "modelOptions"

# admin settings API — POST with no real key change (placeholder) → 200
smoke_post_status "admin settings POST (placeholder key)" \
  "${BASE_URL}/api/admin/settings" \
  '{"apiKey":"••••fake","model":"openai/gpt-4o-mini","referer":"http://localhost:3000","title":"SynthWave"}' \
  200

# song-ideas without a configured key → expect 502 (or 500) with helpful message
AI_STATUS=$(curl -s -o /tmp/sw-ai-body.txt -w "%{http_code}" \
  -X POST -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' "${BASE_URL}/api/ai/song-ideas")
if echo "$AI_STATUS" | grep -qE "^(502|500)$"; then
  ok "POST /api/ai/song-ideas (no key) → $AI_STATUS  (expected 5xx)"
  if grep -qi "admin\|api key\|openrouter" /tmp/sw-ai-body.txt 2>/dev/null; then
    ok "Error body contains helpful message"
  else
    warn "Error body may not mention /admin — check /tmp/sw-ai-body.txt"
  fi
else
  warn "POST /api/ai/song-ideas → $AI_STATUS (expected 5xx without key)"
  FAILURES=$(( FAILURES + 1 ))
fi

# ─── 9. result ───────────────────────────────────────────────────────────────
echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo -e "${BOLD}${GREEN}All smoke tests passed.${RESET}"
else
  echo -e "${YELLOW}${FAILURES} smoke test(s) had warnings — see above.${RESET}"
fi

echo -e "\n${BOLD}SynthWave is running:${RESET}"
echo -e "  DAW   → ${CYAN}${BASE_URL}/${RESET}"
echo -e "  Admin → ${CYAN}${BASE_URL}/admin${RESET}"
echo ""
echo -e "  Logs  :  docker logs -f ${CONTAINER}"
echo -e "  Stop  :  docker stop ${CONTAINER}"
echo -e "  Data  :  docker volume inspect ${VOLUME}"
