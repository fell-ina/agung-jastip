"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Settings2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES } from "@/lib/constants";
import { getExchangeRate, type ExchangeSource } from "@/lib/exchange";
import { formatRate } from "@/lib/format";

const WATCH_LIST = ["JPY", "KRW", "USD", "SGD", "MYR", "THB"];

const sourceBadge: Record<ExchangeSource, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  manual: { label: "Manual", className: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300" },
  fallback: { label: "Cadangan", className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300" },
};

interface RateEntry {
  rate: number;
  source: ExchangeSource;
}

export function KursWidget({ compact = false }: { compact?: boolean }) {
  const [rates, setRates] = useState<Record<string, RateEntry | null>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  async function fetchRates(): Promise<{
    rates: Record<string, RateEntry | null>;
    lastUpdate: string;
  }> {
    const entries = await Promise.all(
      WATCH_LIST.map(async (code) => {
        const result = await getExchangeRate(code, "IDR");
        return [code, { rate: result.rate, source: result.source }] as const;
      }),
    );
    return {
      rates: Object.fromEntries(entries),
      lastUpdate: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  useEffect(() => {
    let alive = true;
    void fetchRates().then((result) => {
      if (!alive) return;
      setRates(result.rates);
      setLastUpdate(result.lastUpdate);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card size={compact ? "sm" : "default"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-emerald-500" />
          Kurs Live → IDR
        </CardTitle>
        <CardDescription>
          {loading
            ? "Memuat kurs..."
            : lastUpdate
              ? `Diperbarui ${lastUpdate} · otomatis dari API gratis`
              : "Kurs diperbarui otomatis"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {WATCH_LIST.map((code) => {
            const entry = rates[code];
            const currency = CURRENCIES.find((c) => c.code === code);
            return (
              <div
                key={code}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                    {code}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {currency?.name ?? code}
                  </span>
                </div>
                {loading ? (
                  <Skeleton className="h-5 w-20" />
                ) : entry ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      Rp {formatRate(entry.rate)}
                    </span>
                    <Badge variant="outline" className={sourceBadge[entry.source].className}>
                      {sourceBadge[entry.source].label}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setLoading(true);
              const result = await fetchRates();
              setRates(result.rates);
              setLastUpdate(result.lastUpdate);
              setLoading(false);
            }}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Perbarui
          </Button>
          <Button size="sm" variant="ghost" render={<Link href="/settings" />}>
            <Settings2 />
            Kelola kurs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
