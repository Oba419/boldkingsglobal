// Vercel build: apply database migrations when a database is configured, then build.
//
// Without DATABASE_URL the migrations are skipped (with a warning) so the site
// still builds; set the variable in Vercel and redeploy to create the tables.
// Migrations use DIRECT_DATABASE_URL (or Neon's DATABASE_URL_UNPOOLED) when set — pooled connection strings
// (PgBouncer, Neon "-pooler" hosts) are unreliable for schema changes.
import { spawnSync } from "node:child_process";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL_UNPOOLED) {
  console.log("▶ Applying database migrations…");
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.warn(
    "\n⚠ DATABASE_URL is not set — skipping database migrations.\n" +
      "  The site will build, but pages need a database to work. Add DATABASE_URL\n" +
      "  (and DIRECT_DATABASE_URL for pooled databases) in Vercel → Settings →\n" +
      "  Environment Variables, then redeploy.\n",
  );
}

console.log("▶ Building Next.js…");
run("npx", ["next", "build"]);
