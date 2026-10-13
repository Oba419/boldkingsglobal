import "server-only";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getServerEnv } from "./env";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INSUFFICIENT_STOCK"
  | "RATE_LIMITED"
  | "PAYMENT_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const Errors = {
  badRequest: (message = "Bad request", details?: unknown) => new ApiError(400, "BAD_REQUEST", message, details),
  unauthenticated: (message = "Please sign in to continue") => new ApiError(401, "UNAUTHENTICATED", message),
  forbidden: (message = "You do not have permission to do that") => new ApiError(403, "FORBIDDEN", message),
  notFound: (message = "Not found") => new ApiError(404, "NOT_FOUND", message),
  conflict: (message: string, details?: unknown) => new ApiError(409, "CONFLICT", message, details),
  insufficientStock: (message: string, details?: unknown) => new ApiError(409, "INSUFFICIENT_STOCK", message, details),
  rateLimited: (retryAfter: number) =>
    new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.", { retryAfter }),
  validation: (message: string, fields?: Record<string, string[]>) => new ApiError(422, "VALIDATION_ERROR", message, { fields }),
};

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: ApiErrorCode; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    const headers: Record<string, string> = {};
    if (err.code === "RATE_LIMITED") {
      const retry = (err.details as { retryAfter?: number } | undefined)?.retryAfter;
      if (retry) headers["Retry-After"] = String(retry);
    }
    return NextResponse.json<ApiFailure>(
      { ok: false, error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status, headers },
    );
  }
  if (err instanceof ZodError) {
    const flat = z.flattenError(err);
    return NextResponse.json<ApiFailure>(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: flat.formErrors[0] ?? "Some fields are invalid. Please check and try again.",
          details: { fields: flat.fieldErrors },
        },
      },
      { status: 422 },
    );
  }
  if (isUniqueConstraintError(err)) {
    const target = (err as { meta?: { target?: unknown } }).meta?.target;
    return NextResponse.json<ApiFailure>(
      { ok: false, error: { code: "CONFLICT", message: "A record with the same unique value already exists.", details: { target } } },
      { status: 409 },
    );
  }
  // Never leak internals to the client.
  console.error("[api] Unexpected error:", err);
  return NextResponse.json<ApiFailure>(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." } },
    { status: 500 },
  );
}

export function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with consistent error handling. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Parses a JSON body, rejecting malformed or oversized payloads. */
export async function readJson(req: Request, maxBytes = 100_000): Promise<unknown> {
  const length = Number(req.headers.get("content-length") ?? "0");
  if (length > maxBytes) throw Errors.badRequest("Request body too large");
  const text = await req.text();
  if (text.length > maxBytes) throw Errors.badRequest("Request body too large");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw Errors.badRequest("Request body must be valid JSON");
  }
}

/**
 * CSRF defence for cookie-authenticated state-changing requests: browsers
 * always send Origin on cross-site POST/PUT/PATCH/DELETE, so any Origin that
 * does not match this site is rejected. (Session cookies are also SameSite=Lax.)
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Non-browser clients (no Origin) cannot ride a victim's cookies, but a
    // browser that reports a cross-site fetch without Origin is rejected.
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") throw Errors.forbidden("Cross-site request rejected");
    return;
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw Errors.forbidden("Invalid origin");
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const appHost = new URL(getServerEnv().APP_URL).host;
  if (originHost !== host && originHost !== appHost) throw Errors.forbidden("Cross-site request rejected");
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
