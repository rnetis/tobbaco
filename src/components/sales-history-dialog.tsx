"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/i18n";
import { Receipt } from "lucide-react";
import type { Sale } from "@/lib/types";

type SalesHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SalesHistoryDialog({ open, onOpenChange }: SalesHistoryDialogProps) {
  const { t, lang } = useLanguage();

  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["sales"],
    queryFn: async () => {
      const res = await fetch("/api/sales?limit=100");
      if (!res.ok) throw new Error("Failed to fetch sales");
      return res.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir={undefined}>
        <DialogHeader>
          <DialogTitle>{t("salesHistory")}</DialogTitle>
          <DialogDescription className="sr-only">{t("salesHistory")}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-1 px-1">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !sales || sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">{t("noSales")}</p>
            </div>
          ) : (
            <ul className="space-y-2 py-1">
              {sales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{sale.product?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(sale.quantity, lang)} × {formatMoney(sale.unitPrice, lang)} ·{" "}
                      {formatDateTime(sale.createdAt, lang)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0 text-emerald-600 dark:text-emerald-400">
                    {formatMoney(sale.total, lang)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
