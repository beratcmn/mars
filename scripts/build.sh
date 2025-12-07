#!/usr/bin/env bash
set -euo pipefail

# Build and package Mars for macOS using PyInstaller.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

PYI_DIST="$BACKEND/build"
PYI_WORK="$BACKEND/build/.pyi-build"
PYI_SPEC="$BACKEND/build"
ICON="$BACKEND/assets/logo.png"

echo "==> Building frontend (npm install + npm run build)"
cd "$FRONTEND"
npm install
npm run build

echo "==> Syncing frontend dist into backend/dist"
rm -rf "$BACKEND/dist"
rsync -a "$FRONTEND/dist/" "$BACKEND/dist/"

echo "==> Ensuring PyInstaller is available (via uv)"
cd "$BACKEND"
uv run python -m pip install --upgrade pip >/dev/null
uv run python -m pip install --upgrade pyinstaller >/dev/null
uv run python -m pip install --upgrade pillow >/dev/null

echo "==> Packaging desktop app with PyInstaller (macOS) via uv"
rm -rf "$PYI_DIST" "$PYI_WORK" "$PYI_SPEC/mars.spec"
mkdir -p "$PYI_DIST" "$PYI_WORK"
# Use onedir bundle for macOS (onefile + windowed is deprecated on macOS)
uv run pyinstaller --noconfirm --windowed --name mars \
  --icon "$ICON" \
  --argv-emulation \
  --add-data "$BACKEND/dist:dist" \
  --distpath "$PYI_DIST" \
  --workpath "$PYI_WORK" \
  --specpath "$PYI_SPEC" \
  main.py

APP_PATH="$PYI_DIST/mars.app"
echo "==> Build complete: $APP_PATH"
