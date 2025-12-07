#!/bin/bash
# Create DMG installer for Mars.app
# This script creates a macOS DMG file for distributing Mars

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
BUILD_DIR="$BACKEND_DIR/build"
DMG_DIR="$BUILD_DIR/dmg_staging"
OUTPUT_DMG="$BUILD_DIR/Mars-Installer.dmg"

echo "Creating Mars DMG installer..."
echo "Project root: $PROJECT_ROOT"

# Check that mars.app exists
if [ ! -d "$BUILD_DIR/mars.app" ]; then
    echo "Error: mars.app not found at $BUILD_DIR/mars.app" >&2
    echo "Please build the app first with: cd backend && pyinstaller mars.spec" >&2
    exit 1
fi

# Clean up previous staging directory
rm -rf "$DMG_DIR"
mkdir -p "$DMG_DIR"

# Copy mars.app to staging
echo "Copying Mars.app..."
cp -R "$BUILD_DIR/mars.app" "$DMG_DIR/Mars.app"

# Create symlink to Applications
echo "Creating Applications symlink..."
ln -s /Applications "$DMG_DIR/Applications"

# Copy the CLI installer script
echo "Copying Install CLI script..."
cp "$SCRIPT_DIR/install_cli.sh" "$DMG_DIR/Install CLI.command"
chmod +x "$DMG_DIR/Install CLI.command"

# Create a README file
cat > "$DMG_DIR/README.txt" << 'EOF'
Mars - AI Code Assistant

INSTALLATION:
1. Drag "Mars.app" to the "Applications" folder
2. Double-click "Install CLI.command" to add the 'mars' command to your terminal

USAGE:
After installing the CLI, open Terminal and run:
  mars .          # Open Mars in current directory
  mars ~/project  # Open Mars in a specific directory

REQUIREMENTS:
- macOS 11.0 or later
- opencode CLI installed (npm install -g opencode)

For more information, visit: https://github.com/beratcmn/mars
EOF

# Remove any existing DMG
rm -f "$OUTPUT_DMG"

# Create the DMG
echo "Creating DMG..."
hdiutil create -volname "Mars" \
    -srcfolder "$DMG_DIR" \
    -ov -format UDZO \
    "$OUTPUT_DMG"

# Clean up staging directory
rm -rf "$DMG_DIR"

echo ""
echo "✅ DMG created successfully!"
echo "   Location: $OUTPUT_DMG"
echo ""
echo "To distribute:"
echo "  1. Share the DMG file with users"
echo "  2. Users open the DMG and drag Mars.app to Applications"
echo "  3. Users run 'Install CLI.command' to add the mars command"
echo ""
