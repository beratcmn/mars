"""
Mars Code Agent - PyWebView Backend
Main entry point for the desktop application.
"""

import webview
import os
import logging
from typing import Optional, Union
from opencode_client import OpenCodeClient, OpenCodeServer, OpenCodeConfig

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mars")


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

    # === Streaming ===

    def start_event_listener(self):
        """Start the background thread to listen for server events."""
        import threading

        if not hasattr(self, "_event_thread") or not self._event_thread.is_alive():
            self._event_thread = threading.Thread(target=self._event_loop, daemon=True)
            self._event_thread.start()

    def _event_loop(self):
        """Listen for events and dispatch them to the frontend."""
        import json
        import time

        logger.info("Starting event loop listener...")
        for event in self.client.listen_events():
            recv_time = time.time()
            event_type = event.get('type', 'unknown')
            
            # Create JS code to dispatch a custom event
            # We use 'mars:event' as the event name
            json_event = json.dumps(event)
            js_code = f"window.dispatchEvent(new CustomEvent('mars:event', {{ detail: {json_event} }}))"

            if self.window:
                # Dispatch to main window
                try:
                    self.window.evaluate_js(js_code)
                    dispatch_time = time.time()
                    # Log timing for debugging
                    logger.debug(f"Event {event_type}: dispatched in {(dispatch_time - recv_time)*1000:.1f}ms")
                except Exception as e:
                    logger.error(f"Failed to dispatch event to frontend: {e}")

    def stream_message(
        self, session_id: str, content: str, model: Optional[dict] = None
    ) -> dict:
        """Send a message asynchronously to trigger streaming events."""
        try:
            # Ensure event listener is running
            self.start_event_listener()

            self.client.send_message_async(
                session_id=session_id, content=content, model=model
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


def get_frontend_url() -> str:
    """Get the frontend URL based on environment."""
    # In development, use Vite dev server
    dev_url = "http://localhost:5173"

    # In production, load from built files
    dist_path = os.path.join(
        os.path.dirname(__file__), "..", "frontend", "dist", "index.html"
    )

    if os.path.exists(dist_path):
        return f"file://{os.path.abspath(dist_path)}"

    return dev_url


def main():
    """Main entry point."""
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
    webview.start(debug=True)

    # Cleanup on exit
    api.stop_server()


if __name__ == "__main__":
    main()
