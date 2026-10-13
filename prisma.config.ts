import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveMigrationUrl } from "./src/lib/env-normalize";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI commands (migrations) prefer a direct, non-pooled connection
    // (DIRECT_DATABASE_URL, or the names Neon/Vercel set), and tolerate stray
    // quotes. A placeholder keeps `prisma generate` working before .env
    // exists; commands that touch the database require a real URL.
    url: resolveMigrationUrl(process.env) ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
