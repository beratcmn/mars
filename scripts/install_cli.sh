#!/bin/bash
# Install Mars CLI - Adds the 'mars' command to your PATH
# Run this script after installing Mars.app to /Applications

set -e

echo "Installing Mars CLI..."

# Determine where Mars.app is installed
MARS_APP=""
if [ -d "/Applications/Mars.app" ]; then
    MARS_APP="/Applications/Mars.app"
elif [ -d "$HOME/Applications/Mars.app" ]; then
    MARS_APP="$HOME/Applications/Mars.app"
else
    echo "Error: Mars.app not found in /Applications or ~/Applications" >&2
    echo "Please install Mars.app first by dragging it to the Applications folder." >&2
    exit 1
fi

echo "Found Mars.app at: $MARS_APP"

# Create the CLI wrapper script
CLI_SCRIPT="/usr/local/bin/mars"

# Check if we need sudo
if [ -w "/usr/local/bin" ]; then
    SUDO=""
else
    echo "Administrator privileges required to install to /usr/local/bin"
    SUDO="sudo"
fi

# Create /usr/local/bin if it doesn't exist
$SUDO mkdir -p /usr/local/bin

# Create the CLI script
$SUDO tee "$CLI_SCRIPT" > /dev/null << 'MARS_CLI'
#!/bin/bash
# Mars CLI - Launch Mars.app with working directory support
# Usage: mars [path]
#   path: Directory to open (defaults to current directory)

set -e

# Find Mars.app
MARS_APP=""
if [ -d "/Applications/Mars.app" ]; then
    MARS_APP="/Applications/Mars.app"
elif [ -d "$HOME/Applications/Mars.app" ]; then
    MARS_APP="$HOME/Applications/Mars.app"
else
    echo "Error: Mars.app not found" >&2
    exit 1
fi

# Resolve working directory to absolute path
if [ -n "$1" ]; then
    if [ -d "$1" ]; then
        WORKDIR="$(cd "$1" && pwd)"
    elif [ -f "$1" ]; then
        WORKDIR="$(cd "$(dirname "$1")" && pwd)"
    else
        echo "Error: '$1' is not a valid path" >&2
        exit 1
    fi
else
    WORKDIR="$(pwd)"
fi

echo "Opening Mars in: $WORKDIR"

export MARS_WORKDIR="$WORKDIR"

# Start opencode server if not running
if ! lsof -ti:4096 > /dev/null 2>&1; then
    echo "Starting opencode server..."
    cd "$WORKDIR"
    nohup opencode serve -p 4096 > /tmp/opencode_server.log 2>&1 &
    
    echo "Waiting for server..."
    for i in {1..20}; do
        if curl -s http://127.0.0.1:4096/config > /dev/null 2>&1; then
            echo "OpenCode server ready!"
            break
        fi
        sleep 0.5
    done
else
    echo "OpenCode server already running"
fi

# Launch Mars.app
MARS_EXECUTABLE="$MARS_APP/Contents/MacOS/mars"
nohup "$MARS_EXECUTABLE" "$WORKDIR" > /dev/null 2>&1 &

echo "Mars launched!"
MARS_CLI

# Make it executable
$SUDO chmod +x "$CLI_SCRIPT"

echo ""
echo "✅ Mars CLI installed successfully!"
echo ""
echo "You can now run 'mars' from any directory:"
echo "  mars .          # Open current directory"
echo "  mars ~/project  # Open specific directory"
echo ""
