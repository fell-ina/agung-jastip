"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCost, updateCost, type CostInput } from "@/lib/api";
import { COST_CATEGORIES } from "@/lib/constants";
import type { CostCategory, OperationalCost, Trip } from "@/lib/types";

export function CostFormDialog({
  open,
  onOpenChange,
  cost,
  trips,
  defaultTripId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost: OperationalCost | null;
  trips: Trip[];
  defaultTripId?: string;
  onSaved: () => void;
}) {
  // Konten dialog ter-unmount saat ditutup (Base UI) → state terinisialisasi ulang.
  const [tripId, setTripId] = useState(cost?.trip_id ?? defaultTripId ?? "");
  const [category, setCategory] = useState<CostCategory>(cost?.category ?? "Makan");
  const [amount, setAmount] = useState(cost ? String(cost.amount_idr) : "");
  const [notes, setNotes] = useState(cost?.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tripId) return toast.error("Pilih trip terlebih dahulu");
    const value = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return toast.error("Nominal harus lebih dari 0");

    const payload: CostInput = {
      trip_id: tripId,
      category,
      amount_idr: value,
      notes: notes.trim() || null,
    };

    setBusy(true);
    try {
      if (cost) {
        await updateCost(cost.id, payload);
        toast.success("Biaya operasional diperbarui");
      } else {
        await createCost(payload);
        toast.success("Biaya operasional dicatat");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan biaya");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cost ? "Edit Biaya Operasional" : "Catat Biaya Operasional"}</DialogTitle>
          <DialogDescription>
            Pengeluaran selama trip: makan, cargo, transport, akomodasi, dll.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cost-trip">Trip</Label>
              <Select value={tripId} onValueChange={(v) => setTripId(v ?? "")}>
                <SelectTrigger id="cost-trip" className="w-full">
                  <SelectValue placeholder="Pilih trip" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost-category">Kategori</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CostCategory)}>
                <SelectTrigger id="cost-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cost-amount">Nominal (IDR)</Label>
            <Input
              id="cost-amount"
              type="number"
              min="0"
              step="any"
              inputMode="numeric"
              placeholder="mis. 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cost-notes">Keterangan (opsional)</Label>
            <Textarea
              id="cost-notes"
              placeholder="mis. Makan malam tim, ongkos taksi ke Shinjuku..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan..." : cost ? "Simpan Perubahan" : "Catat Biaya"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
