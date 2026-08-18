"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Pencil, Plane, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/shared/confirm-dialog";
import { TripStatusBadge } from "@/components/shared/status-badges";
import { formatDate, formatIDR } from "@/lib/format";
import { tripProgress } from "@/lib/finance";
import type { TripFinance } from "@/lib/finance";
import type { Trip } from "@/lib/types";

export function TripCard({
  trip,
  finance,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  finance: TripFinance;
  onEdit: (trip: Trip) => void;
  onDelete: () => Promise<void>;
}) {
  const progress = trip.status === "Cancelled" ? 0 : tripProgress(trip);
  const profitPositive = finance.profitIdr >= 0;

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Plane className="size-4.5" />
            </div>
            <CardTitle className="text-base">{trip.name}</CardTitle>
          </div>
          <TripStatusBadge status={trip.status} />
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {trip.destination}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress trip</span>
            <span className="font-medium tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Penjualan</div>
            <div className="font-medium tabular-nums">{formatIDR(finance.revenueIdr)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Uang masuk</div>
            <div className="font-medium tabular-nums">{formatIDR(finance.paidIdr)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Modal</div>
            <div className="font-medium tabular-nums">{formatIDR(finance.modalIdr)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Biaya ops.</div>
            <div className="font-medium tabular-nums">{formatIDR(finance.costIdr)}</div>
          </div>
        </div>

        <div
          className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
            profitPositive
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
          }`}
        >
          <span>Est. Keuntungan</span>
          <span className="tabular-nums">{formatIDR(finance.profitIdr)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="secondary" className="flex-1" render={<Link href={`/trips/${trip.id}`} />}>
            <ReceiptText />
            Kelola
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => onEdit(trip)} aria-label="Edit trip">
            <Pencil />
          </Button>
          <ConfirmDelete
            title="Hapus trip ini?"
            description={`"${trip.name}" beserta ringkasan keuangannya akan dihapus permanen.`}
            onConfirm={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}
