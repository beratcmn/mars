"""
Mars Code Agent - PyWebView Backend
Main entry point for the desktop application.
"""

import argparse
import logging
import os
import sys
from typing import Optional, Union

import webview
from opencode_client import OpenCodeClient, OpenCodeServer, OpenCodeConfig

# Preserve the launch working directory so subprocesses (opencode) can inherit it
LAUNCH_CWD = os.getcwd()
os.environ.setdefault("MARS_LAUNCH_CWD", LAUNCH_CWD)


def capture_cli_workdir() -> None:
    """Look for a workdir hint in CLI args and expose it via env.

    When launched via `open ... --args` or with argv emulation on macOS, users can
    pass a directory (positional or --workdir/-C) so opencode runs from there.
    """

    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("path", nargs="?")
    parser.add_argument("-C", "--workdir")

    try:
        args, _ = parser.parse_known_args()
    except Exception as exc:
        logger.warning(f"Could not parse CLI args: {exc}")
        return

    for candidate in (args.workdir, args.path):
        if not candidate:
            continue

        resolved = os.path.abspath(candidate)
        if os.path.isdir(resolved):
            os.environ["MARS_WORKDIR"] = resolved
            logger.info(f"Using CLI workdir override: {resolved}")
            return

    # Fallback: scan sys.argv for any valid directory
    # This handles cases where argparse might consume a non-directory argument as 'path'
    # or if argv emulation appends arguments in a way argparse doesn't expect.
    logger.info("Argparse failed to find workdir, scanning sys.argv...")
    for arg in sys.argv[1:]:
        if arg.startswith("-"):
            continue

        try:
            resolved = os.path.abspath(arg)
            if os.path.isdir(resolved):
                os.environ["MARS_WORKDIR"] = resolved
                logger.info(f"Found workdir via scan: {resolved}")
                return
        except Exception:
            continue

    # If args were provided but unusable, log once for visibility
    if args.workdir or args.path:
        logger.warning("CLI workdir argument provided but not a directory")


# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mars")


def set_working_directory() -> None:
    """Ensure app runs from its own bundle/root directory.

    PyInstaller on macOS may start with cwd inside the .app bundle; we normalize
    to the directory that contains our bundled files so relative paths and
    subprocesses (opencode) work as expected.
    """

    base_dir = getattr(sys, "_MEIPASS", None)
    if not base_dir:
        base_dir = os.path.abspath(os.path.dirname(__file__))

    try:
        os.chdir(base_dir)
        logger.info(f"Working directory set to: {base_dir}")
    except Exception as exc:
        logger.error(f"Failed to set working directory: {exc}")


