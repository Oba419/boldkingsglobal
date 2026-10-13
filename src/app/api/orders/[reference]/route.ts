import { NextResponse } from "next/server";
import { Errors, ok, route } from "@/server/http";
import { getCurrentUser } from "@/server/auth/session";
import { getOrderForViewer } from "@/server/services/orders";

export const dynamic = "force-dynamic";

/** GET /api/orders/:reference?token=… — requires the access token, the owning account, or an admin. */
export const GET = route<{ params: Promise<{ reference: string }> }>(async (req, { params }) => {
  const { reference } = await params;
  const token = new URL(req.url).searchParams.get("token");
  const order = await getOrderForViewer(reference, token, await getCurrentUser());
  if (!order) throw Errors.notFound("Order not found");
  const res = ok(order);
  res.headers.set("Cache-Control", "private, no-store");
  return res as NextResponse;
});
