#!/usr/bin/env bash
set -euo pipefail

# Build and package Mars for macOS using PyInstaller.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

PYI_DIST="$BACKEND/build"
PYI_WORK="$BACKEND/build/.pyi-build"
PYI_SPEC="$BACKEND/build"

echo "==> Building frontend (npm install + npm run build)"
cd "$FRONTEND"
npm install
npm run build

echo "==> Syncing frontend dist into backend/dist"
rm -rf "$BACKEND/dist"
rsync -a "$FRONTEND/dist/" "$BACKEND/dist/"

echo "==> Ensuring PyInstaller is available (via uv)"
cd "$BACKEND"
uv pip install --upgrade pip >/dev/null
uv pip install --upgrade pyinstaller >/dev/null

echo "==> Packaging desktop app with PyInstaller (macOS) via uv"
mkdir -p "$PYI_DIST" "$PYI_WORK"
uv run pyinstaller --noconfirm --onefile --windowed --name mars \
  --icon assets/logo.png \
  --add-data "dist:dist" \
  --distpath "$PYI_DIST" \
  --workpath "$PYI_WORK" \
  --specpath "$PYI_SPEC" \
  main.py

APP_PATH="$PYI_DIST/mars"
echo "==> Build complete: $APP_PATH"
