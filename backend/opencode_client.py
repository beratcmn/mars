"""
OpenCode API Client
Wrapper for interacting with the OpenCode HTTP server.
"""

import requests
import subprocess
import time
import logging
from typing import Optional, Any, Union
from dataclasses import dataclass

logger = logging.getLogger("mars.opencode")


@dataclass
class OpenCodeConfig:
    """Configuration for OpenCode server connection."""

    host: str = "127.0.0.1"
    port: int = 4096

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}"


class OpenCodeServer:
    """Manages the OpenCode server process."""

    def __init__(self, config: Optional[OpenCodeConfig] = None):
        self.config = config or OpenCodeConfig()
        self._process: Optional[subprocess.Popen] = None
        self._running = False

    def start(self) -> bool:
        """Start the OpenCode server process."""
        logger.info("Starting OpenCode server...")

        # First check if server is already running externally
        if self._check_connectivity():
            logger.info("OpenCode server already running externally")
            self._running = True
            return True

        if self._running:
            return True

        try:
            logger.info(f"Spawning opencode serve on port {self.config.port}")
            self._process = subprocess.Popen(
                [
                    "opencode",
                    "serve",
                    "--port",
                    str(self.config.port),
                    "--hostname",
                    self.config.host,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            # Wait for server to be ready
            max_attempts = 30
            for attempt in range(max_attempts):
                if self._check_connectivity():
                    logger.info(f"Server ready after {attempt + 1} attempts")
                    self._running = True
                    return True
                time.sleep(0.5)

            logger.error("Server failed to start within timeout")
            return False
        except FileNotFoundError:
            logger.error(
                "'opencode' command not found. Make sure it's installed and in PATH."
            )
            return False
        except Exception as e:
            logger.error(f"Error starting OpenCode server: {e}", exc_info=True)
            return False

    def stop(self) -> bool:
        """Stop the OpenCode server process."""
        if self._process:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._process = None
            self._running = False
        return True

    def _check_connectivity(self) -> bool:
        """Check if we can connect to the server."""
        try:
            response = requests.get(f"{self.config.base_url}/config", timeout=1)
            return response.status_code == 200
        except:
            return False

    def is_running(self) -> bool:
        """Check if the server is running (either by us or externally)."""
        return self._check_connectivity()


class OpenCodeClient:
    """Client for interacting with OpenCode server API."""

    def __init__(self, config: Optional[OpenCodeConfig] = None):
        self.config = config or OpenCodeConfig()

    @property
    def base_url(self) -> str:
        return self.config.base_url

    def _request(self, method: str, path: str, **kwargs) -> Any:
        """Make an HTTP request to the OpenCode server."""
        url = f"{self.base_url}{path}"
        try:
            response = requests.request(method, url, **kwargs)
            response.raise_for_status()
            if response.content:
                return response.json()
            return True
        except requests.exceptions.JSONDecodeError:
            return response.text
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenCode API error: {e}")

    # === Config ===
    def get_config(self) -> dict:
        """Get current configuration."""
        return self._request("GET", "/config")

    def get_providers(self) -> dict:
        """Get available providers (all, connected, default)."""
        return self._request("GET", "/provider")

    # === Project ===
    def get_current_project(self) -> dict:
        """Get the current project info."""
        return self._request("GET", "/project/current")

    def list_projects(self) -> list:
        """List all projects."""
        return self._request("GET", "/project")

    # === Sessions ===
    def list_sessions(self) -> list:
        """List all sessions."""
        return self._request("GET", "/session")

    def create_session(
        self, title: Optional[str] = None, parent_id: Optional[str] = None
    ) -> dict:
        """Create a new session."""
        body = {}
        if title:
            body["title"] = title
        if parent_id:
            body["parentID"] = parent_id
        return self._request("POST", "/session", json=body)

    def get_session(self, session_id: str) -> dict:
        """Get session details."""
        return self._request("GET", f"/session/{session_id}")

    def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        return self._request("DELETE", f"/session/{session_id}")

    def abort_session(self, session_id: str) -> bool:
        """Abort a running session."""
        return self._request("POST", f"/session/{session_id}/abort")

    # === Messages ===
    def list_messages(self, session_id: str, limit: Optional[int] = None) -> list:
        """List messages in a session."""
        params = {}
        if limit:
            params["limit"] = limit
        return self._request("GET", f"/session/{session_id}/message", params=params)

    def send_message(
        self,
        session_id: str,
        content: str,
        model: Optional[Union[str, dict]] = None,
        agent: Optional[str] = None,
    ) -> dict:
        """Send a message and wait for response."""
        import logging

        logger = logging.getLogger("mars.opencode")

        body = {"parts": [{"type": "text", "text": content}]}
        if model:
            body["model"] = model
        if agent:
            body["agent"] = agent

        logger.info(f"send_message body: {body}")
        return self._request("POST", f"/session/{session_id}/message", json=body)

    def send_message_async(
        self,
        session_id: str,
        content: str,
        model: Optional[Union[str, dict]] = None,
        agent: Optional[str] = None,
    ) -> None:
        """Send a message asynchronously (no wait)."""
        body = {"parts": [{"type": "text", "text": content}]}
        if model:
            body["model"] = model
        if agent:
            body["agent"] = agent
        self._request("POST", f"/session/{session_id}/prompt_async", json=body)

    # === Agents ===
    def list_agents(self) -> list:
        """List all available agents."""
        return self._request("GET", "/agent")

    # === Files ===
    def search_files(self, query: str) -> list:
        """Find files by name."""
        return self._request("GET", "/find/file", params={"query": query})

    def get_file_content(self, path: str) -> dict:
        """Read a file's content."""
        return self._request("GET", "/file/content", params={"path": path})

    # === Commands ===
    def list_commands(self) -> list:
        """List all available commands."""
        return self._request("GET", "/command")

    def execute_command(
        self,
        session_id: str,
        command: str,
        arguments: Optional[dict] = None,
        agent: Optional[str] = None,
    ) -> dict:
        """Execute a slash command."""
        body = {"command": command, "arguments": arguments or {}}
        if agent:
            body["agent"] = agent
        return self._request("POST", f"/session/{session_id}/command", json=body)

    # === Events ===
    def listen_events(self):
        """Yield events from the server's global event stream using raw sockets."""
        import json
        import socket
        import time

        host = self.config.host
        port = self.config.port
        
        try:
            # Create raw socket connection
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((host, port))
            
            # Send HTTP GET request manually
            request = f"GET /global/event HTTP/1.1\r\nHost: {host}:{port}\r\nAccept: text/event-stream\r\nConnection: keep-alive\r\n\r\n"
            sock.sendall(request.encode())
            
            # Create unbuffered file-like object from socket (buffering=1 = line buffered)
            sock_file = sock.makefile('rb', buffering=1)
            
            # Skip HTTP headers
            while True:
                header_line = sock_file.readline()
                if header_line in (b'\r\n', b'\n', b''):
                    break
            
            # Read SSE events line by line
            while True:
                line = sock_file.readline()
                recv_time = time.time()
                
                if not line:
                    break
                    
                line = line.decode('utf-8').strip()
                if line.startswith("data: "):
                    data_str = line[6:]
                    try:
                        data = json.loads(data_str)
                        event_type = data.get('type', 'unknown')
                        logger.debug(f"SSE received event '{event_type}' at {recv_time:.3f}")
                        
                        # The useful part is usually in 'payload'
                        if "payload" in data:
                            yield data["payload"]
                        else:
                            yield data
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to decode event data: {data_str}")
                        
        except Exception as e:
            logger.error(f"Error in event listener: {e}")
        finally:
            try:
                sock.close()
            except:
                pass
