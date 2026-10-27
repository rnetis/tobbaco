"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, Coins, ShoppingCart, TrendingUp, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { apiFetch } from "@/lib/api-client";
import { formatMoney, formatNumber } from "@/lib/i18n";

type Stats = {
  totalProducts: number;
  totalStock: number;
  totalSold: number;
  stockValue: number;
  revenue: number;
  lowStockCount: number;
  todayRevenue: number;
};

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await apiFetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

export function StatsCards() {
  const { t, lang } = useLanguage();
  const { data, isLoading } = useStats();

  const cards = [
    {
      label: t("statProducts"),
      value: data ? formatNumber(data.totalProducts, lang) : "—",
      sub: data ? `${formatNumber(data.totalStock, lang)} ${t("units")}` : "",
      icon: Boxes,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950",
    },
    {
      label: t("statStockValue"),
      value: data ? formatMoney(data.stockValue, lang) : "—",
      icon: Coins,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-950",
    },
    {
      label: t("statUnitsSold"),
      value: data ? formatNumber(data.totalSold, lang) : "—",
      icon: ShoppingCart,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-100 dark:bg-sky-950",
    },
    {
      label: t("statRevenue"),
      value: data ? formatMoney(data.revenue, lang) : "—",
      sub: data && data.todayRevenue > 0 ? `+${formatMoney(data.todayRevenue, lang)}` : "",
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-950",
    },
  ];

  return (
    <section aria-label={t("statProducts")} className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Card key={card.label} className="border shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{card.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-lg sm:text-2xl font-bold tabular-nums leading-tight mt-0.5">
                      {card.value}
                    </p>
                  )}
                  {card.sub && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                  )}
                </div>
                <div className={`rounded-lg p-2 ${card.bg} shrink-0`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {data && data.lowStockCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("lowStockWarning", { count: data.lowStockCount })}
        </div>
      )}
    </section>
  );
}
