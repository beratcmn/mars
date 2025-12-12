type ProviderErrorInfo = {
  code?: number | string;
  status?: string;
  message?: string;
  model?: string;
  quotaResetDelaySeconds?: number;
  retryDelaySeconds?: number;
};

function parseHumanDurationToSeconds(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const text = value.trim();
  if (!text) return undefined;

  // "409.617143626s"
  const secondsOnly = text.match(/^(\d+(?:\.\d+)?)s$/);
  if (secondsOnly) return Number(secondsOnly[1]);

  // "6m49.617143626s", "1h2m3s"
  let total = 0;
  const re = /(\d+(?:\.\d+)?)([hms])/g;
  let matched = false;
  for (const match of text.matchAll(re)) {
    matched = true;
    const amount = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(amount)) continue;
    if (unit === "h") total += amount * 3600;
    if (unit === "m") total += amount * 60;
    if (unit === "s") total += amount;
  }
  return matched ? total : undefined;
}

function formatCompactDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "soon";

  const whole = Math.round(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;

  if (h > 0) return `${h}h${m}m${s}s`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}

function tryParseJsonPayloadFromText(text: string): unknown | undefined {
  const start = Math.min(
    ...["[", "{"].map((ch) => text.indexOf(ch)).filter((idx) => idx >= 0),
  );
  if (!Number.isFinite(start)) return undefined;

  const tail = text
    .slice(start)
    .trim()
    .replace(/['"]+$/, "");

  const endBracket = tail.lastIndexOf("]");
  const endBrace = tail.lastIndexOf("}");
  const end =
    endBracket >= 0 ? endBracket + 1 : endBrace >= 0 ? endBrace + 1 : -1;
  if (end <= 0) return undefined;

  const candidate = tail.slice(0, end);
  try {
    return JSON.parse(candidate);
  } catch {
    return undefined;
  }
}

function extractProviderErrorInfoFromPayload(
  payload: unknown,
): ProviderErrorInfo {
  const root =
    Array.isArray(payload) && payload.length > 0 ? payload[0] : payload;
  if (!root || typeof root !== "object") return {};

  const error = (root as Record<string, unknown>).error;
  if (!error || typeof error !== "object") return {};

  const errorObj = error as Record<string, unknown>;
  const details = Array.isArray(errorObj.details) ? errorObj.details : [];

  let model: string | undefined;
  let quotaResetDelaySeconds: number | undefined;
  let retryDelaySeconds: number | undefined;

  for (const entry of details) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    const type = rec["@type"];
    if (type === "type.googleapis.com/google.rpc.ErrorInfo") {
      const metadata = rec.metadata;
      if (metadata && typeof metadata === "object") {
        const meta = metadata as Record<string, unknown>;
        if (typeof meta.model === "string") model = meta.model;
        quotaResetDelaySeconds = parseHumanDurationToSeconds(
          meta.quotaResetDelay,
        );
      }
    }
    if (type === "type.googleapis.com/google.rpc.RetryInfo") {
      retryDelaySeconds = parseHumanDurationToSeconds(rec.retryDelay);
    }
  }

  return {
    code: errorObj.code as number | string | undefined,
    status: errorObj.status as string | undefined,
    message: errorObj.message as string | undefined,
    model,
    quotaResetDelaySeconds,
    retryDelaySeconds,
  };
}

export type SessionStatusNotice = {
  toolStateStatus: "pending" | "running" | "completed" | "error";
  output: string;
  input: Record<string, unknown>;
};

export function buildSessionStatusNotice(
  status: unknown,
  nowMs: number = Date.now(),
): SessionStatusNotice | undefined {
  if (!status || typeof status !== "object") return undefined;

  const s = status as Record<string, unknown>;
  const type = typeof s.type === "string" ? s.type : "unknown";
  const attempt = typeof s.attempt === "number" ? s.attempt : undefined;
  const message = typeof s.message === "string" ? s.message : "";
  const next = typeof s.next === "number" ? s.next : undefined;

  const parsedPayload = message
    ? tryParseJsonPayloadFromText(message)
    : undefined;
  const providerError = parsedPayload
    ? extractProviderErrorInfoFromPayload(parsedPayload)
    : {};

  const isRateLimit =
    message.toLowerCase().includes("too many requests") ||
    providerError.code === 429 ||
    providerError.status === "RESOURCE_EXHAUSTED" ||
    message.toLowerCase().includes("ratelimit") ||
    message.toLowerCase().includes("rate limit");

  const retryInSeconds =
    providerError.retryDelaySeconds ??
    (next ? Math.max(0, (next - nowMs) / 1000) : undefined);

  const quotaResetInSeconds = providerError.quotaResetDelaySeconds;

  const toolStateStatus: SessionStatusNotice["toolStateStatus"] =
    type === "retry" ? "running" : type === "error" ? "error" : "completed";

  const compactBaseMessage = message
    ? message
        .split("\n")
        .find((line) => line.trim())
        ?.trim() || message.trim()
    : "Status update";

  const output = isRateLimit
    ? `Rate limited${providerError.model ? ` (${providerError.model})` : ""} — ${
        quotaResetInSeconds
          ? `quota resets in ${formatCompactDuration(quotaResetInSeconds)}`
          : retryInSeconds
            ? `retrying in ${formatCompactDuration(retryInSeconds)}`
            : "retrying soon"
      }.`
    : type === "retry" && retryInSeconds
      ? `Retrying in ${formatCompactDuration(retryInSeconds)}.`
      : compactBaseMessage;

  return {
    toolStateStatus,
    output,
    input: {
      kind: isRateLimit ? "rate_limit" : "status",
      type,
      attempt,
      retryInSeconds,
      next,
      providerError: parsedPayload ? providerError : undefined,
      rawMessage: message || undefined,
    },
  };
}
