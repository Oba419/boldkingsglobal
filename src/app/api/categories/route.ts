import { ok, route } from "@/server/http";
import { listCategories } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export const GET = route(async () => ok(await listCategories()));
