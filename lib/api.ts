"use client";

import * as localDb from "@/lib/local-db";
import { NO_TRIP_LABEL } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  CostWithTrip,
  Customer,
  OperationalCost,
  Order,
  OrderWithRelations,
  Trip,
} from "@/lib/types";

/* ---------- Coercion helpers (numeric dari Postgres kadang string) ---------- */

const num = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const str = (v: unknown): string => (v == null ? "" : String(v));

const nullableStr = (v: unknown): string | null =>
  v == null || String(v) === "" ? null : String(v);

/* ---------- Mappers ---------- */

function mapTrip(r: Record<string, unknown>): Trip {
  return {
    id: str(r.id),
    name: str(r.name),
    destination: str(r.destination),
    start_date: str(r.start_date),
    end_date: str(r.end_date),
    target_kurs: num(r.target_kurs),
    status: (r.status ?? "Planning") as Trip["status"],
    created_at: str(r.created_at),
  };
}

function mapCustomer(r: Record<string, unknown>): Customer {
  return {
    id: str(r.id),
    name: str(r.name),
    whatsapp_number: str(r.whatsapp_number),
    address: nullableStr(r.address),
    created_at: str(r.created_at),
  };
}

function mapOrder(r: Record<string, unknown>): Order {
  return {
    id: str(r.id),
    customer_id: str(r.customer_id),
    trip_id: r.trip_id == null ? null : str(r.trip_id),
    item_name: str(r.item_name),
    item_price_foreign: num(r.item_price_foreign),
    foreign_currency: str(r.foreign_currency),
    exchange_rate_used: num(r.exchange_rate_used),
    calculated_price_idr: num(r.calculated_price_idr),
    quantity: Math.max(1, Math.round(num(r.quantity))),
    shipping_method: (r.shipping_method ?? "Handcarry") as Order["shipping_method"],
    status: (r.status ?? "Pending") as Order["status"],
    paid_amount_idr: num(r.paid_amount_idr),
    payment_proof_url: nullableStr(r.payment_proof_url),
    notes: nullableStr(r.notes),
    created_at: str(r.created_at),
  };
}

function noTripStub(): Trip {
  return {
    id: "",
    name: NO_TRIP_LABEL,
    destination: "",
    start_date: "",
    end_date: "",
    target_kurs: 0,
    status: "Planning",
    created_at: "",
  };
}

function mapOrderWithRelations(r: Record<string, unknown>): OrderWithRelations {
  const rawTrip = r.trip as Record<string, unknown> | null | undefined;
  const trip =
    rawTrip && typeof rawTrip.id === "string" && rawTrip.id
      ? mapTrip(rawTrip)
      : noTripStub();
  return {
    ...mapOrder(r),
    customer: mapCustomer((r.customer ?? {}) as Record<string, unknown>),
    trip,
  };
}

function mapCost(r: Record<string, unknown>): OperationalCost {
  return {
    id: str(r.id),
    trip_id: str(r.trip_id),
    category: (r.category ?? "Lainnya") as OperationalCost["category"],
    amount_idr: num(r.amount_idr),
    notes: nullableStr(r.notes),
    created_at: str(r.created_at),
  };
}

function mapCostWithTrip(r: Record<string, unknown>): CostWithTrip {
  return {
    ...mapCost(r),
    trip: mapTrip((r.trip ?? {}) as Record<string, unknown>),
  };
}

/* ---------- Error helper ---------- */

function toErrorMessage(e: unknown, fallback: string): Error {
  if (e && typeof e === "object" && "message" in e) {
    const msg = String((e as { message: unknown }).message);
    return new Error(msg || fallback);
  }
  return new Error(fallback);
}

/* ---------- TRIPS ---------- */

export async function fetchTrips(): Promise<Trip[]> {
  if (!isSupabaseConfigured) return localDb.fetchTrips();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw toErrorMessage(error, "Gagal memuat data trip");
  return (data ?? []).map((r) => mapTrip(r as unknown as Record<string, unknown>));
}

export async function createTrip(
  input: Omit<Trip, "id" | "created_at">,
): Promise<Trip> {
  if (!isSupabaseConfigured) return localDb.createTrip(input);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("trips")
    .insert(input)
    .select()
    .single();
  if (error) throw toErrorMessage(error, "Gagal membuat trip");
  return mapTrip(data as unknown as Record<string, unknown>);
}

export async function updateTrip(
  id: string,
  input: Partial<Omit<Trip, "id" | "created_at">>,
): Promise<void> {
  if (!isSupabaseConfigured) return localDb.updateTrip(id, input);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("trips").update(input).eq("id", id);
  if (error) throw toErrorMessage(error, "Gagal memperbarui trip");
}

export async function deleteTrip(id: string): Promise<void> {
  if (!isSupabaseConfigured) return localDb.deleteTrip(id);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23503") {
      throw new Error("Trip masih memiliki pesanan. Hapus pesanannya dulu sebelum menghapus trip.");
    }
    throw toErrorMessage(error, "Gagal menghapus trip");
  }
}

