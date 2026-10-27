"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/language-context";
import { formatMoney, formatNumber } from "@/lib/i18n";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";

type SellDialogProps = {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
};

export function SellDialog({ product, onOpenChange }: SellDialogProps) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  // Fresh mount per product (keyed by parent) — reset quantity to 1
  const [qty, setQty] = useState("1");

  const quantity = Math.max(0, parseInt(qty, 10) || 0);
  const maxQty = product?.amount ?? 0;
  const total = (product?.price ?? 0) * quantity;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product!.id, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || "failed"), { available: data.available });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success(t("saleRecorded"));
      onOpenChange(false);
    },
    onError: (err: Error & { available?: number }) => {
      if (err.message.includes("Insufficient stock")) {
        toast.error(t("notEnoughStock", { available: formatNumber(err.available ?? 0, lang) }));
      } else {
        toast.error(t("error"));
      }
    },
  });

  if (!product) return null;

  const setQuick = (n: number) => setQty(String(Math.min(n, maxQty)));

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            {t("sell")} — {product.name}
          </DialogTitle>
          <DialogDescription>
            {t("availableStock")}: {formatNumber(product.amount, lang)} {t("units")} · {t("price")}:{" "}
            {formatMoney(product.price, lang)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sell-qty">{t("quantity")}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => setQty(String(Math.max(1, quantity - 1)))}
                disabled={quantity <= 1}
                aria-label="-1"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="sell-qty"
                type="number"
                inputMode="numeric"
                min="1"
                max={maxQty}
                value={qty}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setQty(e.target.value === "" ? "" : String(Math.min(Math.max(1, v || 1), maxQty)));
                }}
                className="h-12 text-center text-lg font-semibold"
                dir="ltr"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={() => setQty(String(Math.min(maxQty, quantity + 1)))}
                disabled={quantity >= maxQty}
                aria-label="+1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[1, 5, 10].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 min-w-11"
                  disabled={n > maxQty}
                  onClick={() => setQuick(n)}
                >
                  {formatNumber(n, lang)}
                </Button>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9"
                disabled={maxQty <= 0}
                onClick={() => setQty(String(maxQty))}
              >
                {t("filterAll")}: {formatNumber(maxQty, lang)}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("saleTotal")}</span>
            <span className="text-xl font-bold tabular-nums">{formatMoney(total, lang)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 flex-1 sm:flex-none">
            {t("cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || quantity <= 0 || quantity > maxQty}
            className="h-11 flex-1 sm:flex-none"
          >
            {t("confirmSale")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
