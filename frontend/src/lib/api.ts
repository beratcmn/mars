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
    createdAt: string;
  };
  parts: Array<{
    type: string;
    text?: string;
  }>;
}

interface Project {
  name: string;
  path: string;
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

  // Session Management
  create_session(title?: string): Promise<ApiResponse<Session>>;
  list_sessions(): Promise<ApiResponse<Session[]>>;
  get_session(session_id: string): Promise<ApiResponse<Session>>;
  delete_session(session_id: string): Promise<ApiResponse<boolean>>;
  set_current_session(session_id: string): Promise<void>;
  get_current_session_id(): Promise<string | null>;

  // Messages
  send_message(
    content: string,
    session_id?: string,
    model?: string,
    agent?: string,
  ): Promise<ApiResponse<Message>>;
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
}

/**
 * Check if running inside PyWebView
 */
export function isPyWebView(): boolean {
  return typeof window.pywebview !== "undefined";
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

// === Server Management ===

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

export async function createSession(title?: string): Promise<Session | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().create_session(title);
  if (result.success && result.session) {
    return result.session as Session;
  }
  return null;
}

export async function listSessions(): Promise<Session[]> {
  if (!isPyWebView()) return [];
  const result = await getApi().list_sessions();
  return (result.sessions as Session[]) || [];
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
  content: string,
  options?: {
    sessionId?: string;
    model?: string;
    agent?: string;
  },
): Promise<{ response: Message | null; sessionId: string | null }> {
  if (!isPyWebView()) {
    // Mock response for browser development
    return {
      response: null,
      sessionId: null,
    };
  }

  const result = await getApi().send_message(
    content,
    options?.sessionId,
    options?.model,
    options?.agent,
  );

  return {
    response: result.success ? (result.response as Message) : null,
    sessionId: result.sessionId as string | null,
  };
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

export async function getProviders(): Promise<unknown | null> {
  if (!isPyWebView()) return null;
  const result = await getApi().get_providers();
  return result.success ? result.providers : null;
}

export async function listAgents(): Promise<unknown[]> {
  if (!isPyWebView()) return [];
  const result = await getApi().list_agents();
  return (result.agents as unknown[]) || [];
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

export async function listCommands(): Promise<unknown[]> {
  if (!isPyWebView()) return [];
  const result = await getApi().list_commands();
  return (result.commands as unknown[]) || [];
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
