"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { ConfirmDelete } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/shared/data-state";
import { OrderStatusBadge, ShippingBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { OrderFormDialog } from "@/components/orders/order-form";
import { deleteOrder } from "@/lib/api";
import { NO_TRIP_LABEL, ORDER_STATUSES, SHIPPING_METHODS } from "@/lib/constants";
import { formatForeign, formatIDR, formatRate, orderRemaining, orderTotal } from "@/lib/format";
import { buildInvoiceMessage, buildRefundMessage, buildWaLink } from "@/lib/whatsapp";
import type { Customer, Order, OrderWithRelations, Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "created_at" | "item_name" | "customer" | "total" | "status" | "trip";

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-50" />
      )}
    </button>
  );
}

export function OrdersTable({
  orders,
  trips,
  customers,
  loading,
  error,
  reload,
  tripFilter,
  hideTripColumn = false,
  showTitleActions = true,
}: {
  orders: OrderWithRelations[] | null;
  trips: Trip[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Filter trip bawaan (mis. dari halaman detail trip). */
  tripFilter?: string;
  hideTripColumn?: boolean;
  showTitleActions?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tripFilterState, setTripFilterState] = useState<string>(tripFilter ?? "all");
  const [shipFilter, setShipFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  // Filter/perubahan yang juga harus me-reset ke halaman 1
  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function changeTripFilter(value: string) {
    setTripFilterState(value);
    setPage(1);
  }
  function changeShipFilter(value: string) {
    setShipFilter(value);
    setPage(1);
  }
  function changeStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
  }
  function changePageSize(value: string | null) {
    setPageSize(parseInt(value ?? "10", 10));
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = orders ?? [];

    if (tripFilterState === "none") list = list.filter((o) => o.trip_id === null);
    else if (tripFilterState !== "all") list = list.filter((o) => o.trip_id === tripFilterState);
    if (shipFilter !== "all") list = list.filter((o) => o.shipping_method === shipFilter);
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.item_name.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.trip.name.toLowerCase().includes(q),
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "item_name":
          cmp = a.item_name.localeCompare(b.item_name);
          break;
        case "customer":
          cmp = a.customer.name.localeCompare(b.customer.name);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "trip":
          cmp = a.trip.name.localeCompare(b.trip.name);
          break;
        case "total":
          cmp = orderTotal(a) - orderTotal(b);
          break;
        case "created_at":
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [orders, search, tripFilterState, shipFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  }

  function openInvoiceWa(order: OrderWithRelations) {
    const message = buildInvoiceMessage({
      customerName: order.customer.name,
      itemName: order.item_name,
      quantity: order.quantity,
      currency: order.foreign_currency,
      priceForeign: order.item_price_foreign,
      rate: order.exchange_rate_used,
      totalIdr: orderTotal(order),
      paidIdr: order.paid_amount_idr,
      shippingMethod: order.shipping_method,
      tripName: order.trip.name,
    });
    window.open(buildWaLink(order.customer.whatsapp_number, message), "_blank");
  }

  function openRefundWa(order: OrderWithRelations) {
    const message = buildRefundMessage({
      customerName: order.customer.name,
      itemName: order.item_name,
      quantity: order.quantity,
      totalIdr: orderTotal(order),
    });
    window.open(buildWaLink(order.customer.whatsapp_number, message), "_blank");
  }

  const hasFilters = search !== "" || tripFilterState !== "all" || shipFilter !== "all" || statusFilter !== "all";

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Cari barang / customer / trip..."
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
            />
          </div>
          {showTitleActions && (
            <Button
              onClick={() => {
                setEditingOrder(null);
                setFormOpen(true);
              }}
              disabled={customers.length === 0}
              title={customers.length === 0 ? "Buat customer dulu sebelum menambah pesanan" : undefined}
            >
              <Plus /> Tambah Pesanan
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={tripFilterState} onValueChange={(v) => changeTripFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Semua trip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua trip</SelectItem>
              <SelectItem value="none">Tanpa trip</SelectItem>
              {trips.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={shipFilter} onValueChange={(v) => changeShipFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Semua pengiriman" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua pengiriman</SelectItem>
              {SHIPPING_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => changeStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                changeSearch("");
                changeTripFilter(tripFilter ?? "all");
                changeShipFilter("all");
                changeStatusFilter("all");
              }}
            >
              <RotateCcw /> Reset
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} pesanan
          </span>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={reload} /></div>}

      {loading && <LoadingRows rows={6} height="h-12" />}

      {!loading && orders && filtered.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Tidak ada pesanan"
          description={hasFilters ? "Coba ubah pencarian atau filter." : "Mulai catat pesanan jastip pertamamu."}
          action={
            showTitleActions && !hasFilters ? (
              <Button onClick={() => { setEditingOrder(null); setFormOpen(true); }}>
                <Plus /> Tambah Pesanan
              </Button>
            ) : undefined
          }
        />
      )}

      {!loading && orders && filtered.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>
                    <SortHeader label="Barang" sortKey="item_name" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortHeader label="Customer" sortKey="customer" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </TableHead>
                  {!hideTripColumn && (
                    <TableHead>
                      <SortHeader label="Trip" sortKey="trip" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </TableHead>
                  )}
                  <TableHead className="text-right">
                    <SortHeader label="Total IDR" sortKey="total" current={sortKey} dir={sortDir} onSort={handleSort} className="justify-end" />
                  </TableHead>
                  <TableHead>Pengiriman</TableHead>
                  <TableHead>
                    <SortHeader label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="text-right">Dibayar / Sisa</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((order, index) => {
                  const total = orderTotal(order);
                  const remaining = orderRemaining(order);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.item_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatForeign(order.item_price_foreign, order.foreign_currency)} × {order.quantity} · kurs {formatRate(order.exchange_rate_used)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer.whatsapp_number}</div>
                      </TableCell>
                      {!hideTripColumn && (
                        <TableCell>
                          {order.trip_id ? (
                            <div className="max-w-36 truncate text-sm">{order.trip.name}</div>
                          ) : (
                            <div className="text-sm italic text-muted-foreground">{NO_TRIP_LABEL}</div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatIDR(total)}
                      </TableCell>
                      <TableCell>
                        <ShippingBadge method={order.shipping_method} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="text-xs text-muted-foreground">{formatIDR(order.paid_amount_idr)}</div>
                        {order.status !== "Out of Stock/Refund" && (
                          <div className={cn("text-xs font-medium", remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                            {remaining > 0 ? `sisa ${formatIDR(remaining)}` : "lunas"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            title="Kirim tagihan WhatsApp"
                            onClick={() => openInvoiceWa(order)}
                          >
                            <MessageCircle />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button variant="ghost" size="icon-sm" aria-label="Aksi lainnya" />}
                            >
                              <ArrowUpDown className="size-4 rotate-45" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openInvoiceWa(order)}>
                                <MessageCircle /> Chat WA Tagihan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRefundWa(order)}>
                                <RotateCcw /> Chat WA Refund
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/labels/print?ids=${order.id}`)}>
                                <Printer /> Cetak Label Resi
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingOrder(order);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil /> Edit Pesanan
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteOrderId(order.id)}
                              >
                                <Trash2 /> Hapus Pesanan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Baris per halaman</span>
              <Select value={String(pageSize)} onValueChange={changePageSize}>
                <SelectTrigger className="h-7 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft /> Sebelumnya
              </Button>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Berikutnya <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}

      <OrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editingOrder}
        trips={trips}
        customers={customers}
        onSaved={reload}
      />

      <ConfirmDelete
        open={deleteOrderId !== null}
        onOpenChange={(open) => { if (!open) setDeleteOrderId(null); }}
        title="Hapus pesanan ini?"
        description="Pesanan akan dihapus permanen dari database."
        onConfirm={async () => {
          if (!deleteOrderId) return;
          await deleteOrder(deleteOrderId);
          setDeleteOrderId(null);
          reload();
        }}
      />
    </div>
  );
}
