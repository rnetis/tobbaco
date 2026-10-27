"use client";

import { useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language-context";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { FileUp } from "lucide-react";

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [csv, setCsv] = useState("");
  const [replace, setReplace] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, replace }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "failed");
      return data as { created: number; updated: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(t("importResult", { created: data.created, updated: data.updated }));
      setCsv("");
      onOpenChange(false);
    },
    onError: () => toast.error(t("importFailed")),
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            {t("importTitle")}
          </DialogTitle>
          <DialogDescription>{t("importDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={`#,name,price,amount,amount sold\n1,Apple,2.5,100,20\n2,Orange,3,80,15`}
            className="min-h-36 font-mono text-xs"
            dir="ltr"
          />

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button type="button" variant="outline" className="h-10" onClick={() => fileRef.current?.click()}>
              {t("importFile")}
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox id="import-replace" checked={replace} onCheckedChange={(v) => setReplace(v === true)} />
              <Label htmlFor="import-replace" className="text-sm font-normal cursor-pointer">
                {t("importReplace")}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 flex-1 sm:flex-none">
            {t("cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !csv.trim()}
            className="h-11 flex-1 sm:flex-none"
          >
            {t("importBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
