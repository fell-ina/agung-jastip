"use client";

import { CostsTable } from "@/components/costs/costs-table";
import { ErrorState, LoadingRows } from "@/components/shared/data-state";
import { PageHeader } from "@/components/shared/page-header";
import { fetchCosts, fetchTrips } from "@/lib/api";
import { useLoad } from "@/hooks/use-load";

async function loadCostsPage() {
  const [costs, trips] = await Promise.all([fetchCosts(), fetchTrips()]);
  return { costs, trips };
}

export default function CostsPage() {
  const { data, loading, error, reload } = useLoad(loadCostsPage);

  return (
    <div>
      <PageHeader
        title="Biaya Operasional"
        description="Catat pengeluaran selama trip: makan, cargo, transport, akomodasi, dan lainnya."
      />

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}
      {loading && <LoadingRows rows={4} height="h-12" />}

      {!loading && data && (
        <CostsTable
          costs={data.costs}
          trips={data.trips}
          loading={false}
          error={null}
          reload={reload}
        />
      )}
    </div>
  );
}
