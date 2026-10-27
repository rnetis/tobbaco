"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Lang, translate, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "inventory-app-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  // Sync language with external systems (localStorage + document element)
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
    if (saved === "fa" || saved === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating persisted preference from external store
      setLangState(saved);
    } else if (typeof navigator !== "undefined" && navigator.language?.startsWith("fa")) {
      setLangState("fa");
    }
    setMounted(true);
  }, []);

  const dir: "ltr" | "rtl" = lang === "fa" ? "rtl" : "ltr";

  // Apply dir/lang to <html> and update localStorage
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang, dir, mounted]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((prev) => (prev === "en" ? "fa" : "en")), []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
