import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pgsql-parser", "libpg-query"],
};

export default nextConfig;
