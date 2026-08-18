"use client";

import { NO_TRIP_LABEL } from "@/lib/constants";
import type {
  CostWithTrip,
  Customer,
  OperationalCost,
  Order,
  OrderWithRelations,
  Trip,
} from "@/lib/types";

/**
 * Mode Lokal — penyimpanan data di localStorage browser.
 *
 * Dipakai otomatis ketika Supabase belum dikonfigurasi, sehingga seluruh
 * fitur aplikasi (trip, pesanan, tagihan WA, label resi, biaya operasional)
 * tetap bisa dicoba penuh tanpa database. Data contoh dimuat saat pertama
 * kali diakses, dan bisa di-reset dari banner "Mode Lokal" di Dashboard.
 */

const STORAGE_KEY = "agung-jastip:local-db:v2";

interface LocalDatabase {
  trips: Trip[];
  customers: Customer[];
  orders: Order[];
  costs: OperationalCost[];
}

/* ---------- Helpers ---------- */

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DAY_MS = 86_400_000;

/** Tanggal YYYY-MM-DD relatif dari hari ini (offset hari). */
function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

/** Timestamp ISO penuh relatif dari hari ini. */
function isoFull(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString();
}

function sortNewest<T extends { created_at: string; id: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
  );
}

/* ---------- Data contoh ---------- */

