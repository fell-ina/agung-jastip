"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { LabelCard } from "@/components/labels/label-card";
import { PrintToolbar } from "@/components/labels/print-toolbar";
import { ErrorState, LoadingRows } from "@/components/shared/data-state";
import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/lib/api";
import { useLoad } from "@/hooks/use-load";

function PrintView() {
  const searchParams = useSearchParams();
  const ids = useMemo(() => {
    const raw = searchParams.get("ids") ?? "";
    return new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    );
  }, [searchParams]);

  const { data, loading, error } = useLoad(fetchOrders);

  const orders = useMemo(
    () => (data ?? []).filter((order) => ids.has(order.id)),
    [data, ids],
  );

  if (ids.size === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-100 p-6">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
          <Printer className="mx-auto size-8 text-zinc-400" />
          <h1 className="mt-3 text-lg font-semibold">Tidak ada pesanan dipilih</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Pilih pesanan di halaman Label Resi lalu cetak labelnya.
          </p>
          <Button className="mt-4" render={<Link href="/labels" />}>
            <ArrowLeft /> Kembali ke Label Resi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-100 px-4 py-6">
      <PrintToolbar count={orders.length} />

      {error && (
        <div className="mx-auto max-w-2xl">
          <ErrorState message={error} />
        </div>
      )}

      {loading && <LoadingRows rows={3} height="h-40" />}

      {!loading && !error && orders.length === 0 && (
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
          <p className="text-sm text-zinc-600">
            Label tidak ditemukan. Data mungkin sudah diubah atau di-reset.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            render={<Link href="/labels" />}
          >
            <ArrowLeft /> Kembali
          </Button>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col items-center gap-4 print:gap-0">
          {orders.map((order) => (
            <LabelCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-zinc-100 px-4 py-6">
          <LoadingRows rows={3} height="h-40" />
        </div>
      }
    >
      <PrintView />
    </Suspense>
  );
}
