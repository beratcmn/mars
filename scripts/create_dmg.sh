#!/bin/bash
# Create DMG installer for Mars.app using appdmg
# Requires Node.js/npm

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
BUILD_DIR="$BACKEND_DIR/build"
ASSETS_DIR="$PROJECT_ROOT/assets"
STAGING_DIR="$BUILD_DIR/dmg_staging"
OUTPUT_DMG="$BUILD_DIR/Mars-Installer.dmg"
CONFIG_FILE="$STAGING_DIR/appdmg.json"

echo "Creating Mars DMG installer..."
echo "Project root: $PROJECT_ROOT"

# Check prerequisites
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not found." >&2
    exit 1
fi

# Check that Mars.app exists
if [ ! -d "$BUILD_DIR/Mars.app" ]; then
    echo "Error: Mars.app not found at $BUILD_DIR/Mars.app" >&2
    echo "Please build the app first with: cd backend && pyinstaller mars.spec" >&2
    exit 1
fi

# Prepare staging area
echo "Preparing staging directory..."
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

# Copy App
echo "Copying Mars.app..."
cp -R "$BUILD_DIR/Mars.app" "$STAGING_DIR/"

# Copy CLI Installer
echo "Copying CLI installer..."
cp "$SCRIPT_DIR/install_cli.sh" "$STAGING_DIR/Install CLI.command"
chmod +x "$STAGING_DIR/Install CLI.command"

# Determine Background
BG_PATH=""
if [ -f "$ASSETS_DIR/dmg-background.png" ]; then
    echo "Using custom background..."
    cp "$ASSETS_DIR/dmg-background.png" "$STAGING_DIR/background.png"
    BG_PATH="$STAGING_DIR/background.png"
fi

# Determine Icon
ICON_PATH="$BACKEND_DIR/assets/logo.png"
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="$STAGING_DIR/Mars.app/Contents/Resources/icon-windowed.icns"
fi

# Generate appdmg.json
echo "Generating configuration..."

cat > "$CONFIG_FILE" << EOF
{
  "title": "Mars Installer",
  "icon": "$ICON_PATH",
  "background": "$( [ -n "$BG_PATH" ] && echo "$BG_PATH" || echo "" )",
  "contents": [
    { "x": 150, "y": 200, "type": "file", "path": "$STAGING_DIR/Mars.app" },
    { "x": 450, "y": 200, "type": "link", "path": "/Applications" },
    { "x": 300, "y": 340, "type": "file", "path": "$STAGING_DIR/Install CLI.command" }
  ],
  "window": {
      "size": { "width": 600, "height": 450 }
  }
}
EOF

# If no background, remove the background line to avoid errors
if [ -z "$BG_PATH" ]; then
    # Use sed to remove the line with "background": ""
    # We use a temp file to be safe with sed on different platforms
    grep -v '"background": ""' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
fi

# Run appdmg
echo "Running appdmg (this may take a moment)..."
rm -f "$OUTPUT_DMG"
# We use npx to run appdmg without installing it globally
# We suppress some output but keep errors
if npx appdmg "$CONFIG_FILE" "$OUTPUT_DMG"; then
    echo ""
    echo "✅ DMG created successfully!"
    echo "   Location: $OUTPUT_DMG"
    
    # Cleanup
    rm -rf "$STAGING_DIR"
else
    echo ""
    echo "❌ DMG creation failed."
    exit 1
fi