function buildSeed(): LocalDatabase {
  const customers: Customer[] = [
    {
      id: "cust-1",
      name: "Siti Rahma",
      whatsapp_number: "081234567890",
      address: "Jl. Melati No. 12, Bandung, Jawa Barat",
      created_at: isoFull(-40),
    },
    {
      id: "cust-2",
      name: "Budi Santoso",
      whatsapp_number: "085678901234",
      address: "Jl. Kenanga Raya 88, Jakarta Selatan",
      created_at: isoFull(-36),
    },
    {
      id: "cust-3",
      name: "Dewi Lestari",
      whatsapp_number: "081398765432",
      address: "Perum Griya Asri Blok C5, Surabaya, Jawa Timur",
      created_at: isoFull(-30),
    },
    {
      id: "cust-4",
      name: "Rizky Pratama",
      whatsapp_number: "082145678912",
      address: "Jl. Anggrek No. 3, Yogyakarta",
      created_at: isoFull(-25),
    },
    {
      id: "cust-5",
      name: "Maya Anggraini",
      whatsapp_number: "087812345678",
      address: "Jl. Cempaka Putih Tengah 21, Jakarta Pusat",
      created_at: isoFull(-20),
    },
  ];

  const trips: Trip[] = [
    {
      id: "trip-1",
      name: "Trip Jepang Osaka–Tokyo",
      destination: "Osaka–Tokyo",
      start_date: isoDay(-18),
      end_date: isoDay(3),
      target_kurs: 110,
      status: "On Trip",
      created_at: isoFull(-20),
    },
    {
      id: "trip-2",
      name: "Trip Korea Seoul",
      destination: "Seoul",
      start_date: isoDay(25),
      end_date: isoDay(32),
      target_kurs: 12.2,
      status: "Planning",
      created_at: isoFull(-10),
    },
    {
      id: "trip-3",
      name: "Trip Jepang Musim Semi",
      destination: "Tokyo",
      start_date: isoDay(-75),
      end_date: isoDay(-65),
      target_kurs: 110,
      status: "Completed",
      created_at: isoFull(-80),
    },
  ];

  const orders: Order[] = [
    {
      id: "ord-1",
      customer_id: "cust-1",
      trip_id: "trip-1",
      item_name: "Anessa Perfect UV Milk 60ml",
      item_price_foreign: 3800,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 418000,
      quantity: 2,
      shipping_method: "Handcarry",
      status: "Full Paid",
      paid_amount_idr: 836000,
      payment_proof_url: null,
      notes: "Sudah dikirim bukti transfer",
      created_at: isoFull(-14),
    },
    {
      id: "ord-2",
      customer_id: "cust-2",
      trip_id: "trip-1",
      item_name: "Kikkoman Soy Sauce 1L",
      item_price_foreign: 450,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 49500,
      quantity: 6,
      shipping_method: "Express",
      status: "DP Paid",
      paid_amount_idr: 150000,
      payment_proof_url: null,
      notes: null,
      created_at: isoFull(-13),
    },
    {
      id: "ord-3",
      customer_id: "cust-3",
      trip_id: "trip-1",
      item_name: "Skechers Go Walk 6",
      item_price_foreign: 8500,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 935000,
      quantity: 1,
      shipping_method: "Cargo Laut",
      status: "Pending",
      paid_amount_idr: 0,
      payment_proof_url: null,
      notes: "Ukuran 41, warna navy",
      created_at: isoFull(-12),
    },
    {
      id: "ord-4",
      customer_id: "cust-4",
      trip_id: "trip-1",
      item_name: "One Piece Manga Vol. 105",
      item_price_foreign: 550,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 60500,
      quantity: 3,
      shipping_method: "Handcarry",
      status: "Full Paid",
      paid_amount_idr: 181500,
      payment_proof_url: null,
      notes: null,
      created_at: isoFull(-11),
    },
    {
      id: "ord-5",
      customer_id: "cust-5",
      trip_id: "trip-1",
      item_name: "Matcha Powder Uji 100g",
      item_price_foreign: 2200,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 242000,
      quantity: 2,
      shipping_method: "Express",
      status: "Pending",
      paid_amount_idr: 0,
      payment_proof_url: null,
      notes: "Minta yang ceremonial grade",
      created_at: isoFull(-10),
    },
    {
      id: "ord-6",
      customer_id: "cust-2",
      trip_id: "trip-1",
      item_name: "Uniqlo Heattech Crewneck",
      item_price_foreign: 1900,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 209000,
      quantity: 4,
      shipping_method: "Handcarry",
      status: "Out of Stock/Refund",
      paid_amount_idr: 836000,
      payment_proof_url: null,
      notes: "Barang habis, dana dikembalikan",
      created_at: isoFull(-9),
    },
    {
      id: "ord-7",
      customer_id: "cust-1",
      trip_id: "trip-2",
      item_name: "Romand Glasting Lip Tint",
      item_price_foreign: 15000,
      foreign_currency: "KRW",
      exchange_rate_used: 12.2,
      calculated_price_idr: 183000,
      quantity: 3,
      shipping_method: "Handcarry",
      status: "DP Paid",
      paid_amount_idr: 100000,
      payment_proof_url: null,
      notes: null,
      created_at: isoFull(-8),
    },
    {
      id: "ord-8",
      customer_id: "cust-4",
      trip_id: "trip-2",
      item_name: "Tteokbokki Cheese Snack (6 pack)",
      item_price_foreign: 8000,
      foreign_currency: "KRW",
      exchange_rate_used: 12.2,
      calculated_price_idr: 97600,
      quantity: 5,
      shipping_method: "Express",
      status: "Pending",
      paid_amount_idr: 0,
      payment_proof_url: null,
      notes: null,
      created_at: isoFull(-7),
    },
    {
      id: "ord-9",
      customer_id: "cust-3",
      trip_id: "trip-3",
      item_name: "Shiseido Tsubaki Shampoo 490ml",
      item_price_foreign: 1500,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 165000,
      quantity: 2,
      shipping_method: "Cargo Laut",
      status: "Full Paid",
      paid_amount_idr: 330000,
      payment_proof_url: null,
      notes: null,
      created_at: isoFull(-70),
    },
    {
      id: "ord-10",
      customer_id: "cust-5",
      trip_id: "trip-3",
      item_name: "Pilot Frixion Ball (set 5)",
      item_price_foreign: 1100,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 121000,
      quantity: 5,
      shipping_method: "Handcarry",
      status: "Full Paid",
      paid_amount_idr: 605000,
      payment_proof_url: null,
      notes: null,
      created_at: isoFull(-69),
    },
    {
      // Pesanan tanpa trip — contoh jastip langsung (trip opsional).
      id: "ord-11",
      customer_id: "cust-4",
      trip_id: null,
      item_name: "Senka Perfect Whip 120g",
      item_price_foreign: 650,
      foreign_currency: "JPY",
      exchange_rate_used: 110,
      calculated_price_idr: 71500,
      quantity: 4,
      shipping_method: "Handcarry",
      status: "Full Paid",
      paid_amount_idr: 286000,
      payment_proof_url: null,
      notes: "Pesanan langsung tanpa trip",
      created_at: isoFull(-5),
    },
  ];

  const costs: OperationalCost[] = [
    {
      id: "cost-1",
      trip_id: "trip-1",
      category: "Makan",
      amount_idr: 250000,
      notes: "Makan siang tim di Dotonbori",
      created_at: isoFull(-14),
    },
    {
      id: "cost-2",
      trip_id: "trip-1",
      category: "Transport",
      amount_idr: 200000,
      notes: "Top-up ICOCA transport",
      created_at: isoFull(-13),
    },
    {
      id: "cost-3",
      trip_id: "trip-1",
      category: "Cargo",
      amount_idr: 85000,
      notes: "Kirim parcel via kurir lokal",
      created_at: isoFull(-12),
    },
    {
      id: "cost-4",
      trip_id: "trip-1",
      category: "Akomodasi",
      amount_idr: 900000,
      notes: "Hotel Osaka 2 malam (bagian)",
      created_at: isoFull(-11),
    },
    {
      id: "cost-5",
      trip_id: "trip-2",
      category: "Transport",
      amount_idr: 1500000,
      notes: "Booking tiket pesawat Seoul",
      created_at: isoFull(-6),
    },
    {
      id: "cost-6",
      trip_id: "trip-3",
      category: "Cargo",
      amount_idr: 450000,
      notes: "Cargo laut kontainer kecil",
      created_at: isoFull(-68),
    },
  ];

  return { trips, customers, orders, costs };
}

