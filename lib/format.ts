import { CURRENCIES } from "@/lib/constants";
import type { Order } from "@/lib/types";

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatForeign(amount: number, currency: string): string {
  const symbol = currencySymbol(currency);
  const digits = Number.isInteger(amount) ? 0 : 2;
  return `${symbol}${formatNumber(amount, digits)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRate(rate: number): string {
  return formatNumber(rate, 4);
}

/** Total nilai jual 1 order dalam IDR (harga per item × qty). */
export function orderTotal(o: Pick<Order, "calculated_price_idr" | "quantity">): number {
  return o.calculated_price_idr * o.quantity;
}

/** Sisa tagihan yang belum dibayar customer. */
export function orderRemaining(o: Order): number {
  return Math.max(0, orderTotal(o) - o.paid_amount_idr);
}

/** Nomor WhatsApp dinormalisasi (0xxx → 62xxx) untuk link wa.me */
export function normalizePhone(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits;
}
