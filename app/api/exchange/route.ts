import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route: Ambil kurs live tanpa API key.
 * 1) open.er-api.com  — 160+ mata uang, update harian, gratis tanpa key.
 * 2) frankfurter.app  — data ECB, cadangan bila provider pertama gagal.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = (url.searchParams.get("from") ?? "JPY").toUpperCase().slice(0, 3);
  const to = (url.searchParams.get("to") ?? "IDR").toUpperCase().slice(0, 3);

  // Provider 1: open.er-api.com
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 21600 }, // cache 6 jam (kurs harian)
    });
    if (res.ok) {
      const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
      const rate = data.rates?.[to];
      if (data.result === "success" && typeof rate === "number" && rate > 0) {
        return NextResponse.json({ from, to, rate, source: "open.er-api.com" });
      }
    }
  } catch {
    // lanjut ke fallback
  }

  // Provider 2: frankfurter.app (ECB)
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      next: { revalidate: 21600 },
    });
    if (res.ok) {
      const data = (await res.json()) as { rates?: Record<string, number> };
      const rate = data.rates?.[to];
      if (typeof rate === "number" && rate > 0) {
        return NextResponse.json({ from, to, rate, source: "frankfurter.app" });
      }
    }
  } catch {
    // abaikan
  }

  return NextResponse.json(
    { from, to, rate: null, source: "unavailable" },
    { status: 200 },
  );
}
