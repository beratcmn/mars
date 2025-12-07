/**
 * Mars API - Bridge to PyWebView backend
 * All functions return Promises that resolve when the Python backend responds.
 */

// Type definitions for the API responses
interface ApiResponse<T> {
  success: boolean;
  error: string | null;
  [key: string]: T | boolean | string | null;
}

interface Session {
  id: string;
  title?: string;
  createdAt?: string;
}

interface Message {
  info: {
    id: string;
    role: string;
    createdAt?: string; // Kept for compat
    // New fields from OpenCode API
    modelID?: string;
    providerID?: string;
    cost?: number;
    time?: {
      created: number;
      completed: number;
    };
    tokens?: {
      input: number;
      output: number;
      cache?: {
        read: number;
        write: number;
      };
    };
  };
  parts: Array<{
    type: string;
    text?: string;
    reasoning?: string; // For later
  }>;
}

interface Project {
  name: string;
  path: string;
}

// Provider and Model types
export interface Model {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  models: Model[];
}

export interface ProvidersResponse {
  all: Provider[];
  connected: string[];
  default: { [key: string]: string };
}

export interface Agent {
  name: string; // The identifier found in "name" field
  description?: string;
  [key: string]: unknown;
}

// Command types for slash commands
export interface CommandArg {
  name: string;
  required?: boolean;
  description?: string;
}

export interface Command {
  name: string; // Command identifier (e.g., "compact")
  description?: string; // Human-readable description
  args?: CommandArg[]; // Optional argument definitions
}

// Todo types for task panel
export interface Todo {
  id: string;
  content: string;
  state?: "pending" | "in_progress" | "completed";
}

// PyWebView injects the `pywebview` object into the window
declare global {
  interface Window {
    pywebview?: {
      api: MarsApiInterface;
    };
  }
}

interface MarsApiInterface {
  // Server Management
  start_server(): Promise<ApiResponse<boolean>>;
  stop_server(): Promise<ApiResponse<boolean>>;
  is_server_running(): Promise<boolean>;
  check_status(): Promise<ApiResponse<boolean>>;

  // Session Management
  create_session(
    title?: string,
    parent_id?: string,
  ): Promise<ApiResponse<Session>>;
  list_sessions(): Promise<ApiResponse<Session[]>>;
  get_session(session_id: string): Promise<ApiResponse<Session>>;
  delete_session(session_id: string): Promise<ApiResponse<boolean>>;
  set_current_session(session_id: string): Promise<void>;
  get_current_session_id(): Promise<string | null>;

  // Messages
  send_message(
    content: string,
    session_id?: string,
    model?: string | Record<string, unknown>,
    agent?: string,
  ): Promise<ApiResponse<Message>>;
  stream_message(
    session_id: string,
    content: string,
    model?: Record<string, unknown>,
    agent?: string,
  ): Promise<ApiResponse<boolean>>;
  list_messages(
    session_id?: string,
    limit?: number,
  ): Promise<ApiResponse<Message[]>>;
  abort_session(session_id?: string): Promise<ApiResponse<boolean>>;

  // Config & Info
  get_config(): Promise<ApiResponse<unknown>>;
  get_providers(): Promise<ApiResponse<unknown>>;
  list_agents(): Promise<ApiResponse<unknown[]>>;
  get_current_project(): Promise<ApiResponse<Project>>;

  // Commands
  list_commands(): Promise<ApiResponse<unknown[]>>;
  execute_command(
    command: string,
    args?: Record<string, unknown>,
    session_id?: string,
  ): Promise<ApiResponse<unknown>>;

  // Files
  search_files(query: string): Promise<ApiResponse<string[]>>;
  list_files(path?: string): Promise<ApiResponse<FileEntry[]>>;
  read_file(path: string): Promise<ApiResponse<string>>;

  save_settings(
    settings: Record<string, unknown>,
  ): Promise<ApiResponse<boolean>>;
  load_settings(): Promise<ApiResponse<Record<string, unknown>>>;

  // Todos
  list_todos(session_id?: string): Promise<ApiResponse<unknown[]>>;

  // Editor
  open_in_editor(path?: string): Promise<ApiResponse<boolean>>;
}

/**
 * Check if running inside PyWebView
 */
export function isPyWebView(): boolean {
  return typeof window.pywebview !== "undefined";
}

/**
 * Wait for PyWebView to be ready
 */
