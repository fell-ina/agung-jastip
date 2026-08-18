"use client";

import { useMemo, useState } from "react";
import { Plane } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@/components/shared/data-state";
import { PageHeader } from "@/components/shared/page-header";
import { TripCard } from "@/components/trips/trip-card";
import { TripFormDialog } from "@/components/trips/trip-form";
import { Button } from "@/components/ui/button";
import { fetchCosts, fetchOrders, fetchTrips, deleteTrip } from "@/lib/api";
import { computeTripFinance } from "@/lib/finance";
import type { Trip } from "@/lib/types";
import { useLoad } from "@/hooks/use-load";

async function loadTripsPage() {
  const [trips, orders, costs] = await Promise.all([fetchTrips(), fetchOrders(), fetchCosts()]);
  return { trips, orders, costs };
}

export default function TripsPage() {
  const { data, loading, error, reload } = useLoad(loadTripsPage);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const cards = useMemo(() => {
    if (!data) return [];
    return data.trips.map((trip) => ({
      trip,
      finance: computeTripFinance(trip, data.orders, data.costs),
    }));
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Trip"
        description="Kelola jadwal keberangkatan jastip dan kurs target belanja."
      >
        <Button
          onClick={() => {
            setEditingTrip(null);
            setFormOpen(true);
          }}
        >
          <Plane /> Trip Baru
        </Button>
      </PageHeader>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}

      {loading && <LoadingRows rows={3} />}

      {!loading && data && data.trips.length === 0 && (
        <EmptyState
          icon={Plane}
          title="Belum ada trip"
          description="Buat trip pertama untuk mulai mencatat pesanan jastip."
          action={
            <Button
              onClick={() => {
                setEditingTrip(null);
                setFormOpen(true);
              }}
            >
              <Plane /> Buat Trip Pertama
            </Button>
          }
        />
      )}

      {!loading && data && data.trips.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ trip, finance }) => (
            <TripCard
              key={trip.id}
              trip={trip}
              finance={finance}
              onEdit={(t) => {
                setEditingTrip(t);
                setFormOpen(true);
              }}
              onDelete={async () => {
                await deleteTrip(trip.id);
                reload();
              }}
            />
          ))}
        </div>
      )}

      <TripFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        trip={editingTrip}
        onSaved={reload}
      />
    </div>
  );
}
