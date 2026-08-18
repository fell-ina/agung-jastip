"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCheck, Printer, ShoppingBag } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@/components/shared/data-state";
import { PageHeader } from "@/components/shared/page-header";
import { OrderStatusBadge, ShippingBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchCustomers, fetchOrders, fetchTrips } from "@/lib/api";
import { NO_TRIP_LABEL } from "@/lib/constants";
import { formatIDR, orderTotal } from "@/lib/format";
import { useLoad } from "@/hooks/use-load";

async function loadLabelsPage() {
  const [orders, trips, customers] = await Promise.all([
    fetchOrders(),
    fetchTrips(),
    fetchCustomers(),
  ]);
  return { orders, trips, customers };
}

function LabelsPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetTrip = searchParams.get("trip") ?? "all";
  const { data, loading, error, reload } = useLoad(loadLabelsPage);

  const [tripFilter, setTripFilter] = useState<string>(presetTrip);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const printable = useMemo(
    () => (data ? data.orders.filter((o) => o.status !== "Out of Stock/Refund") : []),
    [data],
  );

  const filtered = useMemo(() => {
    if (tripFilter === "all") return printable;
    if (tripFilter === "none") return printable.filter((o) => o.trip_id === null);
    return printable.filter((o) => o.trip_id === tripFilter);
  }, [printable, tripFilter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const allSelected = filtered.every((o) => prev.has(o.id));
      const next = new Set(prev);
      if (allSelected) filtered.forEach((o) => next.delete(o.id));
      else filtered.forEach((o) => next.add(o.id));
      return next;
    });
  }

  function printSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    router.push(`/labels/print?ids=${ids.join(",")}`);
  }

  const allChecked = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  return (
    <div>
      <PageHeader
        title="Label Resi"
        description="Pilih pesanan untuk mencetak label resi pengiriman (ramah printer thermal 80mm)."
      >
        <Button onClick={printSelected} disabled={selected.size === 0}>
          <Printer /> Cetak Label ({selected.size})
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={tripFilter} onValueChange={(v) => setTripFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Semua trip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua trip</SelectItem>
            <SelectItem value="none">Tanpa trip</SelectItem>
            {data?.trips.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} pesanan siap cetak · {selected.size} dipilih
        </span>
      </div>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}
      {loading && <LoadingRows rows={5} height="h-12" />}

      {!loading && data && filtered.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Tidak ada pesanan untuk dicetak"
          description="Pesanan dengan status selain 'Out of Stock/Refund' bisa dicetak labelnya."
          action={
            <Button variant="outline" onClick={reload}>
              Muat ulang
            </Button>
          }
        />
      )}

      {!loading && data && filtered.length > 0 && (
        <Card>
          <CardContent className="px-0">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <Button size="sm" variant="ghost" onClick={toggleAll}>
                <CheckCheck /> {allChecked ? "Batalkan semua" : "Pilih semua"}
              </Button>
              <span className="text-xs text-muted-foreground">Klik baris untuk memilih</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Pilih semua" />
                  </TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Pengiriman</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
                  const checked = selected.has(order.id);
                  return (
                    <TableRow
                      key={order.id}
                      className={checked ? "bg-emerald-500/5" : ""}
                      onClick={() => toggle(order.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Pilih ${order.item_name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.item_name}</div>
                        <div className="text-xs text-muted-foreground">× {order.quantity}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer.whatsapp_number}</div>
                      </TableCell>
                      <TableCell className="max-w-36 truncate">
                        {order.trip_id ? (
                          order.trip.name
                        ) : (
                          <span className="italic text-muted-foreground">{NO_TRIP_LABEL}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatIDR(orderTotal(order))}
                      </TableCell>
                      <TableCell>
                        <ShippingBadge method={order.shipping_method} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function LabelsPage() {
  return (
    <Suspense
      fallback={<div className="p-4"><LoadingRows rows={5} height="h-12" /></div>}
    >
      <LabelsPicker />
    </Suspense>
  );
}
