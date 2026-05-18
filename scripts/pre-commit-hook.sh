#!/usr/bin/env bash
#
# pre-commit-hook.sh — invoked by git as .git/hooks/pre-commit (symlink).
# Stops the commit when audit-auth-surfaces.sh finds an un-gated
# install/copy/download surface. See AUTH_SURFACE_INVARIANT.md for the
# design contract this hook enforces.
#
# Bypass (use only when justified, then log the reason in commit message):
#   git commit --no-verify
#
set -e
REPO_ROOT="$(git rev-parse --show-toplevel)"
exec bash "$REPO_ROOT/scripts/audit-auth-surfaces.sh"
