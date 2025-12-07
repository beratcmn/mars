# Mars Backend

Python backend for the Mars desktop application, built with PyWebView and OpenCode integration.

## Overview

The backend serves as the bridge between the React frontend and the OpenCode CLI tool. It provides a desktop application wrapper and exposes a comprehensive API for managing AI coding sessions.

## Components

### main.py
The main entry point that creates the PyWebView window and exposes the MarsAPI class to the frontend.

**Key Features:**
- **Server Management**: Start/stop OpenCode server process
- **Session Management**: Create, list, delete chat sessions
- **Message Handling**: Send messages and handle streaming responses
- **Event Streaming**: Real-time communication with frontend
- **Settings Persistence**: Save/load user preferences

### opencode_client.py
HTTP client wrapper for communicating with the OpenCode server API.

**Classes:**
- `OpenCodeConfig`: Configuration for server connection (host, port)
- `OpenCodeServer`: Manages the OpenCode subprocess lifecycle
- `OpenCodeClient`: HTTP client for all OpenCode API endpoints

**API Endpoints Covered:**
- Configuration and providers
- Session and message management
- Project information
- Command execution
- Event streaming

### pyproject.toml
Python project configuration with dependencies:
- `pywebview>=6.1`: Desktop application framework
- `requests>=2.32.5`: HTTP client for API communication
- `ruff>=0.14.8`: Code formatting and linting (dev dependency)

### settings.json
Persistent storage for user settings:
```json
{
  "selectedModel": {
    "providerId": "zai-coding-plan",
    "providerName": "Z.AI Coding Plan",
    "modelId": "glm-4.6",
    "modelName": "GLM-4.6"
  }
}
```

## API Architecture

### MarsAPI Class
Exposed to JavaScript via PyWebView, providing methods for:

#### Server Management
```python
def start_server() -> dict
def stop_server() -> dict
def is_server_running() -> bool
```

#### Session Management
```python
def create_session(title: Optional[str], parent_id: Optional[str]) -> dict
def list_sessions() -> dict
def get_session(session_id: str) -> dict
def delete_session(session_id: str) -> dict
```

#### Message Handling
```python
def send_message(content: str, session_id: Optional[str], model: Optional[dict], agent: Optional[str]) -> dict
def stream_message(session_id: str, content: str, model: Optional[dict]) -> dict
def list_messages(session_id: Optional[str], limit: Optional[int]) -> dict
```

#### Configuration
```python
def get_providers() -> dict
def get_config() -> dict
def get_current_project() -> dict
```

#### Settings
```python
def save_settings(settings: dict) -> dict
def load_settings() -> dict
```

### Event System
The frontend connects directly to OpenCode's global SSE stream for real-time updates
to avoid PyWebView's JS bridge buffering. No server-side dispatch via `evaluate_js`
is used anymore.

## Development

### Running the Backend

```bash
cd backend
python main.py
```

This will:
1. Start the PyWebView window
2. Attempt to connect to frontend (dev server or production build)
3. Auto-start the OpenCode server if needed
4. Begin listening for events

### Development Mode

In development mode, the backend connects to the Vite dev server at `http://localhost:5173`.

### Production Mode

In production mode, the backend loads the built frontend from `../frontend/dist/index.html`.

## Configuration

### OpenCode Server
- Default host: `127.0.0.1`
- Default port: `4096`
- Configurable via `OpenCodeConfig` class

### Logging
Comprehensive logging setup with DEBUG level:
```python
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
```

## Error Handling

All API methods return consistent response format:
```python
{
    "success": bool,
    "error": str | None,
    # ... additional data based on method
}
```

## Dependencies

### Runtime Dependencies
- **pywebview**: Cross-platform webview wrapper for desktop apps
- **requests**: HTTP library for API communication

### Development Dependencies
- **ruff**: Fast Python linter and formatter

## Security Considerations

- All API calls are validated and wrapped in try-catch blocks
- Settings are stored locally in JSON format
- No sensitive information is logged or exposed
- Server process is properly managed and cleaned up on exit

## Troubleshooting

### Common Issues

1. **"opencode command not found"**
   - Ensure OpenCode CLI is installed and in PATH
   - Install with: `pip install opencode`

2. **Server fails to start**
   - Check if port 4096 is already in use
   - Verify OpenCode configuration

3. **Frontend connection issues**
   - Ensure Vite dev server is running in development
   - Check that frontend is built for production

### Debug Mode

The application runs with `debug=True` in PyWebView, enabling:
- Developer tools access
- Console logging
- Error details in window

## Integration Points

The backend integrates with:
- **OpenCode CLI**: For AI model access and tool execution
- **Frontend React App**: Via PyWebView's JavaScript API bridge
- **File System**: For settings persistence and project access
- **System Processes**: Managing OpenCode server lifecycle
