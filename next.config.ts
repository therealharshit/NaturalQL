import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pgsql-parser", "libpg-query", "better-sqlite3", "mysql2", "pg"],
};

export default nextConfig;
