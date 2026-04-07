#!/usr/bin/env sh
set -eu

echo "running lint/format"
pnpm run check

echo "all checks passed"
