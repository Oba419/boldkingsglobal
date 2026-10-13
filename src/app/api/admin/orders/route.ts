import { ok, route } from "@/server/http";
import { requireAdminApi } from "@/server/auth/session";
import { listOrdersAdmin } from "@/server/services/admin-orders";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireAdminApi();
  const url = new URL(req.url);
  return ok(
    await listOrdersAdmin({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1) || 1,
    }),
  );
});
