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
import { apiFetch } from "@/lib/api-client";
import { formatNumber } from "@/lib/i18n";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";

type RestockDialogProps = {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
};

export function RestockDialog({ product, onOpenChange }: RestockDialogProps) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  // Fresh mount per product (keyed by parent) — default restock quantity 10
  const [qty, setQty] = useState("10");

  const addAmount = Math.max(0, parseInt(qty, 10) || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/products/${product!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addAmount }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(t("restocked"));
      onOpenChange(false);
    },
    onError: () => toast.error(t("error")),
  });

  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            {t("restock")} — {product.name}
          </DialogTitle>
          <DialogDescription>
            {t("amount")}: {formatNumber(product.amount, lang)} {t("units")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="restock-qty">{t("restockAmount")}</Label>
          <Input
            id="restock-qty"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="h-12 text-lg font-semibold"
            dir="ltr"
            autoFocus
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {[5, 10, 50].map((n) => (
              <Button key={n} type="button" variant="secondary" size="sm" className="h-9 min-w-11" onClick={() => setQty(String(n))}>
                +{formatNumber(n, lang)}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            {t("newStock")}: {formatNumber(product.amount + addAmount, lang)} {t("units")}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 flex-1 sm:flex-none">
            {t("cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || addAmount <= 0}
            className="h-11 flex-1 sm:flex-none"
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
