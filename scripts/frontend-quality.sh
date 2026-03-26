#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/frontend"

echo "[frontend] running lint/format/tests/coverage..."
pnpm run check

echo "[frontend] all checks passed"
