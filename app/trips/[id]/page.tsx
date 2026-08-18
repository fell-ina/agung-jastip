"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Pencil,
  Plane,
  Plus,
  Printer,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";

import { ConfirmDelete } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/shared/data-state";
import { PageHeader } from "@/components/shared/page-header";
import { TripStatusBadge } from "@/components/shared/status-badges";
import { CostsTable } from "@/components/costs/costs-table";
import { OrderFormDialog } from "@/components/orders/order-form";
import { OrdersTable } from "@/components/orders/orders-table";
import { CostFormDialog } from "@/components/costs/cost-form";
import { TripFormDialog } from "@/components/trips/trip-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fetchCosts, fetchCustomers, fetchOrders, fetchTrips, deleteTrip } from "@/lib/api";
import { computeTripFinance, tripProgress } from "@/lib/finance";
import { formatDate, formatIDR } from "@/lib/format";
import { useLoad } from "@/hooks/use-load";

async function loadTripDetail() {
  const [trips, orders, costs, customers] = await Promise.all([
    fetchTrips(),
    fetchOrders(),
    fetchCosts(),
    fetchCustomers(),
  ]);
  return { trips, orders, costs, customers };
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`mt-1 text-lg font-semibold tabular-nums ${
            tone === "positive"
              ? "text-emerald-600 dark:text-emerald-400"
              : tone === "negative"
                ? "text-rose-600 dark:text-rose-400"
                : ""
          }`}
        >
          {value}
        </div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tripId = params.id;
  const { data, loading, error, reload } = useLoad(loadTripDetail, [tripId]);

  const [tripFormOpen, setTripFormOpen] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const trip = useMemo(() => data?.trips.find((t) => t.id === tripId) ?? null, [data, tripId]);

  const tripOrders = useMemo(
    () => (data ? data.orders.filter((o) => o.trip_id === tripId) : []),
    [data, tripId],
  );
  const tripCosts = useMemo(
    () => (data ? data.costs.filter((c) => c.trip_id === tripId) : []),
    [data, tripId],
  );

  const finance = useMemo(
    () => (data && trip ? computeTripFinance(trip, data.orders, data.costs) : null),
    [data, trip],
  );

  const progress = trip ? tripProgress(trip) : 0;

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (loading || !data || !trip || !finance) {
    return <LoadingRows rows={5} />;
  }

  const profitPositive = finance.profitIdr >= 0;

  return (
    <div>
      <div className="print-hidden mb-4">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Kembali ke Trip
        </Link>
      </div>

      <PageHeader
        title={trip.name}
        description={`${trip.destination} · ${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`}
      >
        <Button variant="outline" render={<Link href={`/labels?trip=${trip.id}`} />}>
          <Printer /> Cetak Label
        </Button>
        <Button variant="secondary" onClick={() => setCostFormOpen(true)}>
          <Wallet /> Catat Biaya
        </Button>
        <Button variant="secondary" onClick={() => setOrderFormOpen(true)}>
          <Plus /> Tambah Pesanan
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTripFormOpen(true)}
          aria-label="Edit trip"
        >
          <Pencil />
        </Button>
        <ConfirmDelete
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title="Hapus trip ini?"
          description={`"${trip.name}" akan dihapus permanen. Biaya operasional ikut terhapus, tetapi pesanan tidak bisa dihapus selama masih ada.`}
          onConfirm={async () => {
            await deleteTrip(trip.id);
            router.push("/trips");
          }}
        />
        <Button variant="outline" size="icon" onClick={() => setConfirmDeleteOpen(true)} aria-label="Hapus trip">
          <Trash2 />
        </Button>
      </PageHeader>

      {/* Info trip */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Plane className="size-4 text-emerald-600" />
            <span className="text-muted-foreground">Tujuan:</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <MapPin className="size-3.5" /> {trip.destination}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <CalendarDays className="size-4 text-emerald-600" />
            <span className="text-muted-foreground">Jadwal:</span>
            <span className="font-medium">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</span>
          </span>
          <span className="text-sm">
            <span className="text-muted-foreground">Target kurs:</span>{" "}
            <span className="font-semibold tabular-nums">Rp {formatIDR(trip.target_kurs)}</span>
          </span>
          <TripStatusBadge status={trip.status} />
          <span className="ml-auto text-sm text-muted-foreground">
            Progress: <span className="font-semibold text-foreground">{progress}%</span>
          </span>
        </CardContent>
      </Card>

      {/* Ringkasan keuangan */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Penjualan" value={formatIDR(finance.revenueIdr)} hint={`${finance.activeOrderCount} pesanan aktif`} />
        <StatCard label="Uang Masuk" value={formatIDR(finance.paidIdr)} hint="DP + pelunasan" />
        <StatCard label="Piutang" value={formatIDR(finance.receivableIdr)} hint="sisa tagihan customer" />
        <StatCard label="Modal Belanja" value={formatIDR(finance.modalIdr)} hint={`kurs target ${formatIDR(trip.target_kurs)}`} />
        <StatCard label="Biaya Operasional" value={formatIDR(finance.costIdr)} hint={`${tripCosts.length} catatan`} />
        <StatCard
          label="Estimasi Keuntungan"
          value={formatIDR(finance.profitIdr)}
          hint={profitPositive ? "penjualan − modal − biaya" : "masih rugi"}
          tone={profitPositive ? "positive" : "negative"}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList className="mb-4">
          <TabsTrigger value="orders">Pesanan ({tripOrders.length})</TabsTrigger>
          <TabsTrigger value="costs">Biaya Operasional ({tripCosts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          {tripOrders.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Belum ada pesanan untuk trip ini"
              description="Tambahkan pesanan pertama untuk mulai menghitung modal dan keuntungan."
              action={
                <Button onClick={() => setOrderFormOpen(true)}>
                  <Plus /> Tambah Pesanan
                </Button>
              }
            />
          ) : (
            <OrdersTable
              orders={data.orders.filter((o) => o.trip_id === tripId)}
              trips={data.trips}
              customers={data.customers}
              loading={false}
              error={null}
              reload={reload}
              tripFilter={tripId}
              hideTripColumn
              showTitleActions={false}
            />
          )}
        </TabsContent>
        <TabsContent value="costs">
          <CostsTable
            costs={data.costs}
            trips={data.trips}
            loading={false}
            error={null}
            reload={reload}
            tripFilter={tripId}
            showTitleActions={false}
          />
        </TabsContent>
      </Tabs>

      <TripFormDialog
        open={tripFormOpen}
        onOpenChange={setTripFormOpen}
        trip={trip}
        onSaved={reload}
      />

      <OrderFormDialog
        open={orderFormOpen}
        onOpenChange={setOrderFormOpen}
        order={null}
        trips={data.trips}
        customers={data.customers}
        defaultTripId={tripId}
        onSaved={reload}
      />

      <CostFormDialog
        open={costFormOpen}
        onOpenChange={setCostFormOpen}
        cost={null}
        trips={data.trips}
        defaultTripId={tripId}
        onSaved={reload}
      />
    </div>
  );
}