export function waitForPyWebView(): Promise<boolean> {
  return new Promise((resolve) => {
    // If already available, resolve immediately
    if (isPyWebView()) {
      console.log("PyWebView already available");
      resolve(true);
      return;
    }

    // Wait for pywebviewready event
    console.log("Waiting for pywebviewready event...");
    const handleReady = () => {
      console.log("PyWebView ready event fired!");
      window.removeEventListener("pywebviewready", handleReady);
      resolve(true);
    };
    window.addEventListener("pywebviewready", handleReady);

    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener("pywebviewready", handleReady);
      console.log("PyWebView timeout - running in browser mode");
      resolve(false);
    }, 5000);
  });
}

/**
 * Get the PyWebView API, or throw if not available
 */
function getApi(): MarsApiInterface {
  if (!window.pywebview?.api) {
    throw new Error("PyWebView API not available. Running in browser mode.");
  }
  return window.pywebview.api;
}

// --- Helper for handling Python -> JS events ---
export function onEvent(
  eventName: string,
  callback: (event: CustomEvent) => void,
) {
  const handler = (e: Event) => callback(e as CustomEvent);
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}

// OpenCode server port (same as backend config)
const OPENCODE_PORT = 4096;

/**
 * Connect directly to OpenCode SSE event stream using browser's native EventSource.
 * This bypasses pywebview's evaluate_js which causes buffering.
 * Returns a cleanup function to close the connection.
 */
export function connectToEventStream(
  onEvent: (payload: unknown) => void,
): () => void {
  const url = `http://127.0.0.1:${OPENCODE_PORT}/global/event`;

  console.log("Connecting to SSE stream:", url);
  const eventSource = new EventSource(url);

  eventSource.onopen = () => {
    console.log("SSE connection opened");
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // The useful part is usually in 'payload'
      if (data.payload) {
        onEvent(data.payload);
      } else {
        onEvent(data);
      }
    } catch (e) {
      console.error("Failed to parse SSE event:", e);
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE connection error:", error);
    // EventSource will automatically try to reconnect
  };

  // Return cleanup function
  return () => {
    console.log("Closing SSE connection");
    eventSource.close();
  };
}

// === Server Management ===

export async function checkServerStatus(): Promise<boolean> {
  if (!isPyWebView()) return false;
  const result = await getApi().check_status();
  return result.success;
}

export async function startServer(): Promise<boolean> {
  if (!isPyWebView()) return false;
  const result = await getApi().start_server();
  return result.success;
}

export async function stopServer(): Promise<boolean> {
  if (!isPyWebView()) return false;
  const result = await getApi().stop_server();
  return result.success;
}

export async function isServerRunning(): Promise<boolean> {
  if (!isPyWebView()) return false;
  return getApi().is_server_running();
}

// === Session Management ===

export async function createSession(
  title?: string,
  parentId?: string,
): Promise<Session | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().create_session(
    title || undefined,
    parentId || undefined,
  );
  return result.success ? (result.session as Session) : null;
}

export async function listSessions(): Promise<Session[]> {
  if (!isPyWebView()) return [];
  const result = await getApi().list_sessions();
  return result.success && Array.isArray(result.sessions)
    ? result.sessions
    : [];
}

export async function getSession(sessionId: string): Promise<Session | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().get_session(sessionId);
  if (result.success && result.session) {
    return result.session as Session;
  }
  return null;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  if (!isPyWebView()) return false;
  const result = await getApi().delete_session(sessionId);
  return result.success;
}

export async function setCurrentSession(sessionId: string): Promise<void> {
  if (!isPyWebView()) return;
  await getApi().set_current_session(sessionId);
}

export async function getCurrentSessionId(): Promise<string | null> {
  if (!isPyWebView()) return null;
  return getApi().get_current_session_id();
}

// === Messages ===

export async function sendMessage(
  sessionId: string,
  content: string,
  model?: Record<string, unknown>,
): Promise<Message | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().send_message(sessionId, content, model);
  return result.success ? (result.message as Message) : null;
}

export async function streamMessage(
  sessionId: string,
  content: string,
  model?: Record<string, unknown>,
  agent?: string,
): Promise<boolean> {
  if (!isPyWebView()) return false;
  const result = await getApi().stream_message(
    sessionId,
    content,
    model,
    agent,
  );
  return result.success;
}

export async function listMessages(
  sessionId?: string,
  limit?: number,
): Promise<Message[]> {
  if (!isPyWebView()) return [];
  const result = await getApi().list_messages(sessionId, limit);
  return (result.messages as Message[]) || [];
}

