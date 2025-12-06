"""
OpenCode API Client
Wrapper for interacting with the OpenCode HTTP server.
"""

import requests
import subprocess
import time
from typing import Optional, Any
from dataclasses import dataclass


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
        if self._running:
            return True
        
        try:
            self._process = subprocess.Popen(
                [
                    "opencode", "serve",
                    "--port", str(self.config.port),
                    "--hostname", self.config.host
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for server to be ready
            max_attempts = 30
            for _ in range(max_attempts):
                try:
                    response = requests.get(f"{self.config.base_url}/config", timeout=1)
                    if response.status_code == 200:
                        self._running = True
                        return True
                except requests.exceptions.ConnectionError:
                    time.sleep(0.5)
            
            return False
        except FileNotFoundError:
            print("Error: 'opencode' command not found. Make sure it's installed and in PATH.")
            return False
        except Exception as e:
            print(f"Error starting OpenCode server: {e}")
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
    
    def is_running(self) -> bool:
        """Check if the server is running."""
        if not self._running:
            return False
        try:
            response = requests.get(f"{self.config.base_url}/config", timeout=1)
            return response.status_code == 200
        except:
            return False


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
        """Get available providers and default models."""
        return self._request("GET", "/config/providers")
    
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
    
    def create_session(self, title: Optional[str] = None, parent_id: Optional[str] = None) -> dict:
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
        model: Optional[str] = None,
        agent: Optional[str] = None
    ) -> dict:
        """Send a message and wait for response."""
        body = {
            "parts": [{"type": "text", "text": content}]
        }
        if model:
            body["model"] = model
        if agent:
            body["agent"] = agent
        return self._request("POST", f"/session/{session_id}/message", json=body)
    
    def send_message_async(
        self,
        session_id: str,
        content: str,
        model: Optional[str] = None,
        agent: Optional[str] = None
    ) -> None:
        """Send a message asynchronously (no wait)."""
        body = {
            "parts": [{"type": "text", "text": content}]
        }
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
        agent: Optional[str] = None
    ) -> dict:
        """Execute a slash command."""
        body = {
            "command": command,
            "arguments": arguments or {}
        }
        if agent:
            body["agent"] = agent
        return self._request("POST", f"/session/{session_id}/command", json=body)
