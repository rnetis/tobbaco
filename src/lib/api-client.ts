import { Capacitor } from "@capacitor/core";
import { handleLocalRequest } from "@/lib/device-db";

/**
 * Single entry point for every API call.
 *
 * Web build  → plain fetch to the Next.js API routes (Prisma/SQLite).
 * APK build  → local device storage, no server needed.
 *
 * `NEXT_PUBLIC_OFFLINE=1` forces the local adapter in a normal browser,
 * which is how the offline path is verified during development.
 */
export function isOfflineMode(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_OFFLINE === "1") return true;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (isOfflineMode() && url.startsWith("/")) {
    return handleLocalRequest(url, init);
  }

  return fetch(input, init);
}
