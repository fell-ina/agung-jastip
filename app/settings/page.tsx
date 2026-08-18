"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Info,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { changePassword } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "@/lib/constants";
import {
  getExchangeRate,
  getStoredOverride,
  setStoredOverride,
  type ExchangeSource,
} from "@/lib/exchange";
import { formatRate } from "@/lib/format";
import { ACCOUNT_NAME, ACCOUNT_NUMBER, BANK_NAME, OWNER_NAME } from "@/lib/whatsapp";

interface RateEntry {
  rate: number;
  source: ExchangeSource;
}

const sourceBadge: Record<ExchangeSource, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  manual: { label: "Manual", className: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300" },
  fallback: { label: "Cadangan", className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300" },
};

export default function SettingsPage() {
  const [rates, setRates] = useState<Record<string, RateEntry | null>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [busyPw, setBusyPw] = useState(false);

  async function fetchRates(): Promise<{
    rates: Record<string, RateEntry | null>;
    overrides: Record<string, string>;
  }> {
    const entries = await Promise.all(
      CURRENCIES.map(async (c) => {
        const result = await getExchangeRate(c.code, "IDR");
        return [c.code, { rate: result.rate, source: result.source }] as const;
      }),
    );
    const overrideMap: Record<string, string> = {};
    CURRENCIES.forEach((c) => {
      const value = getStoredOverride(c.code, "IDR");
      if (value !== null) overrideMap[c.code] = String(value);
    });
    return {
      rates: Object.fromEntries(entries),
      overrides: overrideMap,
    };
  }

  useEffect(() => {
    let alive = true;
    void fetchRates().then((result) => {
      if (!alive) return;
      setRates(result.rates);
      setOverrides(result.overrides);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    const result = await fetchRates();
    setRates(result.rates);
    setOverrides(result.overrides);
    setLoading(false);
    setRefreshing(false);
    toast.success("Kurs berhasil dimuat ulang");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwCurrent) return toast.error("Isi sandi lama");
    if (pwNew.length < 6) return toast.error("Sandi baru minimal 6 karakter");
    if (pwNew !== pwConfirm) return toast.error("Konfirmasi sandi tidak cocok");
    setBusyPw(true);
    try {
      const result = await changePassword(pwCurrent, pwNew);
      if (result === "wrong") {
        toast.error("Sandi lama salah");
        return;
      }
      toast.success("Sandi berhasil diganti");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } finally {
      setBusyPw(false);
    }
  }

  async function handleSaveOverride(code: string) {
    const raw = overrides[code];
    if (!raw || raw.trim() === "") {
      setStoredOverride(code, "IDR", null);
      toast.success(`Override kurs ${code} dihapus`);
      const result = await fetchRates();
      setRates(result.rates);
      setOverrides(result.overrides);
      return;
    }
    const value = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Nilai kurs tidak valid");
      return;
    }
    setStoredOverride(code, "IDR", value);
    toast.success(`Kurs manual ${code} disimpan`);
    const result = await fetchRates();
    setRates(result.rates);
    setOverrides(result.overrides);
  }

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Kelola kurs manual, cek sumber kurs live, dan informasi akun WhatsApp tagihan."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Kurs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4 text-emerald-500" /> Kurs Mata Uang → IDR
            </CardTitle>
            <CardDescription>
              Kurs live otomatis dari API gratis (open.er-api.com / frankfurter.app, update harian).
              Saat API tidak terjangkau, isi kurs manual sebagai pengganti — override tersimpan di browser ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CURRENCIES.map((c) => {
                const entry = rates[c.code];
                return (
                  <div key={c.code} className="grid grid-cols-1 items-center gap-2 rounded-lg border px-3 py-2.5 sm:grid-cols-[80px_1fr_auto_1fr]">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                        {c.code}
                      </span>
                      <span className="text-sm text-muted-foreground sm:hidden">{c.name}</span>
                    </div>
                    <div>
                      <div className="hidden text-xs text-muted-foreground sm:block">{c.name}</div>
                      {loading ? (
                        <span className="text-sm text-muted-foreground">Memuat...</span>
                      ) : entry ? (
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">
                            Rp {formatRate(entry.rate)}
                          </span>
                          <Badge variant="outline" className={sourceBadge[entry.source].className}>
                            {sourceBadge[entry.source].label}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="h-px bg-border sm:hidden" />
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`override-${c.code}`} className="text-xs text-muted-foreground sm:hidden">
                        Kurs manual:
                      </Label>
                      <Input
                        id={`override-${c.code}`}
                        className="h-8 w-full sm:w-32"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        placeholder="kosongkan utk auto"
                        value={overrides[c.code] ?? ""}
                        onChange={(e) => setOverrides((prev) => ({ ...prev, [c.code]: e.target.value }))}
                      />
                      <Button size="icon-sm" variant="outline" onClick={() => void handleSaveOverride(c.code)} title="Simpan kurs manual">
                        <Save />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={refreshing ? "animate-spin" : ""} /> Muat ulang semua
              </Button>
              <p className="text-xs text-muted-foreground">
                Prioritas: kurs manual &gt; live &gt; cadangan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info akun WhatsApp */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="size-4 text-emerald-500" /> Rekening Tagihan
              </CardTitle>
              <CardDescription>
                Dipakai dalam narasi WhatsApp tagihan otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atas nama (chat)</span>
                <span className="font-medium">{OWNER_NAME}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">{BANK_NAME}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. rekening</span>
                <span className="font-medium tabular-nums">{ACCOUNT_NUMBER}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">a.n.</span>
                <span className="font-medium">{ACCOUNT_NAME}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-4 text-emerald-500" /> Ubah Data Rekening
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Data rekening, nama pemilik, dan template narasi WhatsApp diatur di file{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">lib/whatsapp.ts</code>.
                Edit lalu jalankan ulang aplikasi.
              </CardDescription>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.open("https://wa.me/?text=Halo", "_blank")}
              >
                <MessageCircle /> Uji link WhatsApp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sandi masuk */}
      {!isSupabaseConfigured ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-emerald-500" /> Ganti Sandi Masuk
            </CardTitle>
            <CardDescription>
              Mode Lokal menyimpan sandi di browser ini. Saat Supabase terhubung,
              login akan memakai akun Supabase (email + sandi).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleChangePassword}
              className="grid max-w-md gap-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="pw-current">Sandi Lama</Label>
                  <Input
                    id="pw-current"
                    type="password"
                    autoComplete="current-password"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pw-new">Sandi Baru (min. 6 karakter)</Label>
                  <Input
                    id="pw-new"
                    type="password"
                    autoComplete="new-password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid max-w-60 gap-2">
                <Label htmlFor="pw-confirm">Ulangi Sandi Baru</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  required
                />
              </div>
              <div>
                <Button type="submit" disabled={busyPw}>
                  <Save /> {busyPw ? "Menyimpan..." : "Simpan Sandi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Autentikasi
            </CardTitle>
            <CardDescription>
              Supabase terhubung — login memakai akun Supabase (email + sandi).
              Pengaturan sandi dan reset sandi dikelola lewat dashboard Supabase
              (Authentication → Users).
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
