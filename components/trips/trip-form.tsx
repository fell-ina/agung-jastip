"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Tag } from "lucide-react";
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
import { createTrip, updateTrip } from "@/lib/api";
import { TRIP_STATUSES } from "@/lib/constants";
import type { Trip, TripStatus } from "@/lib/types";

export function TripFormDialog({
  open,
  onOpenChange,
  trip,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip | null;
  onSaved: () => void;
}) {
  // Konten dialog ter-unmount saat ditutup (Base UI), jadi state
  // terinisialisasi ulang dari props setiap kali dibuka.
  const [name, setName] = useState(trip?.name ?? "");
  const [destination, setDestination] = useState(trip?.destination ?? "");
  const [startDate, setStartDate] = useState(trip?.start_date ?? "");
  const [endDate, setEndDate] = useState(trip?.end_date ?? "");
  const [targetKurs, setTargetKurs] = useState(trip ? String(trip.target_kurs) : "");
  const [status, setStatus] = useState<TripStatus>(trip?.status ?? "Planning");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) {
      toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai");
      return;
    }
    const kurs = parseFloat(targetKurs.replace(",", "."));
    if (!Number.isFinite(kurs) || kurs <= 0) {
      toast.error("Isi target kurs dengan angka lebih dari 0");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        target_kurs: kurs,
        status,
      };
      if (trip) {
        await updateTrip(trip.id, payload);
        toast.success("Trip berhasil diperbarui");
      } else {
        await createTrip(payload);
        toast.success("Trip baru berhasil dibuat");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan trip");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{trip ? "Edit Trip" : "Trip Baru"}</DialogTitle>
          <DialogDescription>
            Isi jadwal keberangkatan, tujuan, dan kurs target belanja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="trip-name">Nama Trip</Label>
            <Input
              id="trip-name"
              placeholder="mis. Trip Jepang #3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="trip-destination">Tujuan</Label>
            <Input
              id="trip-destination"
              placeholder="mis. Tokyo & Osaka, Jepang"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="trip-start">Tanggal Mulai</Label>
              <Input
                id="trip-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trip-end">Tanggal Selesai</Label>
              <Input
                id="trip-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="trip-kurs">Target Kurs (1 mata uang asing = ? IDR)</Label>
              <Input
                id="trip-kurs"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="mis. 11200"
                value={targetKurs}
                onChange={(e) => setTargetKurs(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trip-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TripStatus)}>
                <SelectTrigger id="trip-status" className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {TRIP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" /> {startDate || "…"} → {endDate || "…"}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {destination || "tujuan"}
            </span>
            {targetKurs && (
              <span className="inline-flex items-center gap-1">
                <Tag className="size-3.5" /> 1 unit ≈ Rp {targetKurs}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan..." : trip ? "Simpan Perubahan" : "Buat Trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
