/**
 * Browser-side helper for the JSON API. Every route responds with
 * { ok: true, data } or { ok: false, error: { code, message, details } }.
 */

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields: Record<string, string[] | undefined> = {},
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function api<T>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const hasBody = opts.body !== undefined;
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (hasBody ? "POST" : "GET"),
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(0, "NETWORK", "We couldn't reach the server. Check your connection and try again.");
  }
  const json = (await res.json().catch(() => null)) as
    | { ok: true; data: T }
    | { ok: false; error?: { code?: string; message?: string; details?: { fields?: Record<string, string[]> } & Record<string, unknown> } }
    | null;
  if (!json || json.ok !== true) {
    const e = json && json.ok === false ? json.error : undefined;
    throw new ApiClientError(
      res.status,
      e?.code ?? "UNKNOWN",
      e?.message ?? "Something went wrong. Please try again.",
      e?.details?.fields ?? {},
      e?.details,
    );
  }
  return json.data;
}

/** Copies server-side field errors onto a react-hook-form instance. Returns true if any were applied. */
export function applyFieldErrors(err: unknown, setError: (name: never, error: { message: string }) => void): boolean {
  if (!(err instanceof ApiClientError)) return false;
  let applied = false;
  for (const [name, messages] of Object.entries(err.fields)) {
    if (messages?.length) {
      setError(name as never, { message: messages[0]! });
      applied = true;
    }
  }
  return applied;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}
