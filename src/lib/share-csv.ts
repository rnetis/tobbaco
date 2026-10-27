import { getInventoryCsv } from "@/lib/device-db";

/**
 * Export the inventory when there is no server to hit.
 * - Native APK  → Android share sheet (save to Files, send to Drive, email…)
 * - Browser     → plain CSV download
 */
export async function shareInventoryCsv(): Promise<void> {
  const csv = getInventoryCsv();
  const filename = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: filename, text: csv });
      return;
    }
  } catch (error) {
    console.warn("Native share unavailable, falling back to download:", error);
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
