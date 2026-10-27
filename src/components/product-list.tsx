"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { formatMoney, formatNumber } from "@/lib/i18n";
import { LOW_STOCK_THRESHOLD, type Product } from "@/lib/types";
import { toast } from "sonner";
import {
  MoreHorizontal,
  MoreVertical,
  PackageOpen,
  Pencil,
  PlusCircle,
  ShoppingCart,
  Trash2,
} from "lucide-react";

type ProductListProps = {
  products: Product[] | undefined;
  isLoading: boolean;
  onSell: (p: Product) => void;
  onEdit: (p: Product) => void;
  onRestock: (p: Product) => void;
};

export function ProductList({ products, isLoading, onSell, onEdit, onRestock }: ProductListProps) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success(t("productDeleted"));
      setDeleteTarget(null);
    },
    onError: () => toast.error(t("error")),
  });

  const stockBadge = (p: Product) => {
    if (p.amount <= 0) return <Badge variant="destructive">{t("outOfStock")}</Badge>;
    if (p.amount <= LOW_STOCK_THRESHOLD) return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">{t("lowStock")}</Badge>;
    return <Badge variant="secondary">{t("inStock")}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 px-6 text-center">
        <PackageOpen className="h-12 w-12 text-muted-foreground/40 mb-3" aria-hidden="true" />
        <p className="font-semibold">{t("emptyTitle")}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t("emptyDesc")}</p>
      </div>
    );
  }

  const actionButtons = (p: Product, iconOnly: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label={t("edit")}>
          {iconOnly ? <MoreVertical className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(p)}>
          <Pencil className="h-4 w-4" /> {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRestock(p)}>
          <PlusCircle className="h-4 w-4" /> {t("restock")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(p)}>
          <Trash2 className="h-4 w-4" /> {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Mobile: cards */}
      <ul className="space-y-3 md:hidden" role="list">
        {products.map((p) => (
          <li key={p.id}>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base leading-tight">{p.name}</h3>
                      {stockBadge(p)}
                    </div>
                    <dl className="grid grid-cols-3 gap-2 mt-3 text-sm">
                      <div>
                        <dt className="text-[11px] text-muted-foreground">{t("price")}</dt>
                        <dd className="font-semibold tabular-nums">{formatMoney(p.price, lang)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">{t("amount")}</dt>
                        <dd className="font-semibold tabular-nums">{formatNumber(p.amount, lang)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">{t("amountSold")}</dt>
                        <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatNumber(p.amountSold, lang)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  {actionButtons(p, true)}
                </div>
                <Button
                  size="sm"
                  className="w-full h-10 mt-3 gap-1.5 font-semibold"
                  disabled={p.amount <= 0}
                  onClick={() => onSell(p)}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  {t("sell")}
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="text-start font-medium px-4 py-3">{t("name")}</th>
              <th className="text-end font-medium px-4 py-3">{t("price")}</th>
              <th className="text-end font-medium px-4 py-3">{t("amount")}</th>
              <th className="text-end font-medium px-4 py-3">{t("amountSold")}</th>
              <th className="text-end font-medium px-4 py-3 w-44"><span className="sr-only">{t("edit")}</span></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {stockBadge(p)}
                  </div>
                </td>
                <td className="px-4 py-3 text-end tabular-nums font-semibold">{formatMoney(p.price, lang)}</td>
                <td className="px-4 py-3 text-end tabular-nums">{formatNumber(p.amount, lang)}</td>
                <td className="px-4 py-3 text-end tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatNumber(p.amountSold, lang)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      className="h-8 gap-1.5"
                      disabled={p.amount <= 0}
                      onClick={() => onSell(p)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("sell")}
                    </Button>
                    {actionButtons(p, false)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir={undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDesc")}
              {deleteTarget && <span className="block mt-2 font-semibold">{deleteTarget.name}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-11 flex-1 sm:flex-none">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 flex-1 sm:flex-none bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
