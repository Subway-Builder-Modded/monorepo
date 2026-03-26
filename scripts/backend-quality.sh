#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[backend] checking Go formatting..."
GO_FILES="$(git ls-files '*.go')"
if [ -n "$GO_FILES" ]; then
  # shellcheck disable=SC2086
  UNFORMATTED="$(gofmt -l $GO_FILES)"
  if [ -n "$UNFORMATTED" ]; then
    echo "[backend] gofmt required for:"
    echo "$UNFORMATTED"
    exit 1
  fi
fi

echo "[backend] running Go tests..."
go test ./...

echo "[backend] running Go coverage gate..."
"$ROOT_DIR/scripts/check-go-coverage.sh"

echo "[backend] all checks passed"
