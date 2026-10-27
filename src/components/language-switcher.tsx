"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";

export function LanguageSwitcher() {
  const { lang, toggleLang } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLang}
      className="gap-1.5 h-9 min-w-[64px] font-semibold"
      aria-label={lang === "en" ? "Switch to Persian" : "تغییر به انگلیسی"}
      title={lang === "en" ? "فارسی" : "English"}
    >
      <Languages className="h-4 w-4" />
      {lang === "en" ? "فارسی" : "English"}
    </Button>
  );
}
