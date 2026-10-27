"use client";

import { useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  const { t } = useLanguage();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(() => typeof window !== "undefined" && !navigator.onLine);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }

    // Capture install prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      toast.success(t("installed"));
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Online/offline detection
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline(false);
      toast.success(t("backOnline"));
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [t]);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstallEvent(null);
  };

  return (
    <>
      {installEvent && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstall}
          className="gap-1.5 h-9"
          aria-label={t("installApp")}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t("installApp")}</span>
        </Button>
      )}
      {offline && (
        <div
          role="status"
          className="fixed bottom-20 sm:bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
            <WifiOff className="h-4 w-4" />
            {t("offline")}
          </div>
        </div>
      )}
    </>
  );
}
