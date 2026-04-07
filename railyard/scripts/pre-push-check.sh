#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[pre-push] applying Go formatting..."
GO_FILES="$(git ls-files '*.go')"
if [ -n "$GO_FILES" ]; then
  # shellcheck disable=SC2086
  gofmt -w $GO_FILES

  # shellcheck disable=SC2086
  REMAINING_UNFORMATTED="$(gofmt -l $GO_FILES)"
  if [ -n "$REMAINING_UNFORMATTED" ]; then
    echo "[pre-push] gofmt still required for:"
    echo "$REMAINING_UNFORMATTED"
    exit 1
  fi
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
