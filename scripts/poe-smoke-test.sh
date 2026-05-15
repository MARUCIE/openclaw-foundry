#!/bin/bash
# POE Gemini 3.1 Pro smoke test — single call to validate API + model + response shape.
# Routes through Tailscale dmit-us-proxy node because local DNS hijacks api.poe.com.
# Used by /goal task T2 verify command.
set -euo pipefail

if [ -z "${POE_API_KEY:-}" ]; then
  echo '{"error": "POE_API_KEY not set in env"}' >&2
  exit 1
fi

POE_BASE_URL="${POE_BASE_URL:-https://api.poe.com/v1}"
MODEL="${POE_MODEL:-Gemini-3.1-Pro}"
SSH_PROXY_NODE="${SSH_PROXY_NODE:-root@100.65.4.17}"

# Build payload locally then base64 it to avoid SSH double-escape mangling
PAYLOAD_JSON=$(python3 -c "
import json
print(json.dumps({
  'model': '${MODEL}',
  'messages': [{'role': 'user', 'content': 'Output exactly the JSON: {\"status\":\"ok\"}'}],
  'max_tokens': 256,
  'temperature': 0
}))
")

PAYLOAD_B64=$(printf '%s' "$PAYLOAD_JSON" | base64 | tr -d '\n')

ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new -o RemoteCommand=none -o RequestTTY=no \
  "${SSH_PROXY_NODE}" \
  bash -s <<EOF
PAYLOAD=\$(echo "$PAYLOAD_B64" | base64 -d)
curl -sS -X POST "${POE_BASE_URL}/chat/completions" \\
  -H "Authorization: Bearer ${POE_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d "\$PAYLOAD"
EOF
