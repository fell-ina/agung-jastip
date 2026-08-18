import type { OperationalCost, Order, Trip } from "@/lib/types";

export interface TripFinance {
  /** Total modal belanja (harga asing × qty × target_kurs) — order non-refund */
  modalIdr: number;
  /** Total nilai penjualan (calculated_price_idr × qty) — order non-refund */
  revenueIdr: number;
  /** Total uang masuk dari customer (paid_amount_idr) — order non-refund */
  paidIdr: number;
  /** Total biaya operasional trip */
  costIdr: number;
  /** Estimasi keuntungan = penjualan − modal − biaya operasional */
  profitIdr: number;
  /** Piutang / sisa tagihan yang belum dibayar */
  receivableIdr: number;
  /** Jumlah semua pesanan (termasuk refund) */
  orderCount: number;
  /** Jumlah pesanan aktif (non-refund) */
  activeOrderCount: number;
}

const isActiveOrder = (o: Order) => o.status !== "Out of Stock/Refund";

export function computeTripFinance(
  trip: Trip,
  orders: Order[],
  costs: OperationalCost[],
): TripFinance {
  const tripOrders = orders.filter((o) => o.trip_id === trip.id);
  const active = tripOrders.filter(isActiveOrder);

  const modalIdr = active.reduce(
    (sum, o) => sum + o.item_price_foreign * o.quantity * (trip.target_kurs || 0),
    0,
  );
  const revenueIdr = active.reduce(
    (sum, o) => sum + o.calculated_price_idr * o.quantity,
    0,
  );
  const paidIdr = active.reduce((sum, o) => sum + o.paid_amount_idr, 0);
  const costIdr = costs
    .filter((c) => c.trip_id === trip.id)
    .reduce((sum, c) => sum + c.amount_idr, 0);

  return {
    modalIdr,
    revenueIdr,
    paidIdr,
    costIdr,
    profitIdr: revenueIdr - modalIdr - costIdr,
    receivableIdr: Math.max(0, revenueIdr - paidIdr),
    orderCount: tripOrders.length,
    activeOrderCount: active.length,
  };
}

export interface AppFinance {
  modalIdr: number;
  revenueIdr: number;
  paidIdr: number;
  costIdr: number;
  profitIdr: number;
  receivableIdr: number;
  activeOrderCount: number;
  /** Jumlah pesanan aktif yang tidak terikat trip mana pun. */
  tripLessOrderCount: number;
}

const EMPTY_APP_FINANCE: AppFinance = {
  modalIdr: 0,
  revenueIdr: 0,
  paidIdr: 0,
  costIdr: 0,
  profitIdr: 0,
  receivableIdr: 0,
  activeOrderCount: 0,
  tripLessOrderCount: 0,
};

export function computeAppFinance(
  trips: Trip[],
  orders: Order[],
  costs: OperationalCost[],
): AppFinance {
  const activeTrips = trips.filter((t) => t.status !== "Cancelled");
  const totals = activeTrips.map((trip) => computeTripFinance(trip, orders, costs));

  const base = totals.reduce<AppFinance>(
    (acc, t) => ({
      ...acc,
      modalIdr: acc.modalIdr + t.modalIdr,
      revenueIdr: acc.revenueIdr + t.revenueIdr,
      paidIdr: acc.paidIdr + t.paidIdr,
      costIdr: acc.costIdr + t.costIdr,
      profitIdr: acc.profitIdr + t.profitIdr,
      receivableIdr: acc.receivableIdr + t.receivableIdr,
      activeOrderCount: acc.activeOrderCount + t.activeOrderCount,
    }),
    { ...EMPTY_APP_FINANCE },
  );

  // Pesanan tanpa trip (jastip langsung) — modal memakai kurs pesanan sendiri
  // karena tidak ada target_kurs trip.
  const tripLessOrders = orders.filter((o) => o.trip_id === null && isActiveOrder(o));
  const tripLessModal = tripLessOrders.reduce(
    (sum, o) => sum + o.item_price_foreign * o.quantity * (o.exchange_rate_used || 0),
    0,
  );
  const tripLessRevenue = tripLessOrders.reduce(
    (sum, o) => sum + o.calculated_price_idr * o.quantity,
    0,
  );
  const tripLessPaid = tripLessOrders.reduce((sum, o) => sum + o.paid_amount_idr, 0);

  return {
    ...base,
    modalIdr: base.modalIdr + tripLessModal,
    revenueIdr: base.revenueIdr + tripLessRevenue,
    paidIdr: base.paidIdr + tripLessPaid,
    profitIdr: base.profitIdr + tripLessRevenue - tripLessModal,
    receivableIdr:
      base.receivableIdr + Math.max(0, tripLessRevenue - tripLessPaid),
    activeOrderCount: base.activeOrderCount + tripLessOrders.length,
    tripLessOrderCount: tripLessOrders.length,
  };
}

/** Progress trip dalam persen (0–100) berdasarkan rentang tanggal. */
export function tripProgress(trip: Trip): number {
  const start = new Date(trip.start_date).getTime();
  const end = new Date(trip.end_date).getTime();
  const today = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  if (end - start <= 0) return today >= end ? 100 : 0;
  const progress = ((today - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
