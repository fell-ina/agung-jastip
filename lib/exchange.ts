"use client";

import { FALLBACK_RATES } from "@/lib/constants";

export type ExchangeSource = "live" | "manual" | "fallback";

const OVERRIDE_KEY = "agung-jastip:exchange-overrides";

interface RateOverride {
  [pair: string]: number;
}

function readOverrides(): RateOverride {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as RateOverride) : {};
  } catch {
    return {};
  }
}

export function getStoredOverride(from: string, to: string): number | null {
  const overrides = readOverrides();
  const value = overrides[`${from}:${to}`];
  return typeof value === "number" && value > 0 ? value : null;
}

export function setStoredOverride(from: string, to: string, value: number | null) {
  if (typeof window === "undefined") return;
  const overrides = readOverrides();
  const key = `${from}:${to}`;
  if (value === null) delete overrides[key];
  else overrides[key] = value;
  window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
}

/** Ambil kurs live dari API route milik aplikasi (dengan cache server-side). */
export async function fetchLiveRate(from: string, to: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/exchange?from=${from}&to=${to}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { rate?: number | null };
    return typeof data.rate === "number" && data.rate > 0 ? data.rate : null;
  } catch {
    return null;
  }
}

/**
 * Dapatkan kurs dengan prioritas:
 * 1. Override manual (disimpan di localStorage via halaman Pengaturan)
 * 2. Kurs live dari API
 * 3. Nilai fallback statis
 */
export async function getExchangeRate(
  from: string,
  to: string,
): Promise<{ rate: number; source: ExchangeSource }> {
  const manual = getStoredOverride(from, to);
  if (manual) return { rate: manual, source: "manual" };

  const live = await fetchLiveRate(from, to);
  if (live) return { rate: live, source: "live" };

  const fallback = FALLBACK_RATES[from] ?? FALLBACK_RATES.JPY;
  return { rate: fallback, source: "fallback" };
}

/** Kalkulasi harga jual IDR dari harga asing × kurs. */
export function calculateIdr(priceForeign: number, rate: number): number {
  return Math.round((priceForeign * rate) / 10) * 10;
}
