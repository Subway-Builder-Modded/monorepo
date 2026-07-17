#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[pre-push] applying Go formatting..."
# Format the module by directory (absolute path) rather than a `git ls-files` file list.
# ls-files paths resolve relative to the current directory, which breaks in linked git
# worktrees; the absolute module directory is cwd-independent.
gofmt -w "$ROOT_DIR"

REMAINING_UNFORMATTED="$(gofmt -l "$ROOT_DIR")"
if [ -n "$REMAINING_UNFORMATTED" ]; then
  echo "[pre-push] gofmt still required for:"
  echo "$REMAINING_UNFORMATTED"
  exit 1
fi

echo "[pre-push] running backend quality checks..."
"$ROOT_DIR/scripts/backend-quality.sh"

echo "[pre-push] applying frontend formatting/lint fixes..."
cd "$ROOT_DIR/frontend"
pnpm run format
pnpm run lint:fix

echo "[pre-push] running frontend quality checks..."
cd "$ROOT_DIR"
"$ROOT_DIR/scripts/frontend-quality.sh"

echo "[pre-push] all checks passed"
