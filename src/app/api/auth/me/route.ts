import { ok, route } from "@/server/http";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await getCurrentUser();
  const res = ok({ user: user ? { name: user.name, email: user.email, role: user.role } : null });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
});
