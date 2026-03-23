#!/bin/bash
# ClawHub Skills Daily Sync
# Run via LaunchAgent or crontab: 0 6 * * * /path/to/clawhub-sync-cron.sh
#
# What it does:
# 1. Headless Playwright scrapes top 300 skills from clawhub.ai
# 2. Filter + rate + categorize → data/clawhub-skills.json
# 3. SIGHUP server to hot-reload skill cache
# 4. Log to data/sync.log

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/data/sync.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] ClawHub sync starting..." >> "$LOG_FILE"

# Run scrape + process
cd "$PROJECT_DIR"
node scripts/scrape-clawhub.mjs --target 300 >> "$LOG_FILE" 2>&1

# Hot-reload server cache (if running)
SERVER_PID=$(lsof -ti:18800 2>/dev/null || true)
if [ -n "$SERVER_PID" ]; then
  kill -HUP "$SERVER_PID" 2>/dev/null || true
  echo "[$TIMESTAMP] Sent SIGHUP to server (PID $SERVER_PID)" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] ClawHub sync complete" >> "$LOG_FILE"