export async function abortSession(sessionId?: string): Promise<boolean> {
  if (!isPyWebView()) return false;
  const result = await getApi().abort_session(sessionId);
  return result.success;
}

// === Config & Info ===

export async function getConfig(): Promise<unknown | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().get_config();
  return result.success ? result.config : null;
}

export async function getProviders(): Promise<ProvidersResponse | null> {
  if (!isPyWebView()) {
    // Mock providers for browser development
    return {
      all: [
        {
          id: "anthropic",
          name: "Anthropic",
          models: [
            { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
            { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
          ],
        },
        {
          id: "openai",
          name: "OpenAI",
          models: [
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini" },
          ],
        },
      ],
      connected: ["anthropic"],
      default: { anthropic: "claude-sonnet-4-20250514" },
    };
  }
  const result = await getApi().get_providers();
  return result.success ? (result.providers as ProvidersResponse) : null;
}

export async function listAgents(): Promise<Agent[]> {
  if (!isPyWebView()) {
    return [
      { name: "default", description: "Default agent" },
      { name: "coder", description: "Coding specialist" },
    ];
  }
  const result = await getApi().list_agents();
  return (result.agents as Agent[]) || [];
}

export async function getCurrentProject(): Promise<Project | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().get_current_project();
  if (result.success && result.project) {
    return result.project as Project;
  }
  return null;
}

// === Commands ===

export async function listCommands(): Promise<Command[]> {
  if (!isPyWebView()) {
    // Mock commands for browser development
    return [
      {
        name: "compact",
        description: "Summarize and compact the conversation",
      },
      { name: "clear", description: "Clear the current session" },
      { name: "bug", description: "Report a bug or issue" },
      { name: "help", description: "Show available commands" },
      { name: "url", description: "Fetch and process a URL" },
      { name: "init", description: "Initialize AGENTS.md" },
    ];
  }
  const result = await getApi().list_commands();
  return (result.commands as Command[]) || [];
}

export async function executeCommand(
  command: string,
  args?: Record<string, unknown>,
  sessionId?: string,
): Promise<unknown | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().execute_command(command, args, sessionId);
  return result.success ? result.result : null;
}

// === Todos ===

export async function listTodos(sessionId: string): Promise<Todo[]> {
  if (!isPyWebView()) {
    // Mock todos for browser development
    return [
      {
        id: "1",
        content: "Review the implementation plan",
        state: "completed",
      },
      { id: "2", content: "Add task panel component", state: "in_progress" },
      { id: "3", content: "Test with OpenCode server", state: "pending" },
    ];
  }
  const result = await getApi().list_todos(sessionId);
  return (result.todos as Todo[]) || [];
}

// === Files ===

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export async function searchFiles(query: string): Promise<string[]> {
  if (!isPyWebView()) return [];
  const result = await getApi().search_files(query);
  return (result.files as string[]) || [];
}

export async function listFiles(
  path: string = ".",
): Promise<{ files: FileEntry[]; root: string }> {
  if (!isPyWebView()) {
    // Mock for browser
    if (path === ".") {
      return {
        files: [
          { name: "src", path: "/mock/src", isDirectory: true },
          { name: "public", path: "/mock/public", isDirectory: true },
          {
            name: "package.json",
            path: "/mock/package.json",
            isDirectory: false,
          },
        ],
        root: "/mock/mars",
      };
    }
    return { files: [], root: "/mock/mars" };
  }
  const result = await getApi().list_files(path);
  return {
    files: (result.files as FileEntry[]) || [],
    root: (result.root as string) || "",
  };
}

export async function readFile(path: string): Promise<string | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().read_file(path);
  return result.success ? (result.content as string) : null;
}

// === Settings ===

export async function saveSettings(
  settings: Record<string, unknown>,
): Promise<boolean> {
  if (!isPyWebView()) return false;
  const result = await getApi().save_settings(settings);
  return result.success;
}

export async function loadSettings(): Promise<Record<string, unknown>> {
  if (!isPyWebView()) return {};
  const result = await getApi().load_settings();
  return result.success ? (result.settings as Record<string, unknown>) : {};
}

// === Editor ===

export async function openInEditor(path?: string): Promise<boolean> {
  if (!isPyWebView()) {
    console.log("openInEditor: Running in browser mode, cannot open editor");
    return false;
  }
  const result = await getApi().open_in_editor(path);
  if (!result.success && result.error) {
    console.error("Failed to open in editor:", result.error);
  }
  return result.success;
}
