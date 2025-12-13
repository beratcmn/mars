# Mars Codebase Guide for Agents

## 1. Build, Lint, and Test Commands

### Development
*   **Frontend**: `cd frontend`
    *   Start Dev Server: `npm run dev` (Vite)
    *   Lint: `npm run lint` (ESLint)
    *   Build: `npm run build` (tsc + vite build)
*   **Backend**: `cd backend`
    *   Start App: `uv run python main.py`
    *   Lint: `ruff check .`
    *   Dependencies: `uv sync`

### Testing
*   **Status**: No formal test suite exists currently.
*   **Verification**: Run lint commands and build the project to verify changes. Manual verification via the UI is required.

### Production Build
*   Run `scripts/build.sh` to build the full macOS `.app` bundle.
    *   This compiles frontend, copies assets, and runs PyInstaller.

## 2. Code Style & Conventions

### Frontend (React/TypeScript)
*   **Strict Typing**: Use interfaces from `@/lib/api` (e.g., `Session`, `Message`, `ApiResponse<T>`).
*   **Async/Await**: API calls return `Promise<T>`. Always handle errors, though the API wrapper catches most and returns `success: false`.
*   **Components**:
    *   Use **shadcn/ui** components in `@/components/ui`.
    *   Use Tailwind CSS for styling. Use `cn()` for class merging.
    *   Prefer Functional Components with Hooks.
*   **State**:
    *   Use `Context` for global app state (Theme, etc.).
    *   Use local state for component-specific logic.
    *   Subscribe to streaming events via `connectToEventStream` in `api.ts`.
*   **Imports**: Use absolute imports `@/` aliased to `src/`.

### Backend (Python)
*   **Type Hints**: Use strict Python type hints (e.g., `def func(a: int) -> dict:`).
*   **Error Handling**:
    *   API methods must return a `dict` with `{"success": bool, "error": str | None}`.
    *   Wrap logic in `try...except` blocks to prevent crashing the PyWebView bridge.
*   **Logging**: Use the global `logger` object (`logging.getLogger("mars")`). Do not use `print`.
*   **Path Handling**: Use `MARS_WORKDIR` env var or `os.getcwd()` carefully. The app may run from a bundle, so resolve paths relative to the project root where possible.

## 3. Architecture Overview

### Communication Flow
1.  **Frontend**: Runs in a webview. Calls backend via `window.pywebview.api`.
2.  **Backend**: `MarsAPI` class in `main.py` proxies requests to the `opencode` subprocess.
3.  **Streaming**: Backend listens to OpenCode SSE stream and pushes events to `window.state`. Frontend listens to `pywebviewstatechange` events.

### Key Files
*   `frontend/src/lib/api.ts`: TypeScript definitions and API bridge.
*   `backend/main.py`: Entry point, `MarsAPI` definition, and event loop.
*   `backend/opencode_client.py`: Client for the OpenCode REST API.

## 4. Patterns

### Frontend Patterns
*   **Streaming Rendering**: `Streamdown` component handles markdown. `ChatArea` handles message parts (reasoning, tool calls).
*   **Icons**: Lucide React.

### Backend Patterns
*   **Process Management**: `OpenCodeServer` manages the binary lifecycle.
*   **Settings**: Persisted to `~/Library/Application Support/Mars/settings.json`.
