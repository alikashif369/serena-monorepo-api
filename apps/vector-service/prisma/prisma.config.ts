import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "vector/schema.prisma",
  migrations: {
    path: "vector/migrations",
  },
  datasource: {
    url: env("DATABASE_URL_VECTOR"),
  },
});
