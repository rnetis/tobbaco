"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { StatsCards } from "@/components/stats-cards";
import { ProductList } from "@/components/product-list";
import { ProductDialog } from "@/components/product-dialog";
import { SellDialog } from "@/components/sell-dialog";
import { RestockDialog } from "@/components/restock-dialog";
import { SalesHistoryDialog } from "@/components/sales-history-dialog";
import { ImportDialog } from "@/components/import-dialog";
import { useLanguage } from "@/lib/language-context";
import { apiFetch, isOfflineMode } from "@/lib/api-client";
import { shareInventoryCsv } from "@/lib/share-csv";
import type { Product } from "@/lib/types";
import { LOW_STOCK_THRESHOLD } from "@/lib/types";
import {
  Database,
  FileDown,
  FileUp,
  History,
  PackagePlus,
  Plus,
  Search,
  Store,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Filter = "all" | "low" | "out";

export default function Home() {
  const { t, dir } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sellProduct, setSellProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products", search],
    queryFn: async () => {
      const res = await apiFetch(`/api/products?q=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    if (!products) return undefined;
    switch (filter) {
      case "low":
        return products.filter((p) => p.amount > 0 && p.amount <= LOW_STOCK_THRESHOLD);
      case "out":
        return products.filter((p) => p.amount <= 0);
      default:
        return products;
    }
  }, [products, filter]);

  const openAdd = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setProductDialogOpen(true);
  };

  const handleExport = async () => {
    if (isOfflineMode()) {
      // Native/ offline build: no server to stream a file from — share or download the CSV
      await shareInventoryCsv();
    } else {
      window.location.href = "/api/export";
    }
    toast.success(t("exportDone"));
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "low", label: t("filterLow") },
    { key: "out", label: t("filterOut") },
  ];

  return (
    <div dir={dir} className="flex flex-col min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-5xl px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Store className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight truncate">{t("appName")}</h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                {t("appSubtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setHistoryOpen(true)}
              aria-label={t("salesHistory")}
              title={t("salesHistory")}
            >
              <History className="h-4 w-4" />
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:py-6 space-y-5 pb-24 md:pb-8">
        <StatsCards />

        {/* Toolbar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none start-3"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="h-11 ps-9"
                aria-label={t("search")}
              />
            </div>
            <Button onClick={openAdd} className="h-11 gap-1.5 px-4 font-semibold shadow-sm" aria-label={t("addProduct")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("addProduct")}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div
              className="flex rounded-lg border bg-background p-1 gap-1"
              role="tablist"
              aria-label={t("filterAll")}
            >
              {filters.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-3 h-8 text-sm font-medium transition-colors ${
                    filter === f.key
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-1.5">
                  <Database className="h-4 w-4" aria-hidden="true" />
                  {t("dataMenu")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setImportOpen(true)}>
                  <FileUp className="h-4 w-4" /> {t("importCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <FileDown className="h-4 w-4" /> {t("exportCsv")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4" /> {t("salesHistory")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered && filtered.length === 0 && search ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 px-6 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t("emptyFiltered")}</p>
          </div>
        ) : filtered && filtered.length === 0 && filter !== "all" ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 px-6 text-center">
            <p className="text-sm text-muted-foreground">{t("emptyFiltered")}</p>
          </div>
        ) : (
          <ProductList products={filtered} isLoading={isLoading} onSell={setSellProduct} onEdit={openEdit} onRestock={setRestockProduct} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto max-w-5xl px-4 h-12 flex items-center justify-center text-xs text-muted-foreground">
          {t("appName")} · PWA
        </div>
      </footer>

      {/* Mobile FAB */}
      <Button
        size="icon"
        onClick={openAdd}
        className="md:hidden fixed bottom-20 end-4 z-40 h-14 w-14 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700"
        aria-label={t("addProduct")}
      >
        <PackagePlus className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* Dialogs — conditionally mounted and keyed so each opens with fresh state */}
      {productDialogOpen && (
        <ProductDialog
          key={editingProduct?.id ?? "new"}
          open
          onOpenChange={setProductDialogOpen}
          product={editingProduct}
        />
      )}
      {sellProduct && (
        <SellDialog key={sellProduct.id} product={sellProduct} onOpenChange={() => setSellProduct(null)} />
      )}
      {restockProduct && (
        <RestockDialog
          key={restockProduct.id}
          product={restockProduct}
          onOpenChange={() => setRestockProduct(null)}
        />
      )}
      {historyOpen && <SalesHistoryDialog open onOpenChange={setHistoryOpen} />}
      {importOpen && <ImportDialog open onOpenChange={setImportOpen} />}
    </div>
  );
}
