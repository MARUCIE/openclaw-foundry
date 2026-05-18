#!/usr/bin/env bash
#
# install-hooks.sh — idempotent installer for the openclaw-foundry git hooks.
# Symlinks .git/hooks/pre-commit to scripts/pre-commit-hook.sh so the audit
# runs before every commit (versioned in the repo, survives machine moves).
#
# Run once per fresh clone:  bash scripts/install-hooks.sh
#
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_SRC="$REPO_ROOT/scripts/pre-commit-hook.sh"
HOOK_DST="$REPO_ROOT/.git/hooks/pre-commit"

[ -d "$REPO_ROOT/.git/hooks" ] || { echo "ERROR: .git/hooks not found — not in a git repo?"; exit 1; }
[ -x "$HOOK_SRC" ] || chmod +x "$HOOK_SRC"

if [ -L "$HOOK_DST" ] && [ "$(readlink "$HOOK_DST")" = "$HOOK_SRC" ]; then
  echo "OK   already installed: $HOOK_DST → $HOOK_SRC"
  exit 0
fi

if [ -e "$HOOK_DST" ] && [ ! -L "$HOOK_DST" ]; then
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  mv "$HOOK_DST" "$HOOK_DST.backup.$ts"
  echo "NOTE moved existing pre-commit to pre-commit.backup.$ts"
fi

ln -sf "$HOOK_SRC" "$HOOK_DST"
echo "OK   installed: $HOOK_DST → $HOOK_SRC"
echo
echo "Test the hook with:  bash scripts/audit-auth-surfaces.sh"
echo "Bypass (use sparingly):  git commit --no-verify"
