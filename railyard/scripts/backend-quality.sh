#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

DIST_DIR="$ROOT_DIR/frontend/dist"
PLACEHOLDER_FILE="$DIST_DIR/.embed-placeholder"
mkdir -p "$DIST_DIR"
if [ ! -f "$PLACEHOLDER_FILE" ]; then
  echo "placeholder" > "$PLACEHOLDER_FILE"
fi

echo "[backend] checking Go formatting..."
# Check the module by directory (absolute path); a `git ls-files` list resolves relative to
# the current directory and breaks in linked git worktrees (see pre-push-check.sh).
UNFORMATTED="$(gofmt -l "$ROOT_DIR")"
if [ -n "$UNFORMATTED" ]; then
  echo "[backend] gofmt required for:"
  echo "$UNFORMATTED"
  exit 1
fi

echo "[backend] running Go tests..."
go test ./...

echo "[backend] running Go coverage gate..."
"$ROOT_DIR/scripts/check-go-coverage.sh"

echo "[backend] all checks passed"
