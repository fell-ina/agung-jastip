"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Coins,
  HandCoins,
  Plane,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { KursWidget } from "@/components/shared/kurs-widget";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { LocalModeBanner } from "@/components/shared/local-mode-banner";
import { ErrorState, LoadingRows } from "@/components/shared/data-state";
import { TripStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchCosts, fetchOrders, fetchTrips } from "@/lib/api";
import { NO_TRIP_LABEL } from "@/lib/constants";
import { computeAppFinance, computeTripFinance, tripProgress } from "@/lib/finance";
import { formatDate, formatIDR } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useLoad } from "@/hooks/use-load";

async function loadDashboard() {
  const [trips, orders, costs] = await Promise.all([fetchTrips(), fetchOrders(), fetchCosts()]);
  return { trips, orders, costs };
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div
            className={`truncate text-lg font-semibold tabular-nums ${
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useLoad(loadDashboard);

  const finance = useMemo(
    () => (data ? computeAppFinance(data.trips, data.orders, data.costs) : null),
    [data],
  );

  const activeTrips = useMemo(
    () => (data ? data.trips.filter((t) => t.status === "Planning" || t.status === "On Trip") : []),
    [data],
  );

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateLabel} · Ringkasan keuangan seluruh trip aktif
        </p>
      </div>

      {!isSupabaseConfigured && <LocalModeBanner />}

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}
      {loading && <LoadingRows rows={4} height="h-24" />}

      {!loading && data && finance && (
        <>
          {/* Statistik utama */}
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              icon={Coins}
              label="Total Modal"
              value={formatIDR(finance.modalIdr)}
              hint="harga asing × kurs target"
            />
            <StatCard
              icon={HandCoins}
              label="Uang Masuk"
              value={formatIDR(finance.paidIdr)}
              hint="DP + pelunasan customer"
            />
            <StatCard
              icon={ReceiptText}
              label="Piutang"
              value={formatIDR(finance.receivableIdr)}
              hint="sisa tagihan belum dibayar"
            />
            <StatCard
              icon={TrendingUp}
              label="Est. Keuntungan"
              value={formatIDR(finance.profitIdr)}
              hint="penjualan − modal − biaya"
              tone={finance.profitIdr >= 0 ? "positive" : "negative"}
            />
            <StatCard
              icon={Wallet}
              label="Biaya Operasional"
              value={formatIDR(finance.costIdr)}
              hint="semua trip aktif"
            />
            <StatCard
              icon={Banknote}
              label="Pesanan Aktif"
              value={String(finance.activeOrderCount)}
              hint={
                finance.tripLessOrderCount > 0
                  ? `${finance.tripLessOrderCount} ${NO_TRIP_LABEL.toLowerCase()} · belum termasuk refund`
                  : "belum termasuk refund"
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {/* Progress trip */}
              <Card>
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="size-4 text-emerald-500" />
                      <h2 className="font-heading text-base font-medium">Progress Trip Aktif</h2>
                    </div>
                    <Button size="sm" variant="ghost" render={<Link href="/trips" />}>
                      Semua trip <ArrowRight />
                    </Button>
                  </div>

                  {activeTrips.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Tidak ada trip aktif. Buat trip baru untuk mulai mencatat jastip.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeTrips.map((trip) => {
                        const f = computeTripFinance(trip, data.orders, data.costs);
                        const progress = tripProgress(trip);
                        return (
                          <Link
                            key={trip.id}
                            href={`/trips/${trip.id}`}
                            className="block rounded-lg border p-3 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{trip.name}</span>
                                <TripStatusBadge status={trip.status} />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium tabular-nums">{progress}%</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                Penjualan:{" "}
                                <span className="font-medium text-foreground tabular-nums">
                                  {formatIDR(f.revenueIdr)}
                                </span>
                              </span>
                              <span>
                                Masuk:{" "}
                                <span className="font-medium text-foreground tabular-nums">
                                  {formatIDR(f.paidIdr)}
                                </span>
                              </span>
                              <span>
                                Profit:{" "}
                                <span
                                  className={`font-medium tabular-nums ${
                                    f.profitIdr >= 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  {formatIDR(f.profitIdr)}
                                </span>
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <RecentOrders orders={data.orders} />
            </div>

            <KursWidget />
          </div>
        </>
      )}
    </div>
  );
}
