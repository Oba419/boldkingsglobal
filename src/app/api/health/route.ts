import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { envProblems } from "@/server/env";

export const dynamic = "force-dynamic";

/**
 * Health check. When unhealthy it says why, so deployment problems can be
 * diagnosed without server logs: either the names of misconfigured
 * environment variables (never their values), or that the database could not
 * be reached.
 */
export async function GET() {
  const problems = envProblems();
  if (Object.keys(problems).length) {
    return NextResponse.json(
      { ok: false, problem: "configuration", environmentVariables: problems, hint: "Set these in your hosting settings (without quotes), then redeploy." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "up" }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[health] database check failed", err);
    return NextResponse.json(
      { ok: false, problem: "database", database: "down", hint: "Check DATABASE_URL points at a reachable database." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
