import type {
  CostCategory,
  OrderStatus,
  ShippingMethod,
  TripStatus,
} from "@/lib/types";

export const APP_NAME = "Agung Jastip";
export const APP_TAGLINE = "Jasa Titip & Belanja";

/** Label untuk pesanan yang tidak terikat ke trip mana pun. */
export const NO_TRIP_LABEL = "Tanpa Trip";

export const CURRENCIES: { code: string; name: string; symbol: string }[] = [
  { code: "JPY", name: "Yen Jepang", symbol: "¥" },
  { code: "KRW", name: "Won Korea", symbol: "₩" },
  { code: "USD", name: "Dolar AS", symbol: "$" },
  { code: "SGD", name: "Dolar Singapura", symbol: "S$" },
  { code: "MYR", name: "Ringgit Malaysia", symbol: "RM" },
  { code: "THB", name: "Baht Thailand", symbol: "฿" },
  { code: "TWD", name: "Dolar Taiwan", symbol: "NT$" },
  { code: "HKD", name: "Dolar Hong Kong", symbol: "HK$" },
  { code: "CNY", name: "Yuan China", symbol: "CN¥" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Poundsterling", symbol: "£" },
  { code: "AUD", name: "Dolar Australia", symbol: "A$" },
];

export const DEFAULT_FOREIGN_CURRENCY = "JPY";

export const SHIPPING_METHODS: ShippingMethod[] = [
  "Handcarry",
  "Express",
  "Cargo Laut",
];

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "DP Paid",
  "Full Paid",
  "Out of Stock/Refund",
];

export const TRIP_STATUSES: TripStatus[] = [
  "Planning",
  "On Trip",
  "Completed",
  "Cancelled",
];

export const COST_CATEGORIES: CostCategory[] = [
  "Makan",
  "Cargo",
  "Transport",
  "Akomodasi",
  "Lainnya",
];

/**
 * Kurs cadangan (fallback) saat API kurs live tidak bisa dijangkau.
 * Nilai perkiraan — sebaiknya di-override manual di halaman Pengaturan.
 */
export const FALLBACK_RATES: Record<string, number> = {
  JPY: 110,
  KRW: 12.2,
  USD: 16000,
  SGD: 12000,
  MYR: 3600,
  THB: 480,
  TWD: 510,
  HKD: 2050,
  CNY: 2250,
  EUR: 17400,
  GBP: 20200,
  AUD: 10500,
};
