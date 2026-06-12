import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Para migrations no Supabase, use a connection string do session pooler (porta 5432)
    // ou a direct connection. Troque para DIRECT_URL ao rodar migrations.
    url: process.env["DATABASE_URL"],
  },
});