class MarsAPI:
    """
    API class exposed to JavaScript via PyWebView.
    All public methods are callable from the frontend.
    """

    def __init__(self):
        self.config = OpenCodeConfig()
        self.server = OpenCodeServer(self.config)
        self.client = OpenCodeClient(self.config)
        self._current_session_id: Optional[str] = None
        self.window = None

    # === Server Management ===

    def start_server(self) -> dict:
        """Start the OpenCode server."""
        logger.info("start_server called")
        try:
            success = self.server.start()
            logger.info(f"Server start result: {success}")
            return {"success": success, "error": None}
        except Exception as e:
            logger.error(f"Error starting server: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def stop_server(self) -> dict:
        """Stop the OpenCode server."""
        try:
            success = self.server.stop()
            return {"success": success, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def is_server_running(self) -> bool:
        """Check if the server is running."""
        running = self.server.is_running()
        logger.info(f"is_server_running: {running}")
        return running

    # === Session Management ===

    def create_session(
        self, title: Optional[str] = None, parent_id: Optional[str] = None
    ) -> dict:
        """Create a new session."""
        logger.info(
            f"create_session called with title: {title}, parent_id: {parent_id}"
        )
        try:
            session = self.client.create_session(title=title, parent_id=parent_id)
            logger.info(f"Session created: {session}")
            self._current_session_id = session.get("id")
            return {"success": True, "session": session, "error": None}
        except Exception as e:
            logger.error(f"Error creating session: {e}", exc_info=True)
            return {"success": False, "session": None, "error": str(e)}

    def list_sessions(self) -> dict:
        """List all sessions."""
        try:
            sessions = self.client.list_sessions()
            return {"success": True, "sessions": sessions, "error": None}
        except Exception as e:
            return {"success": False, "sessions": [], "error": str(e)}

    def get_session(self, session_id: str) -> dict:
        """Get session details."""
        try:
            session = self.client.get_session(session_id)
            return {"success": True, "session": session, "error": None}
        except Exception as e:
            return {"success": False, "session": None, "error": str(e)}

    def delete_session(self, session_id: str) -> dict:
        """Delete a session."""
        try:
            success = self.client.delete_session(session_id)
            return {"success": success, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def set_current_session(self, session_id: str) -> None:
        """Set the current active session."""
        self._current_session_id = session_id

    def get_current_session_id(self) -> Optional[str]:
        """Get the current session ID."""
        return self._current_session_id

    # === Messages ===

    def send_message(
        self,
        content: str,
        session_id: Optional[str] = None,
        model: Optional[Union[str, dict]] = None,
        agent: Optional[str] = None,
    ) -> dict:
        """Send a message and get a response."""
        logger.info(f"send_message called with content: {content[:50]}...")
        logger.info(f"session_id: {session_id}, current: {self._current_session_id}")

        try:
            sid = session_id or self._current_session_id
            if not sid:
                logger.info("No session, creating new one...")
                # Create a new session if none exists
                session = self.client.create_session()
                sid = session.get("id")
                self._current_session_id = sid
                logger.info(f"Created session: {sid}")

            logger.info(f"Sending message to session: {sid}")
            response = self.client.send_message(
                session_id=sid, content=content, model=model, agent=agent
            )
            logger.info(f"Got response: {response}")

            return {
                "success": True,
                "response": response,
                "sessionId": sid,
                "error": None,
            }
        except Exception as e:
            logger.error(f"Error in send_message: {e}", exc_info=True)
            return {
                "success": False,
                "response": None,
                "sessionId": None,
                "error": str(e),
            }

    def list_messages(
        self, session_id: Optional[str] = None, limit: Optional[int] = None
    ) -> dict:
        """List messages in a session."""
        try:
            sid = session_id or self._current_session_id
            if not sid:
                return {"success": True, "messages": [], "error": None}

            messages = self.client.list_messages(sid, limit=limit)
            return {"success": True, "messages": messages, "error": None}
        except Exception as e:
            return {"success": False, "messages": [], "error": str(e)}

    def abort_session(self, session_id: Optional[str] = None) -> dict:
        """Abort a running session."""
        try:
            sid = session_id or self._current_session_id
            if not sid:
                return {"success": False, "error": "No active session"}

            success = self.client.abort_session(sid)
            return {"success": success, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # === Config & Info ===

    def get_config(self) -> dict:
        """Get OpenCode configuration."""
        try:
            config = self.client.get_config()
            return {"success": True, "config": config, "error": None}
        except Exception as e:
            return {"success": False, "config": None, "error": str(e)}

    def get_providers(self) -> dict:
        """Get available providers and models."""
        try:
            providers = self.client.get_providers()
            # logger.info(f"get_providers response: {providers}")
            return {"success": True, "providers": providers, "error": None}
        except Exception as e:
            logger.error(f"get_providers error: {e}", exc_info=True)
            return {"success": False, "providers": None, "error": str(e)}

    def list_agents(self) -> dict:
        """List available agents."""
        try:
            agents = self.client.list_agents()
            return {"success": True, "agents": agents, "error": None}
        except Exception as e:
            return {"success": False, "agents": [], "error": str(e)}

    def get_current_project(self) -> dict:
        """Get the current project info."""
        try:
            project = self.client.get_current_project()
            return {"success": True, "project": project, "error": None}
        except Exception as e:
            return {"success": False, "project": None, "error": str(e)}

    # === Files ===

    def search_files(self, query: str) -> dict:
        """Search for files."""
        try:
            files = self.client.search_files(query)
            return {"success": True, "files": files, "error": None}
        except Exception as e:
            return {"success": False, "files": [], "error": str(e)}

    def list_files(self, path: str = ".") -> dict:
        """List files in a directory."""
        try:
            # Resolve path if it's '.'
            search_path = path
            if path == ".":
                # Default to the project root (one level up from this file)
                # This ensures we see frontend/, backend/, etc.
                search_path = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..")
                )
                logger.info(f"Root path resolved to: {search_path}")

            if not os.path.exists(search_path):
                return {
                    "success": False,
                    "files": [],
                    "error": f"Path not found: {search_path}",
                }

            items = []
            try:
                for entry in os.scandir(search_path):
                    if entry.name.startswith("."):
                        continue  # Skip hidden files
                    items.append(
                        {
                            "name": entry.name,
                            "path": entry.path,
                            "isDirectory": entry.is_dir(),
                        }
                    )
            except PermissionError:
                return {"success": False, "files": [], "error": "Permission denied"}

            # Sort: directories first, then files, alphabetical
            items.sort(key=lambda x: (not x["isDirectory"], x["name"].lower()))

            return {"success": True, "files": items, "root": search_path, "error": None}
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return {"success": False, "files": [], "error": str(e)}

    def read_file(self, path: str) -> dict:
        """Read file content."""
        try:
            # Use local file read for speed and simplicity
            if os.path.exists(path) and os.path.isfile(path):
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                return {"success": True, "content": content, "error": None}
            else:
                return {"success": False, "content": None, "error": "File not found"}
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return {"success": False, "content": None, "error": str(e)}

    # === Commands ===

    def list_commands(self) -> dict:
        """List available slash commands."""
        try:
            commands = self.client.list_commands()
            return {"success": True, "commands": commands, "error": None}
        except Exception as e:
            return {"success": False, "commands": [], "error": str(e)}

    def execute_command(
        self,
        command: str,
        arguments: Optional[dict] = None,
        session_id: Optional[str] = None,
    ) -> dict:
        """Execute a slash command."""
        try:
            sid = session_id or self._current_session_id
            if not sid:
                return {"success": False, "error": "No active session"}

            result = self.client.execute_command(sid, command, arguments)
            return {"success": True, "result": result, "error": None}
        except Exception as e:
            return {"success": False, "result": None, "error": str(e)}

    def list_todos(self, session_id: Optional[str] = None) -> dict:
        """List todos for a session."""
        try:
            sid = session_id or self._current_session_id
            if not sid:
                return {"success": True, "todos": [], "error": None}
            todos = self.client.list_todos(sid)
            return {"success": True, "todos": todos, "error": None}
        except Exception as e:
            return {"success": False, "todos": [], "error": str(e)}

    # === Streaming ===

    def stream_message(
        self,
        session_id: str,
        content: str,
        model: Optional[dict] = None,
        agent: Optional[str] = None,
    ) -> dict:
        """Send a message asynchronously to trigger streaming events.

        Note: The frontend now connects directly to the OpenCode SSE endpoint
        via EventSource for real-time streaming without buffering.
        """
        try:
            # Frontend now handles events directly via EventSource
            # No need to start the backend event listener
            self.client.send_message_async(
                session_id=session_id, content=content, model=model, agent=agent
            )
            return {"success": True, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # === Settings ===

    def save_settings(self, settings: dict) -> dict:
        """Save settings to a local JSON file."""
        try:
            import json

            settings_path = os.path.join(os.path.dirname(__file__), "settings.json")
            with open(settings_path, "w") as f:
                json.dump(settings, f, indent=2)
            return {"success": True, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def load_settings(self) -> dict:
        """Load settings from a local JSON file."""
        try:
            import json

            settings_path = os.path.join(os.path.dirname(__file__), "settings.json")
            if not os.path.exists(settings_path):
                return {"success": True, "settings": {}, "error": None}

            with open(settings_path, "r") as f:
                settings = json.load(f)
            return {"success": True, "settings": settings, "error": None}
        except Exception as e:
            return {"success": False, "settings": {}, "error": str(e)}

    def open_in_editor(self, path: Optional[str] = None) -> dict:
        """Open a file or directory in VS Code."""
        try:
            import subprocess

            # Use the provided path or default to project root
            target_path = path
            if not target_path:
                # Default to the project root (one level up from backend/)
                target_path = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..")
                )

            # Try to open with VS Code using the 'code' command
            result = subprocess.run(
                ["code", target_path],
                capture_output=True,
                text=True,
            )

            if result.returncode == 0:
                return {"success": True, "error": None}
            else:
                # If 'code' command fails, try 'open' on macOS with VS Code app
                if os.uname().sysname == "Darwin":
                    subprocess.run(
                        ["open", "-a", "Visual Studio Code", target_path],
                        capture_output=True,
                    )
                    return {"success": True, "error": None}
                return {
                    "success": False,
                    "error": result.stderr or "Failed to open VS Code",
                }
        except FileNotFoundError:
            return {
                "success": False,
                "error": "VS Code 'code' command not found. Please install it from VS Code command palette.",
            }
        except Exception as e:
            logger.error(f"Error opening in editor: {e}")
            return {"success": False, "error": str(e)}


def get_frontend_url() -> str:
    """Get the frontend URL based on environment."""
    # In development, use Vite dev server
    dev_url = "http://localhost:5173"

    # When bundled with PyInstaller, assets are extracted to _MEIPASS
    if getattr(sys, "_MEIPASS", None):
        bundled_dist = os.path.join(sys._MEIPASS, "dist", "index.html")
        if os.path.exists(bundled_dist):
            return f"file://{bundled_dist}"

    # When running from source, prefer local built dist inside backend/
    dist_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "dist", "index.html")
    )
    if os.path.exists(dist_path):
        return f"file://{dist_path}"

    # Fallback to dev server
    return dev_url


def main():
    """Main entry point."""
    # Capture a user-supplied working directory (e.g., `open ... --args .`)
    capture_cli_workdir()

    # Normalize working directory so bundled assets and opencode run relative to app root
    set_working_directory()

    api = MarsAPI()

    # Create the webview window
    window = webview.create_window(
        title="Mars",
        url=get_frontend_url(),
        js_api=api,
        width=1200,
        height=800,
        min_size=(800, 600),
        text_select=True,
    )
    api.window = window

    # Start the application
    debug = True
    webview.start(debug=debug)

    # Cleanup on exit
    api.stop_server()


if __name__ == "__main__":
    main()
