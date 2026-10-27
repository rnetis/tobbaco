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
import { formatMoney } from "@/lib/i18n";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

type ProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null; // null = create
};

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  // State initialized from product — component is mounted fresh per open (keyed by parent)
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [amount, setAmount] = useState(product ? String(product.amount) : "");

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        price: Number(price) || 0,
        amount: parseInt(amount, 10) || 0,
      };
      const res = product
        ? await apiFetch(`/api/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(product ? t("productUpdated") : t("productAdded"));
      onOpenChange(false);
    },
    onError: () => toast.error(t("error")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={undefined}>
        <DialogHeader>
          <DialogTitle>{product ? t("editProduct") : t("addProduct")}</DialogTitle>
          {!product && <DialogDescription className="sr-only">{t("addProduct")}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">{t("name")}</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name")}
              required
              autoFocus
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="product-price">{t("price")}</Label>
              <Input
                id="product-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="h-11"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-amount">{t("amount")}</Label>
              <Input
                id="product-amount"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-11"
                dir="ltr"
              />
            </div>
          </div>
          {price && (
            <p className="text-sm text-muted-foreground">
              {t("amount")}: {formatMoney((Number(price) || 0) * (parseInt(amount, 10) || 0), lang)}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1 sm:flex-none"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !name.trim()} className="h-11 flex-1 sm:flex-none">
              {product ? t("saveChanges") : t("addProduct")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
