import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI commands (migrations) prefer a direct, non-pooled connection when one
    // is provided. A placeholder keeps `prisma generate` working before .env
    // exists; commands that touch the database require a real URL.
    url:
      process.env.DIRECT_DATABASE_URL ||
      // Name used by the Neon integration on Vercel.
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
