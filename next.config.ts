import type { NextConfig } from "next";

/**
 * Two build targets:
 *  - default              → output:"standalone" Node server (web deployment, Prisma/SQLite API)
 *  - NEXT_OUTPUT=export   → fully static bundle copied into the Android/Capacitor APK.
 *    For the APK the API routes are excluded (pageExtensions only matches .tsx) because
 *    the app reads/writes device storage instead — see src/lib/api-client.ts.
 */
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  ...(isStaticExport ? { pageExtensions: ["tsx"] } : {}),
};

export default nextConfig;