/* ---------- Akses penyimpanan ---------- */

function readDb(): LocalDatabase {
  if (typeof window === "undefined") {
    throw new Error("Mode Lokal hanya bisa diakses dari browser.");
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDatabase;
      if (
        parsed &&
        Array.isArray(parsed.trips) &&
        Array.isArray(parsed.customers) &&
        Array.isArray(parsed.orders) &&
        Array.isArray(parsed.costs)
      ) {
        return parsed;
      }
    }
  } catch {
    // Data rusak → seed ulang di bawah.
  }
  const seeded = buildSeed();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeDb(db: LocalDatabase): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/** Timbun ulang seluruh data contoh (dipakai tombol "Reset data contoh"). */
export function resetLocalData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSeed()));
}

/* ---------- Join relasi (menggantikan embed Supabase) ---------- */

function emptyCustomer(): Customer {
  return {
    id: "",
    name: "—",
    whatsapp_number: "",
    address: null,
    created_at: "",
  };
}

function emptyTrip(): Trip {
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

function withRelations(db: LocalDatabase, order: Order): OrderWithRelations {
  return {
    ...order,
    customer: db.customers.find((c) => c.id === order.customer_id) ?? emptyCustomer(),
    trip: db.trips.find((t) => t.id === order.trip_id) ?? emptyTrip(),
  };
}

function withTrip(db: LocalDatabase, cost: OperationalCost): CostWithTrip {
  return { ...cost, trip: db.trips.find((t) => t.id === cost.trip_id) ?? emptyTrip() };
}

/* ---------- TRIPS ---------- */

export async function fetchTrips(): Promise<Trip[]> {
  return sortNewest(readDb().trips);
}

export async function createTrip(
  input: Omit<Trip, "id" | "created_at">,
): Promise<Trip> {
  const db = readDb();
  const trip: Trip = { ...input, id: uid(), created_at: new Date().toISOString() };
  db.trips = [trip, ...db.trips];
  writeDb(db);
  return trip;
}

export async function updateTrip(
  id: string,
  input: Partial<Omit<Trip, "id" | "created_at">>,
): Promise<void> {
  const db = readDb();
  db.trips = db.trips.map((t) => (t.id === id ? { ...t, ...input } : t));
  writeDb(db);
}

export async function deleteTrip(id: string): Promise<void> {
  const db = readDb();
  if (db.orders.some((o) => o.trip_id === id)) {
    throw new Error("Trip masih memiliki pesanan. Hapus pesanannya dulu sebelum menghapus trip.");
  }
  if (db.costs.some((c) => c.trip_id === id)) {
    throw new Error("Trip masih memiliki biaya operasional. Hapus biayanya dulu sebelum menghapus trip.");
  }
  db.trips = db.trips.filter((t) => t.id !== id);
  writeDb(db);
}

/* ---------- CUSTOMERS ---------- */

export async function fetchCustomers(): Promise<Customer[]> {
  return sortNewest(readDb().customers);
}

export async function createCustomer(
  input: Omit<Customer, "id" | "created_at">,
): Promise<Customer> {
  const db = readDb();
  const customer: Customer = {
    ...input,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  db.customers = [customer, ...db.customers];
  writeDb(db);
  return customer;
}

export async function updateCustomer(
  id: string,
  input: Partial<Omit<Customer, "id" | "created_at">>,
): Promise<void> {
  const db = readDb();
  db.customers = db.customers.map((c) => (c.id === id ? { ...c, ...input } : c));
  writeDb(db);
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = readDb();
  if (db.orders.some((o) => o.customer_id === id)) {
    throw new Error(
      "Customer masih memiliki pesanan. Hapus pesanannya dulu sebelum menghapus customer.",
    );
  }
  db.customers = db.customers.filter((c) => c.id !== id);
  writeDb(db);
}

/* ---------- ORDERS ---------- */

export async function fetchOrders(): Promise<OrderWithRelations[]> {
  const db = readDb();
  return sortNewest(db.orders).map((o) => withRelations(db, o));
}

export async function fetchOrdersByTrip(tripId: string): Promise<OrderWithRelations[]> {
  const db = readDb();
  return sortNewest(db.orders.filter((o) => o.trip_id === tripId)).map((o) =>
    withRelations(db, o),
  );
}

export type OrderInput = Omit<Order, "id" | "created_at">;

export async function createOrder(input: OrderInput): Promise<Order> {
  const db = readDb();
  const order: Order = { ...input, id: uid(), created_at: new Date().toISOString() };
  db.orders = [order, ...db.orders];
  writeDb(db);
  return order;
}

export async function updateOrder(
  id: string,
  input: Partial<OrderInput>,
): Promise<void> {
  const db = readDb();
  db.orders = db.orders.map((o) => (o.id === id ? { ...o, ...input } : o));
  writeDb(db);
}

export async function deleteOrder(id: string): Promise<void> {
  const db = readDb();
  db.orders = db.orders.filter((o) => o.id !== id);
  writeDb(db);
}

/* ---------- OPERATIONAL COSTS ---------- */

export async function fetchCosts(): Promise<CostWithTrip[]> {
  const db = readDb();
  return sortNewest(db.costs).map((c) => withTrip(db, c));
}

export async function fetchCostsByTrip(tripId: string): Promise<OperationalCost[]> {
  const db = readDb();
  return sortNewest(db.costs.filter((c) => c.trip_id === tripId));
}

export type CostInput = Omit<OperationalCost, "id" | "created_at">;

export async function createCost(input: CostInput): Promise<OperationalCost> {
  const db = readDb();
  const cost: OperationalCost = {
    ...input,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  db.costs = [cost, ...db.costs];
  writeDb(db);
  return cost;
}

export async function updateCost(
  id: string,
  input: Partial<CostInput>,
): Promise<void> {
  const db = readDb();
  db.costs = db.costs.map((c) => (c.id === id ? { ...c, ...input } : c));
  writeDb(db);
}

export async function deleteCost(id: string): Promise<void> {
  const db = readDb();
  db.costs = db.costs.filter((c) => c.id !== id);
  writeDb(db);
}
