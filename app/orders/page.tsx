"use client";

import { ErrorState, LoadingRows } from "@/components/shared/data-state";
import { PageHeader } from "@/components/shared/page-header";
import { OrdersTable } from "@/components/orders/orders-table";
import { fetchCustomers, fetchOrders, fetchTrips } from "@/lib/api";
import { useLoad } from "@/hooks/use-load";

async function loadOrdersPage() {
  const [orders, trips, customers] = await Promise.all([
    fetchOrders(),
    fetchTrips(),
    fetchCustomers(),
  ]);
  return { orders, trips, customers };
}

export default function OrdersPage() {
  const { data, loading, error, reload } = useLoad(loadOrdersPage);

  return (
    <div>
      <PageHeader
        title="Pesanan"
        description="Catat ribuan pesanan jastip dengan pencarian, pengurutan, dan filter cepat."
      />

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}
      {loading && <LoadingRows rows={6} height="h-12" />}

      {!loading && data && (
        <OrdersTable
          orders={data.orders}
          trips={data.trips}
          customers={data.customers}
          loading={false}
          error={null}
          reload={reload}
        />
      )}
    </div>
  );
}
