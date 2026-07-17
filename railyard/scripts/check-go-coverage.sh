#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COVER_DIR="$ROOT_DIR/.tmp"
COVER_FILE="$COVER_DIR/coverage.out"

# Minimum acceptable total coverage percentage.
# Override with: GO_COVER_MIN=50 ./scripts/check-go-coverage.sh
MIN_COVERAGE="${GO_COVER_MIN:-73}"
GO_COVER_PACKAGES="${GO_COVER_PACKAGES:-}"

if [ -z "$GO_COVER_PACKAGES" ]; then
  # internal/dialog is native-dialog glue with no unit-testable surface.
  GO_COVER_PACKAGES="$(go list ./... | grep -Ev '/internal/(testutil($|/)|dialog$)')"
fi

# Files whose coverage is not meaningful: the entrypoint, Wails lifecycle/glue methods, and
# native integrations (AppImage mounts, OS dialogs) that only run inside a live app session.
GO_COVER_EXCLUDE_FILES='^railyard/(main|app|app_lifecycle|app_appimage|go_appimage_stub|app_dialog)\.go:'

mkdir -p "$COVER_DIR"

echo "[coverage] running go tests with coverage profile..."
go test $GO_COVER_PACKAGES -coverprofile="$COVER_FILE"

grep -Ev "$GO_COVER_EXCLUDE_FILES" "$COVER_FILE" > "$COVER_FILE.filtered"
mv "$COVER_FILE.filtered" "$COVER_FILE"

TOTAL_LINE="$(go tool cover -func="$COVER_FILE" | grep '^total:')"
TOTAL_COVERAGE="$(printf '%s' "$TOTAL_LINE" | awk '{print $3}' | tr -d '%')"

echo "[coverage] total: ${TOTAL_COVERAGE}% (minimum: ${MIN_COVERAGE}%)"

awk_check="$(awk -v total="$TOTAL_COVERAGE" -v min="$MIN_COVERAGE" 'BEGIN { if (total+0 < min+0) print "fail"; else print "pass"; }')"
if [ "$awk_check" = "fail" ]; then
  echo "[coverage] failed: total coverage below threshold"
  exit 1
fi

echo "[coverage] passed"