/* ---------- CUSTOMERS ---------- */

export async function fetchCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return localDb.fetchCustomers();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw toErrorMessage(error, "Gagal memuat data customer");
  return (data ?? []).map((r) => mapCustomer(r as unknown as Record<string, unknown>));
}

export async function createCustomer(
  input: Omit<Customer, "id" | "created_at">,
): Promise<Customer> {
  if (!isSupabaseConfigured) return localDb.createCustomer(input);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(input)
    .select()
    .single();
  if (error) throw toErrorMessage(error, "Gagal membuat customer");
  return mapCustomer(data as unknown as Record<string, unknown>);
}

export async function updateCustomer(
  id: string,
  input: Partial<Omit<Customer, "id" | "created_at">>,
): Promise<void> {
  if (!isSupabaseConfigured) return localDb.updateCustomer(id, input);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("customers").update(input).eq("id", id);
  if (error) throw toErrorMessage(error, "Gagal memperbarui customer");
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!isSupabaseConfigured) return localDb.deleteCustomer(id);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23503") {
      throw new Error("Customer masih memiliki pesanan. Hapus pesanannya dulu sebelum menghapus customer.");
    }
    throw toErrorMessage(error, "Gagal menghapus customer");
  }
}

/* ---------- ORDERS ---------- */

const ORDER_SELECT = "*, customer:customers(*), trip:trips(*)";

export async function fetchOrders(): Promise<OrderWithRelations[]> {
  if (!isSupabaseConfigured) return localDb.fetchOrders();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw toErrorMessage(error, "Gagal memuat data pesanan");
  return (data ?? []).map((r) =>
    mapOrderWithRelations(r as unknown as Record<string, unknown>),
  );
}

export async function fetchOrdersByTrip(tripId: string): Promise<OrderWithRelations[]> {
  if (!isSupabaseConfigured) return localDb.fetchOrdersByTrip(tripId);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw toErrorMessage(error, "Gagal memuat data pesanan");
  return (data ?? []).map((r) =>
    mapOrderWithRelations(r as unknown as Record<string, unknown>),
  );
}

export type OrderInput = Omit<Order, "id" | "created_at">;

export async function createOrder(input: OrderInput): Promise<Order> {
  if (!isSupabaseConfigured) return localDb.createOrder(input);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .insert(input)
    .select()
    .single();
  if (error) throw toErrorMessage(error, "Gagal membuat pesanan");
  return mapOrder(data as unknown as Record<string, unknown>);
}

export async function updateOrder(
  id: string,
  input: Partial<OrderInput>,
): Promise<void> {
  if (!isSupabaseConfigured) return localDb.updateOrder(id, input);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("orders").update(input).eq("id", id);
  if (error) throw toErrorMessage(error, "Gagal memperbarui pesanan");
}

export async function deleteOrder(id: string): Promise<void> {
  if (!isSupabaseConfigured) return localDb.deleteOrder(id);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw toErrorMessage(error, "Gagal menghapus pesanan");
}

/* ---------- OPERATIONAL COSTS ---------- */

export async function fetchCosts(): Promise<CostWithTrip[]> {
  if (!isSupabaseConfigured) return localDb.fetchCosts();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("operational_costs")
    .select("*, trip:trips(*)")
    .order("created_at", { ascending: false });
  if (error) throw toErrorMessage(error, "Gagal memuat biaya operasional");
  return (data ?? []).map((r) =>
    mapCostWithTrip(r as unknown as Record<string, unknown>),
  );
}

export async function fetchCostsByTrip(tripId: string): Promise<OperationalCost[]> {
  if (!isSupabaseConfigured) return localDb.fetchCostsByTrip(tripId);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("operational_costs")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw toErrorMessage(error, "Gagal memuat biaya operasional");
  return (data ?? []).map((r) => mapCost(r as unknown as Record<string, unknown>));
}

export type CostInput = Omit<OperationalCost, "id" | "created_at">;

export async function createCost(input: CostInput): Promise<OperationalCost> {
  if (!isSupabaseConfigured) return localDb.createCost(input);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("operational_costs")
    .insert(input)
    .select()
    .single();
  if (error) throw toErrorMessage(error, "Gagal mencatat biaya operasional");
  return mapCost(data as unknown as Record<string, unknown>);
}

export async function updateCost(
  id: string,
  input: Partial<CostInput>,
): Promise<void> {
  if (!isSupabaseConfigured) return localDb.updateCost(id, input);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("operational_costs").update(input).eq("id", id);
  if (error) throw toErrorMessage(error, "Gagal memperbarui biaya operasional");
}

export async function deleteCost(id: string): Promise<void> {
  if (!isSupabaseConfigured) return localDb.deleteCost(id);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("operational_costs").delete().eq("id", id);
  if (error) throw toErrorMessage(error, "Gagal menghapus biaya operasional");
}
